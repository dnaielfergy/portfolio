import type { WorldNode } from "../types/world";

export function isInsideNodeRadius(
  player: { x: number; y: number },
  node: Pick<WorldNode, "coords" | "radius">,
): boolean {
  const dx = player.x - node.coords.x;
  const dy = player.y - node.coords.y;
  return dx * dx + dy * dy <= node.radius * node.radius;
}

export function findNearbyNode(
  player: { x: number; y: number },
  nodes: WorldNode[],
): WorldNode | undefined {
  return nodes.find((node) => isInsideNodeRadius(player, node));
}
