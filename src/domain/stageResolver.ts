import type { NodeId, WorldConfig } from "../types/world";

export function resolveVehicleStageForNode(nodeId: NodeId, worldConfig: WorldConfig): string {
  const stage = worldConfig.vehicles.stageByNodeId[nodeId];
  if (!stage) {
    throw new Error(`No vehicle stage mapped for node '${nodeId}'`);
  }

  return stage;
}

export function resolveVehicleStageForProgression(
  completedNodeIds: Set<NodeId>,
  worldConfig: WorldConfig,
): string {
  const mainSequence = worldConfig.progression.mainSequence;

  let selectedNodeId = worldConfig.progression.startNodeId;
  for (const nodeId of mainSequence) {
    if (completedNodeIds.has(nodeId)) {
      selectedNodeId = nodeId;
    }
  }

  return resolveVehicleStageForNode(selectedNodeId, worldConfig);
}
