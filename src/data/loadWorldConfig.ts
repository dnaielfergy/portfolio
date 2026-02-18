import type {
  EdgeId,
  NodeId,
  NormalizedWorld,
  RenderEdge,
  RenderNode,
  SceneCoords,
  WorldConfig,
  WorldEdge,
  WorldNode,
} from "../types/world";

export const DEFAULT_WORLD_CONFIG_PATH = "/world/schema/world_schema_example.json";
export const SCENE_SCALE = 2.5;

const KEY_NODE_LABELS: Record<string, { text: string; offset: SceneCoords }> = {
  san_francisco: { text: "San Francisco, CA", offset: { x: 4.2, y: 1.3, z: 1.2 } },
  palo_alto_wisk: { text: "Palo Alto", offset: { x: 3.2, y: 1.15, z: 0.35 } },
  san_diego_fictiv: { text: "San Diego, CA", offset: { x: 2.4, y: 1.05, z: -1.45 } },
  huntsville_parsons: { text: "Huntsville, AL", offset: { x: -3.6, y: 1.2, z: -0.7 } },
  georgia_tech: { text: "Atlanta, GA", offset: { x: 2.1, y: 1.0, z: -1.95 } },
  charlotte: { text: "Charlotte, NC", offset: { x: 3.5, y: 1.1, z: 0.1 } },
};

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

export function toSceneCoords(worldX: number, worldY: number, elevation = 0): SceneCoords {
  return {
    x: worldX * SCENE_SCALE,
    y: elevation,
    z: -worldY * SCENE_SCALE,
  };
}

function deriveNodeLabel(node: WorldNode): Pick<RenderNode, "labelText" | "labelPriority" | "labelVisibleByDefault" | "labelOffset"> {
  const keyLabel = KEY_NODE_LABELS[node.id];
  if (keyLabel) {
    return {
      labelText: keyLabel.text,
      labelPriority: "key",
      labelVisibleByDefault: true,
      labelOffset: keyLabel.offset,
    };
  }

  return {
    labelText: node.name,
    labelPriority: "normal",
    labelVisibleByDefault: false,
    labelOffset: { x: 0, y: 1.1, z: 0 },
  };
}

function normalizeNode(node: WorldNode): RenderNode {
  return {
    id: node.id,
    nodeType: node.type,
    region: node.region,
    radius: node.radius,
    scenePosition: toSceneCoords(node.coords.x, node.coords.y, 0.05),
    worldPosition: {
      x: node.coords.x,
      y: node.coords.y,
    },
    ...deriveNodeLabel(node),
  };
}

function normalizeEdge(edge: WorldEdge, nodesById: Record<NodeId, WorldNode>): RenderEdge {
  const fromNode = nodesById[edge.from];
  const toNode = nodesById[edge.to];

  if (!fromNode || !toNode) {
    throw new Error(`Cannot normalize edge '${edge.id}' because endpoints are missing`);
  }

  const points = [
    toSceneCoords(fromNode.coords.x, fromNode.coords.y, 0.1),
    ...(edge.waypoints?.map((waypoint) => toSceneCoords(waypoint.x, waypoint.y, 0.1)) ?? []),
    toSceneCoords(toNode.coords.x, toNode.coords.y, 0.1),
  ];

  return {
    id: edge.id,
    from: edge.from,
    to: edge.to,
    type: edge.type,
    scenePoints: points,
    visibleWhen: edge.visibleWhen,
  };
}

export function getEdgeStrokePoints(edge: RenderEdge): [number, number, number][] {
  return edge.scenePoints.map((point) => [point.x, point.y, point.z]);
}

export function normalizeWorldConfig(config: WorldConfig): NormalizedWorld {
  const nodesById = indexNodes(config.nodes);
  const renderNodes = config.nodes.map(normalizeNode);
  const renderNodesById = Object.fromEntries(renderNodes.map((node) => [node.id, node]));
  const renderEdges = config.edges.map((edge) => normalizeEdge(edge, nodesById));

  return {
    config,
    nodesById,
    edgesById: indexEdges(config.edges),
    adjacency: buildAdjacency(config.nodes, config.edges),
    renderNodes,
    renderNodesById,
    renderEdges,
  };
}
