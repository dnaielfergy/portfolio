import type { WorldEvent } from "../types/events";
import type { WorldState } from "../types/world";

const ALLOWED_TRANSITIONS: Record<WorldState, WorldState[]> = {
  intro: ["idleMap"],
  idleMap: ["tutorial"],
  tutorial: ["focusCharlotte"],
  focusCharlotte: ["exploring"],
  exploring: ["checkpointOpen", "finalState"],
  checkpointOpen: ["exploring", "transforming"],
  transforming: ["exploring"],
  finalState: [],
};

export function canTransition(from: WorldState, to: WorldState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function transitionState(from: WorldState, to: WorldState): WorldState {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal world state transition '${from}' -> '${to}'`);
  }

  return to;
}

export function reduceWorldState(state: WorldState, event: WorldEvent): WorldState {
  switch (event.type) {
    case "INTRO_COMPLETED":
    case "INTRO_SKIPPED":
      return transitionState(state, "idleMap");
    case "START_CLICKED":
      return transitionState(state, "tutorial");
    case "TUTORIAL_DISMISSED":
      return transitionState(state, "focusCharlotte");
    case "FOCUS_CHARLOTTE_COMPLETED":
      return transitionState(state, "exploring");
    case "OPEN_CHECKPOINT":
      return transitionState(state, "checkpointOpen");
    case "CLOSE_CHECKPOINT":
      return transitionState(state, "exploring");
    case "TRANSFORM_STARTED":
      return transitionState(state, "transforming");
    case "TRANSFORM_COMPLETED":
      return transitionState(state, "exploring");
    case "ENTER_FINAL_NODE":
      return transitionState(state, "finalState");
    case "PLAYER_MOVED":
    case "ACTIVE_NODE_CHANGED":
      return state;
    case "FORCE_STATE":
      return event.state;
    default:
      return state;
  }
}
