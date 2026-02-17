import type {
  NodeId,
  NormalizedWorld,
  RuntimeProgression,
  VisibleRule,
  WorldConfig,
  WorldEdge,
  WorldNode,
} from "../types/world";

function isUnlockSatisfied(
  node: WorldNode,
  availableNodeIds: Set<NodeId>,
  completedNodeIds: Set<NodeId>,
): boolean {
  switch (node.unlock.type) {
    case "start":
      return true;
    case "after_complete":
      return completedNodeIds.has(node.unlock.nodeId);
    case "after_available":
      return availableNodeIds.has(node.unlock.nodeId);
    default:
      return false;
  }
}

function isVisibleRuleSatisfied(rule: VisibleRule, progression: RuntimeProgression): boolean {
  switch (rule.type) {
    case "always":
      return true;
    case "after_available":
      return progression.availableNodeIds.has(rule.nodeId);
    case "after_complete":
      return progression.completedNodeIds.has(rule.nodeId);
    default:
      return false;
  }
}

export interface ProgressionEngine {
  getProgression(): RuntimeProgression;
  getAvailableNodes(): NodeId[];
  markCompleted(nodeId: NodeId): RuntimeProgression;
  resolveNextTargets(): NodeId[];
  getNeighbors(nodeId: NodeId): NodeId[];
  isEdgeVisible(edgeId: string): boolean;
}

export function createInitialProgression(config: WorldConfig): RuntimeProgression {
  return {
    availableNodeIds: new Set([config.progression.startNodeId]),
    completedNodeIds: new Set<NodeId>(),
  };
}

export function createProgressionEngine(world: NormalizedWorld, seed?: RuntimeProgression): ProgressionEngine {
  let progression: RuntimeProgression =
    seed ?? {
      availableNodeIds: new Set([world.config.progression.startNodeId]),
      completedNodeIds: new Set<NodeId>(),
    };

  const recomputeAvailable = (): void => {
    const nextAvailable = new Set<NodeId>([world.config.progression.startNodeId]);
    let changed = true;

    // Resolve unlocks to a fixed point so after_available chains behave deterministically.
    while (changed) {
      changed = false;
      for (const node of world.config.nodes) {
        if (nextAvailable.has(node.id)) {
          continue;
        }

        if (isUnlockSatisfied(node, nextAvailable, progression.completedNodeIds)) {
          nextAvailable.add(node.id);
          changed = true;
        }
      }
    }

    progression = {
      ...progression,
      availableNodeIds: nextAvailable,
    };
  };

  const getAvailableNodes = (): NodeId[] => {
    recomputeAvailable();
    return [...progression.availableNodeIds];
  };

  const markCompleted = (nodeId: NodeId): RuntimeProgression => {
    progression = {
      availableNodeIds: new Set(progression.availableNodeIds),
      completedNodeIds: new Set(progression.completedNodeIds).add(nodeId),
    };

    recomputeAvailable();
    return progression;
  };

  const resolveNextTargets = (): NodeId[] => {
    const incompleteMainNodes = world.config.progression.mainSequence.filter(
      (nodeId) => !progression.completedNodeIds.has(nodeId),
    );

    const nextTarget = incompleteMainNodes[0];
    if (nextTarget) {
      return [nextTarget];
    }

    return [];
  };

  const getNeighbors = (nodeId: NodeId): NodeId[] => {
    return world.adjacency[nodeId] ?? [];
  };

  const isEdgeVisible = (edgeId: string): boolean => {
    const edge: WorldEdge | undefined = world.edgesById[edgeId];
    if (!edge) {
      return false;
    }

    recomputeAvailable();
    return isVisibleRuleSatisfied(edge.visibleWhen, progression);
  };

  return {
    getProgression: () => progression,
    getAvailableNodes,
    markCompleted,
    resolveNextTargets,
    getNeighbors,
    isEdgeVisible,
  };
}
