import { createContext, createElement, useContext, useMemo, useReducer, type ReactNode } from "react";

import { createInitialProgression, createProgressionEngine } from "../domain/progressionEngine";
import { resolveVehicleStageForNode } from "../domain/stageResolver";
import { reduceWorldState } from "./worldMachine";
import type { WorldEvent } from "../types/events";
import type {
  CameraPreset,
  CameraRuntimeState,
  NormalizedWorld,
  RuntimeWorldStore,
  TransformState,
} from "../types/world";

interface StorePayload {
  world: NormalizedWorld;
  state: RuntimeWorldStore;
  dispatch: (event: WorldEvent) => void;
}

const WorldStoreContext = createContext<StorePayload | null>(null);

function toCameraRuntime(preset: CameraPreset): CameraRuntimeState {
  return {
    position: {
      x: preset.position[0],
      y: preset.position[1],
      z: preset.position[2],
    },
    lookAt: {
      x: preset.lookAt[0],
      y: preset.lookAt[1],
      z: preset.lookAt[2],
    },
    fov: preset.fov,
    damping: preset.damping,
  };
}

function createInitialTransformState(initialStage: string): TransformState {
  return {
    status: "idle",
    progress: 0,
    fromStage: initialStage,
    toStage: initialStage,
  };
}

function createInitialStore(world: NormalizedWorld): RuntimeWorldStore {
  const progression = createInitialProgression(world.config);
  const startNode = world.nodesById[world.config.progression.startNodeId];
  if (!startNode) {
    throw new Error(
      `Start node '${world.config.progression.startNodeId}' not found in normalized world index`,
    );
  }

  const initialStage = resolveVehicleStageForNode(world.config.progression.startNodeId, world.config);

  return {
    worldState: world.config.intro.enabled ? "intro" : "idleMap",
    activeNodeId: world.config.progression.startNodeId,
    hoveredNodeId: undefined,
    isCheckpointOpen: false,
    checkpointNodeId: undefined,
    activeVehicleStageId: initialStage,
    player: {
      nodeId: world.config.progression.startNodeId,
      position: {
        x: startNode.coords.x,
        y: startNode.coords.y,
      },
      velocity: { x: 0, y: 0 },
      movementLocked: false,
    },
    progression,
    qualityTier: "high",
    transform: createInitialTransformState(initialStage),
    cameraRuntime: toCameraRuntime(
      world.config.intro.enabled ? world.config.cameraPresets.introStart : world.config.cameraPresets.introEnd,
    ),
  };
}

function reducerFactory(world: NormalizedWorld) {
  return (state: RuntimeWorldStore, event: WorldEvent): RuntimeWorldStore => {
    const engine = createProgressionEngine(world, state.progression);

    const closeTargetStage =
      event.type === "CLOSE_CHECKPOINT" && state.checkpointNodeId
        ? resolveVehicleStageForNode(state.checkpointNodeId, world.config)
        : undefined;
    const stageWillChange =
      typeof closeTargetStage === "string" && closeTargetStage !== state.activeVehicleStageId;
    const shouldTriggerTransform = stageWillChange && world.config.progression.onCompleteNode.triggerTransform;
    const nextWorldState = reduceWorldState(
      state.worldState,
      shouldTriggerTransform ? { type: "TRANSFORM_STARTED" } : event,
    );

    let nextState: RuntimeWorldStore = {
      ...state,
      worldState: nextWorldState,
      player: {
        ...state.player,
        movementLocked: ["checkpointOpen", "transforming", "finalState"].includes(nextWorldState),
      },
    };

    if (event.type === "OPEN_CHECKPOINT") {
      nextState = {
        ...nextState,
        isCheckpointOpen: true,
        checkpointNodeId: event.nodeId,
        hoveredNodeId: undefined,
      };
    }

    if (event.type === "CLOSE_CHECKPOINT") {
      nextState = {
        ...nextState,
        isCheckpointOpen: false,
        checkpointNodeId: undefined,
      };
    }

    if (event.type === "ENTER_FINAL_NODE") {
      const progression = state.progression.completedNodeIds.has(world.config.progression.finalNodeId)
        ? state.progression
        : engine.markCompleted(world.config.progression.finalNodeId);

      nextState = {
        ...nextState,
        player: {
          ...nextState.player,
          movementLocked: true,
        },
        progression,
      };
    }

    if (event.type === "CLOSE_CHECKPOINT" && state.checkpointNodeId) {
      const toStage = closeTargetStage ?? state.activeVehicleStageId;
      const alreadyCompleted = state.progression.completedNodeIds.has(state.checkpointNodeId);
      if (!alreadyCompleted) {
        const progression = engine.markCompleted(state.checkpointNodeId);

        nextState = {
          ...nextState,
          progression,
          activeVehicleStageId: toStage,
          transform: shouldTriggerTransform
            ? {
                status: "running",
                progress: 0,
                fromStage: state.activeVehicleStageId,
                toStage,
              }
            : {
                status: "idle",
                progress: 1,
                fromStage: toStage,
                toStage,
              },
        };
      } else {
        nextState = {
          ...nextState,
          activeVehicleStageId: toStage,
          transform: shouldTriggerTransform
            ? {
                status: "running",
                progress: 0,
                fromStage: state.activeVehicleStageId,
                toStage,
              }
            : {
                status: "idle",
                progress: 1,
                fromStage: toStage,
                toStage,
              },
        };
      }
    }

    if (event.type === "TRANSFORM_PROGRESS") {
      nextState = {
        ...nextState,
        transform: {
          ...nextState.transform,
          progress: Math.min(1, Math.max(0, event.progress)),
        },
      };
    }

    if (event.type === "TRANSFORM_COMPLETED") {
      nextState = {
        ...nextState,
        transform: {
          status: "idle",
          progress: 1,
          fromStage: nextState.activeVehicleStageId,
          toStage: nextState.activeVehicleStageId,
        },
      };
    }

    if (event.type === "PLAYER_MOVED") {
      nextState = {
        ...nextState,
        player: {
          ...nextState.player,
          position: event.position,
          velocity: event.velocity,
        },
      };
    }

    if (event.type === "ACTIVE_NODE_CHANGED") {
      nextState = {
        ...nextState,
        activeNodeId: event.nodeId,
        player: {
          ...nextState.player,
          nodeId: event.nodeId,
        },
      };
    }

    if (event.type === "QUALITY_TIER_DETECTED") {
      nextState = {
        ...nextState,
        qualityTier: event.tier,
      };
    }

    if (event.type === "HOVERED_NODE_CHANGED") {
      nextState = {
        ...nextState,
        hoveredNodeId: event.nodeId,
      };
    }

    return nextState;
  };
}

export function useWorldStore(world: NormalizedWorld): StorePayload {
  const [state, dispatch] = useReducer(reducerFactory(world), world, createInitialStore);

  return useMemo(
    () => ({
      world,
      state,
      dispatch,
    }),
    [state, world],
  );
}

export function WorldStoreProvider({
  children,
  store,
}: {
  children: ReactNode;
  store: StorePayload;
}): React.JSX.Element {
  return createElement(WorldStoreContext.Provider, { value: store }, children);
}

export function useWorldStoreContext(): StorePayload {
  const context = useContext(WorldStoreContext);
  if (!context) {
    throw new Error("useWorldStoreContext must be used within WorldStoreProvider");
  }

  return context;
}
