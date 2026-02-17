import type { EdgeId, NodeId, NormalizedWorld, WorldConfig, WorldEdge, WorldNode } from "../types/world";

export const DEFAULT_WORLD_CONFIG_PATH = "/world/schema/world_schema_example.json";

export async function loadWorldConfig(path = DEFAULT_WORLD_CONFIG_PATH): Promise<WorldConfig> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load world config from '${path}'`);
  }

  return (await response.json()) as WorldConfig;
}

function indexNodes(nodes: WorldNode[]): Record<NodeId, WorldNode> {
  return Object.fromEntries(nodes.map((node) => [node.id, node]));
}

function indexEdges(edges: WorldEdge[]): Record<EdgeId, WorldEdge> {
  return Object.fromEntries(edges.map((edge) => [edge.id, edge]));
}

function buildAdjacency(nodes: WorldNode[], edges: WorldEdge[]): Record<NodeId, NodeId[]> {
  const adjacency: Record<NodeId, NodeId[]> = Object.fromEntries(nodes.map((node) => [node.id, []]));

  for (const edge of edges) {
    adjacency[edge.from]?.push(edge.to);
  }

  return adjacency;
}

export function normalizeWorldConfig(config: WorldConfig): NormalizedWorld {
  return {
    config,
    nodesById: indexNodes(config.nodes),
    edgesById: indexEdges(config.edges),
    adjacency: buildAdjacency(config.nodes, config.edges),
  };
}
