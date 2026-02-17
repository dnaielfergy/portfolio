import type { NodeId, WorldState } from "./world";

export type WorldEvent =
  | { type: "START_CLICKED" }
  | { type: "INTRO_SKIPPED" }
  | { type: "INTRO_COMPLETED" }
  | { type: "TUTORIAL_DISMISSED" }
  | { type: "FOCUS_CHARLOTTE_COMPLETED" }
  | { type: "OPEN_CHECKPOINT"; nodeId: NodeId }
  | { type: "CLOSE_CHECKPOINT" }
  | { type: "TRANSFORM_STARTED" }
  | { type: "TRANSFORM_COMPLETED" }
  | { type: "ENTER_FINAL_NODE" }
  | { type: "PLAYER_MOVED"; position: { x: number; y: number }; velocity: { x: number; y: number } }
  | { type: "ACTIVE_NODE_CHANGED"; nodeId: NodeId }
  | { type: "FORCE_STATE"; state: WorldState };
