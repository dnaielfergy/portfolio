import { findNearbyNode } from "./proximityDetector";
import type { WorldEvent } from "../types/events";
import type { RuntimeWorldStore, WorldConfig } from "../types/world";

export function resolveEnterAction(state: RuntimeWorldStore, config: WorldConfig): WorldEvent | null {
  if (state.worldState !== "exploring" || state.player.movementLocked) {
    return null;
  }

  const nearbyNode = findNearbyNode(state.player.position, config.nodes);
  if (!nearbyNode) {
    return null;
  }
  if (!state.progression.availableNodeIds.has(nearbyNode.id)) {
    return null;
  }

  return {
    type: "OPEN_CHECKPOINT",
    nodeId: nearbyNode.id,
  };
}
