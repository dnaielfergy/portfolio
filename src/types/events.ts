import type { NodeId, WorldState } from "./world";

export type WorldEvent =
  | { type: "START_CLICKED" }
  | { type: "INTRO_SKIP_REQUESTED" }
  | { type: "INTRO_SKIPPED" }
  | { type: "INTRO_COMPLETED" }
  | { type: "TUTORIAL_DISMISSED" }
  | { type: "FOCUS_CHARLOTTE_COMPLETED" }
  | { type: "OPEN_CHECKPOINT"; nodeId: NodeId }
  | { type: "CLOSE_CHECKPOINT" }
  | { type: "CHECKPOINT_COMPLETED"; nodeId: NodeId }
  | { type: "TRANSFORM_STARTED" }
  | { type: "TRANSFORM_PROGRESS"; progress: number }
  | { type: "TRANSFORM_COMPLETED" }
  | { type: "QUALITY_TIER_DETECTED"; tier: "high" | "medium" | "low" }
  | { type: "ENTER_FINAL_NODE" }
  | { type: "PLAYER_MOVED"; position: { x: number; y: number }; velocity: { x: number; y: number } }
  | { type: "ACTIVE_NODE_CHANGED"; nodeId: NodeId }
  | { type: "HOVERED_NODE_CHANGED"; nodeId?: NodeId }
  | { type: "FORCE_STATE"; state: WorldState };
