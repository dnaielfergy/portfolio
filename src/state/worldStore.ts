import { createContext, createElement, useContext, useMemo, useReducer, type ReactNode } from "react";

import { createInitialProgression, createProgressionEngine } from "../domain/progressionEngine";
import { resolveVehicleStageForProgression } from "../domain/stageResolver";
import { reduceWorldState } from "./worldMachine";
import type { WorldEvent } from "../types/events";
import type { NormalizedWorld, RuntimeWorldStore } from "../types/world";

interface StorePayload {
  world: NormalizedWorld;
  state: RuntimeWorldStore;
  dispatch: (event: WorldEvent) => void;
}

const WorldStoreContext = createContext<StorePayload | null>(null);

function createInitialStore(world: NormalizedWorld): RuntimeWorldStore {
  const progression = createInitialProgression(world.config);
  const startNode = world.nodesById[world.config.progression.startNodeId];
  if (!startNode) {
    throw new Error(
      `Start node '${world.config.progression.startNodeId}' not found in normalized world index`,
    );
  }

  return {
    worldState: world.config.intro.enabled ? "intro" : "idleMap",
    activeNodeId: world.config.progression.startNodeId,
    isCheckpointOpen: false,
    checkpointNodeId: undefined,
    activeVehicleStageId: resolveVehicleStageForProgression(progression.completedNodeIds, world.config),
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
  };
}

function reducerFactory(world: NormalizedWorld) {
  return (state: RuntimeWorldStore, event: WorldEvent): RuntimeWorldStore => {
    const engine = createProgressionEngine(world, state.progression);
    const isFirstCloseForNode =
      event.type === "CLOSE_CHECKPOINT" &&
      !!state.checkpointNodeId &&
      !state.progression.completedNodeIds.has(state.checkpointNodeId);
    const shouldTriggerTransform =
      isFirstCloseForNode && world.config.progression.onCompleteNode.triggerTransform;

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
      nextState = {
        ...nextState,
        player: {
          ...nextState.player,
          movementLocked: true,
        },
      };
    }

    if (event.type === "CLOSE_CHECKPOINT" && state.checkpointNodeId) {
      const alreadyCompleted = state.progression.completedNodeIds.has(state.checkpointNodeId);
      if (!alreadyCompleted) {
        const progression = engine.markCompleted(state.checkpointNodeId);
        nextState = {
          ...nextState,
          progression,
          activeVehicleStageId: resolveVehicleStageForProgression(
            progression.completedNodeIds,
            world.config,
          ),
        };
      }
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
}): JSX.Element {
  return createElement(WorldStoreContext.Provider, { value: store }, children);
}

export function useWorldStoreContext(): StorePayload {
  const context = useContext(WorldStoreContext);
  if (!context) {
    throw new Error("useWorldStoreContext must be used within WorldStoreProvider");
  }

  return context;
}
