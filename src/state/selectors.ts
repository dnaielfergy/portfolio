import type { RuntimeWorldStore, WorldNode } from "../types/world";

export function selectProgressRatio(state: RuntimeWorldStore, totalMainNodes: number): number {
  if (totalMainNodes <= 0) {
    return 0;
  }

  return state.progression.completedNodeIds.size / totalMainNodes;
}

export function selectCanOpenCheckpoint(
  state: RuntimeWorldStore,
  candidateNode: WorldNode | undefined,
): boolean {
  if (!candidateNode) {
    return false;
  }

  return state.worldState === "exploring" && !state.player.movementLocked;
}
