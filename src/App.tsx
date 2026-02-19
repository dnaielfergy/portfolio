import { useEffect, useMemo, useRef, useState } from "react";

import { createIntroTimeline } from "./animation/introTimeline";
import { createVehicleTransformService } from "./animation/transformTimeline";
import { initWorld } from "./bootstrap/initWorld";
import { resolveEnterAction } from "./input/actionRouter";
import { useKeyboardController } from "./input/keyboardController";
import { findNearbyNode } from "./input/proximityDetector";
import { buildCollisionIndex, resolveMovementWithCollisions } from "./physics/collision";
import { resolveActivePlayerRadius } from "./physics/vehicleCollider";
import { resolveQualityTier } from "./postfx/qualityTier";
import { WorldCanvas } from "./scene/WorldCanvas";
import { useWorldStore, WorldStoreProvider } from "./state/worldStore";
import { CameraCalibrationProvider } from "./tuning/cameraCalibrationContext";
import { NodePositionCalibrationProvider } from "./tuning/nodePositionCalibrationContext";
import { CameraScaleCalibrationPanel } from "./ui/CameraScaleCalibrationPanel";
import { CheckpointPanel } from "./ui/CheckpointPanel";
import { FinalStatePanel } from "./ui/FinalStatePanel";
import { HUD } from "./ui/HUD";
import { NodePositionCalibrationPanel } from "./ui/NodePositionCalibrationPanel";
import { StartOverlay } from "./ui/StartOverlay";
import { TutorialOverlay } from "./ui/TutorialOverlay";
import type { InitWorldResult } from "./bootstrap/initWorld";

type MovementKey =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "KeyW"
  | "KeyA"
  | "KeyS"
  | "KeyD";

const PLAYER_BASE_SPEED = 12;
const PLAYER_MAX_SPEED = 25;
const PLAYER_BOOST_DELAY_SECONDS = 0.35;
const PLAYER_BOOST_ACCEL = 40;
const PLAYER_STOP_DECEL = 220;
const VELOCITY_EPSILON = 0.001;

function RuntimeApp({ world }: InitWorldResult): React.JSX.Element {
  const store = useWorldStore(world);
  const { state, dispatch } = store;

  const movementKeysRef = useRef<Set<MovementKey>>(new Set());
  const transformService = useMemo(
    () => createVehicleTransformService(world.config.vehicles.transformRules),
    [world.config.vehicles.transformRules],
  );
  const collisionIndex = useMemo(() => buildCollisionIndex(world.config.environment), [world.config.environment]);
  const activePlayerRadius = useMemo(
    () =>
      resolveActivePlayerRadius({
        worldConfig: world.config,
        activeVehicleStageId: state.activeVehicleStageId,
        transform: state.transform,
      }),
    [state.activeVehicleStageId, state.transform.fromStage, state.transform.status, state.transform.toStage, world.config],
  );
  const previousStageRef = useRef(state.activeVehicleStageId);
  const travelSpeedRef = useRef(0);
  const sustainedInputSecondsRef = useRef(0);
  const lastMoveDirectionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useKeyboardController({
    worldState: state.worldState,
    onEvent: dispatch,
    onMovementKey: (key, pressed) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(key)) {
        return;
      }

      const movementKey = key as MovementKey;
      if (pressed) {
        movementKeysRef.current.add(movementKey);
      } else {
        movementKeysRef.current.delete(movementKey);
      }
    },
    onEnter: () => {
      const event = resolveEnterAction(state, world.config);
      if (event) {
        dispatch(event);
      }
    },
    onEscape: () => {
      if (state.worldState === "checkpointOpen") {
        dispatch({ type: "CLOSE_CHECKPOINT" });
      }
    },
  });

  useEffect(() => {
    const tier = resolveQualityTier();
    dispatch({ type: "QUALITY_TIER_DETECTED", tier });
  }, [dispatch]);

  useEffect(() => {
    if (state.worldState !== "intro") {
      return;
    }

    let cancelled = false;
    const timeline = createIntroTimeline(world.config.intro);

    timeline
      .play()
      .then(() => {
        if (!cancelled) {
          dispatch({ type: "INTRO_COMPLETED" });
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, state.worldState, world.config.intro]);

  useEffect(() => {
    if (state.worldState !== "focusCharlotte") {
      return;
    }

    const timeout = window.setTimeout(() => {
      dispatch({ type: "FOCUS_CHARLOTTE_COMPLETED" });
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [dispatch, state.worldState]);

  useEffect(() => {
    if (state.worldState !== "transforming") {
      return;
    }

    const fromStage = previousStageRef.current;
    const toStage = state.activeVehicleStageId;
    let cancelled = false;

    transformService
      .trigger(fromStage, toStage, world.config.vehicles.transformRules, (progress) => {
        if (!cancelled) {
          dispatch({ type: "TRANSFORM_PROGRESS", progress });
        }
      })
      .then(() => {
        if (!cancelled) {
          dispatch({ type: "TRANSFORM_COMPLETED" });
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, state.activeVehicleStageId, state.worldState, transformService, world.config.vehicles.transformRules]);

  useEffect(() => {
    previousStageRef.current = state.activeVehicleStageId;
  }, [state.activeVehicleStageId]);

  useEffect(() => {
    if (state.worldState === "exploring") {
      return;
    }

    travelSpeedRef.current = 0;
    sustainedInputSecondsRef.current = 0;
    lastMoveDirectionRef.current = { x: 0, y: 0 };
  }, [state.worldState]);

  useEffect(() => {
    if (state.worldState !== "exploring" || state.player.movementLocked) {
      return;
    }

    let raf = 0;
    let lastTime = performance.now();

    const tick = (now: number): void => {
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;

      let inputX = 0;
      let inputY = 0;

      if (movementKeysRef.current.has("ArrowLeft") || movementKeysRef.current.has("KeyA")) inputX -= 1;
      if (movementKeysRef.current.has("ArrowRight") || movementKeysRef.current.has("KeyD")) inputX += 1;
      if (movementKeysRef.current.has("ArrowUp") || movementKeysRef.current.has("KeyW")) inputY += 1;
      if (movementKeysRef.current.has("ArrowDown") || movementKeysRef.current.has("KeyS")) inputY -= 1;

      const inputLength = Math.hypot(inputX, inputY);
      const hasInput = inputLength > 0;
      const normalizedInput = hasInput
        ? {
            x: inputX / inputLength,
            y: inputY / inputLength,
          }
        : { x: 0, y: 0 };
      const previousVelocity = state.player.velocity;
      const previousSpeed = Math.hypot(previousVelocity.x, previousVelocity.y);
      const activeDirection = hasInput
        ? normalizedInput
        : previousSpeed > VELOCITY_EPSILON
          ? {
              x: previousVelocity.x / previousSpeed,
              y: previousVelocity.y / previousSpeed,
            }
          : lastMoveDirectionRef.current;
      let nextSpeed = travelSpeedRef.current;

      if (hasInput) {
        sustainedInputSecondsRef.current += deltaSeconds;
        const isBoosting = sustainedInputSecondsRef.current >= PLAYER_BOOST_DELAY_SECONDS;
        if (nextSpeed < PLAYER_BASE_SPEED) {
          nextSpeed = PLAYER_BASE_SPEED;
        } else if (isBoosting) {
          nextSpeed = Math.min(PLAYER_MAX_SPEED, nextSpeed + PLAYER_BOOST_ACCEL * deltaSeconds);
        } else {
          nextSpeed = Math.min(nextSpeed, PLAYER_BASE_SPEED);
        }
        lastMoveDirectionRef.current = normalizedInput;
      } else {
        sustainedInputSecondsRef.current = 0;
        nextSpeed = Math.max(0, nextSpeed - PLAYER_STOP_DECEL * deltaSeconds);
      }

      const nextVelocity = {
        x: activeDirection.x * nextSpeed,
        y: activeDirection.y * nextSpeed,
      };
      const hasMovement = Math.hypot(nextVelocity.x, nextVelocity.y) > VELOCITY_EPSILON;

      if (hasMovement) {
        const resolved = resolveMovementWithCollisions({
          index: collisionIndex,
          position: state.player.position,
          velocity: nextVelocity,
          deltaSeconds,
          collision: {
            ...world.config.environment.collision,
            playerRadius: activePlayerRadius,
          },
        });
        const nextPosition = resolved.position;
        const resolvedVelocityRaw =
          deltaSeconds > 0
            ? {
                x: (nextPosition.x - state.player.position.x) / deltaSeconds,
                y: (nextPosition.y - state.player.position.y) / deltaSeconds,
              }
            : { x: 0, y: 0 };
        const velocity = {
          x: Math.abs(resolvedVelocityRaw.x) < VELOCITY_EPSILON ? 0 : resolvedVelocityRaw.x,
          y: Math.abs(resolvedVelocityRaw.y) < VELOCITY_EPSILON ? 0 : resolvedVelocityRaw.y,
        };
        travelSpeedRef.current = Math.hypot(velocity.x, velocity.y);

        dispatch({ type: "PLAYER_MOVED", position: nextPosition, velocity });

        const nearbyNode = findNearbyNode(nextPosition, world.config.nodes);
        if (nearbyNode && nearbyNode.id !== state.activeNodeId) {
          dispatch({ type: "ACTIVE_NODE_CHANGED", nodeId: nearbyNode.id });

          if (
            nearbyNode.id === world.config.progression.finalNodeId &&
            state.progression.availableNodeIds.has(nearbyNode.id)
          ) {
            dispatch({ type: "ENTER_FINAL_NODE" });
          }
        }
      } else if (state.player.velocity.x !== 0 || state.player.velocity.y !== 0) {
        travelSpeedRef.current = 0;
        dispatch({
          type: "PLAYER_MOVED",
          position: state.player.position,
          velocity: { x: 0, y: 0 },
        });
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [activePlayerRadius, collisionIndex, dispatch, state.activeNodeId, state.player, state.progression.availableNodeIds, state.worldState, world.config]);

  return (
    <WorldStoreProvider store={store}>
      <CameraCalibrationProvider worldConfig={world.config}>
        <NodePositionCalibrationProvider worldConfig={world.config}>
          <div className="app-shell">
            <HUD />
            <CameraScaleCalibrationPanel />
            <NodePositionCalibrationPanel />
            <WorldCanvas />
            <StartOverlay />
            <TutorialOverlay />
            <CheckpointPanel />
            <FinalStatePanel />
          </div>
        </NodePositionCalibrationProvider>
      </CameraCalibrationProvider>
    </WorldStoreProvider>
  );
}

export default function App(): React.JSX.Element {
  const [result, setResult] = useState<InitWorldResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initWorld()
      .then((loaded) => {
        setResult(loaded);
      })
      .catch((initError: unknown) => {
        const message = initError instanceof Error ? initError.message : "Unknown initialization error";
        setError(message);
      });
  }, []);

  if (error) {
    return (
      <main className="status-panel">
        <h1>Initialization Error</h1>
        <pre>{error}</pre>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="status-panel">
        <h1>Loading world...</h1>
      </main>
    );
  }

  return <RuntimeApp world={result.world} />;
}
