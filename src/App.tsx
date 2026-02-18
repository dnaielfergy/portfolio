import { useEffect, useMemo, useRef, useState } from "react";

import { createIntroTimeline } from "./animation/introTimeline";
import { createVehicleTransformService } from "./animation/transformTimeline";
import { initWorld } from "./bootstrap/initWorld";
import { resolveEnterAction } from "./input/actionRouter";
import { useKeyboardController } from "./input/keyboardController";
import { findNearbyNode } from "./input/proximityDetector";
import { resolveQualityTier } from "./postfx/qualityTier";
import { WorldCanvas } from "./scene/WorldCanvas";
import { useWorldStore, WorldStoreProvider } from "./state/worldStore";
import { CheckpointPanel } from "./ui/CheckpointPanel";
import { FinalStatePanel } from "./ui/FinalStatePanel";
import { HUD } from "./ui/HUD";
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

function RuntimeApp({ world }: InitWorldResult): React.JSX.Element {
  const store = useWorldStore(world);
  const { state, dispatch } = store;

  const movementKeysRef = useRef<Set<MovementKey>>(new Set());
  const transformService = useMemo(
    () => createVehicleTransformService(world.config.vehicles.transformRules),
    [world.config.vehicles.transformRules],
  );
  const previousStageRef = useRef(state.activeVehicleStageId);

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
    if (state.worldState !== "exploring" || state.player.movementLocked) {
      return;
    }

    let raf = 0;
    const speed = 12;
    let lastTime = performance.now();

    const tick = (now: number): void => {
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;

      let vx = 0;
      let vy = 0;

      if (movementKeysRef.current.has("ArrowLeft") || movementKeysRef.current.has("KeyA")) vx -= speed;
      if (movementKeysRef.current.has("ArrowRight") || movementKeysRef.current.has("KeyD")) vx += speed;
      if (movementKeysRef.current.has("ArrowUp") || movementKeysRef.current.has("KeyW")) vy += speed;
      if (movementKeysRef.current.has("ArrowDown") || movementKeysRef.current.has("KeyS")) vy -= speed;

      const hasMovement = vx !== 0 || vy !== 0;
      if (hasMovement) {
        const nextPosition = {
          x: state.player.position.x + vx * deltaSeconds,
          y: state.player.position.y + vy * deltaSeconds,
        };

        dispatch({ type: "PLAYER_MOVED", position: nextPosition, velocity: { x: vx, y: vy } });

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
  }, [dispatch, state.activeNodeId, state.player, state.progression.availableNodeIds, state.worldState, world.config]);

  return (
    <WorldStoreProvider store={store}>
      <div className="app-shell">
        <HUD />
        <WorldCanvas />
        <StartOverlay />
        <TutorialOverlay />
        <CheckpointPanel />
        <FinalStatePanel />
      </div>
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
