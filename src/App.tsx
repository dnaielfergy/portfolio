import { useEffect, useMemo, useRef, useState } from "react";

import { createIntroTimeline } from "./animation/introTimeline";
import { createVehicleTransformService } from "./animation/transformTimeline";
import { initWorld } from "./bootstrap/initWorld";
import { resolveEnterAction } from "./input/actionRouter";
import { useKeyboardController } from "./input/keyboardController";
import { findNearbyNode } from "./input/proximityDetector";
import { WorldCanvas } from "./scene/WorldCanvas";
import { useWorldStore, WorldStoreProvider } from "./state/worldStore";
import { CheckpointPanel } from "./ui/CheckpointPanel";
import { FinalStatePanel } from "./ui/FinalStatePanel";
import { HUD } from "./ui/HUD";
import { StartOverlay } from "./ui/StartOverlay";
import { TutorialOverlay } from "./ui/TutorialOverlay";
import type { InitWorldResult } from "./bootstrap/initWorld";

type MovementKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

function RuntimeApp({ world }: InitWorldResult): JSX.Element {
  const store = useWorldStore(world);
  const movementKeysRef = useRef<Set<MovementKey>>(new Set());
  const transformService = useMemo(
    () => createVehicleTransformService(world.config.vehicles.transformRules),
    [world.config.vehicles.transformRules],
  );
  const previousStageRef = useRef(store.state.activeVehicleStageId);

  useKeyboardController({
    worldState: store.state.worldState,
    onEvent: store.dispatch,
    onMovementKey: (key, pressed) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
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
      const event = resolveEnterAction(store.state, world.config);
      if (event) {
        store.dispatch(event);
      }
    },
    onEscape: () => {
      if (store.state.worldState === "checkpointOpen") {
        store.dispatch({ type: "CLOSE_CHECKPOINT" });
      }
    },
  });

  useEffect(() => {
    if (store.state.worldState !== "intro") {
      return;
    }

    let cancelled = false;
    const timeline = createIntroTimeline(world.config.intro);

    timeline
      .play()
      .then(() => {
        if (!cancelled) {
          store.dispatch({ type: "INTRO_COMPLETED" });
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [store, store.state.worldState, world.config.intro]);

  useEffect(() => {
    if (store.state.worldState !== "focusCharlotte") {
      return;
    }

    const timeout = window.setTimeout(() => {
      store.dispatch({ type: "FOCUS_CHARLOTTE_COMPLETED" });
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [store, store.state.worldState]);

  useEffect(() => {
    if (store.state.worldState !== "transforming") {
      return;
    }

    const fromStage = previousStageRef.current;
    const toStage = store.state.activeVehicleStageId;
    let cancelled = false;

    transformService
      .trigger(fromStage, toStage)
      .then(() => {
        if (!cancelled) {
          store.dispatch({ type: "TRANSFORM_COMPLETED" });
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [store, store.state.activeVehicleStageId, store.state.worldState, transformService]);

  useEffect(() => {
    previousStageRef.current = store.state.activeVehicleStageId;
  }, [store.state.activeVehicleStageId]);

  useEffect(() => {
    if (store.state.worldState !== "exploring" || store.state.player.movementLocked) {
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

      if (movementKeysRef.current.has("ArrowLeft")) vx -= speed;
      if (movementKeysRef.current.has("ArrowRight")) vx += speed;
      if (movementKeysRef.current.has("ArrowUp")) vy += speed;
      if (movementKeysRef.current.has("ArrowDown")) vy -= speed;

      const hasMovement = vx !== 0 || vy !== 0;
      if (hasMovement) {
        const nextPosition = {
          x: store.state.player.position.x + vx * deltaSeconds,
          y: store.state.player.position.y + vy * deltaSeconds,
        };

        store.dispatch({ type: "PLAYER_MOVED", position: nextPosition, velocity: { x: vx, y: vy } });

        const nearbyNode = findNearbyNode(nextPosition, world.config.nodes);
        if (nearbyNode && nearbyNode.id !== store.state.activeNodeId) {
          store.dispatch({ type: "ACTIVE_NODE_CHANGED", nodeId: nearbyNode.id });

          if (nearbyNode.id === world.config.progression.finalNodeId) {
            store.dispatch({ type: "ENTER_FINAL_NODE" });
          }
        }
      } else if (store.state.player.velocity.x !== 0 || store.state.player.velocity.y !== 0) {
        store.dispatch({
          type: "PLAYER_MOVED",
          position: store.state.player.position,
          velocity: { x: 0, y: 0 },
        });
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [store, store.state.activeNodeId, store.state.player, store.state.worldState, world.config]);

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

export default function App(): JSX.Element {
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
