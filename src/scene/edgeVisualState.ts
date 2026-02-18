import type { RenderEdge, RuntimeProgression, SceneCoords, WorldConfig, WorldState } from "../types/world";

export type EdgeVisualState = "intro" | "completed" | "next" | "default";

export interface ResolvedPathStyle {
  baseColor: string;
  highlightColor: string;
  loadedColor: string;
  completedColor: string;
  nextColor: string;
  thickness: number;
  introSweepMs: number;
  stateFadeMs: number;
}

interface CandidateEdgesParams {
  worldState: WorldState;
  edges: RenderEdge[];
  visibleEdgeIds: Set<string>;
}

interface VisualStateParams {
  edge: RenderEdge;
  progression: RuntimeProgression;
  worldState: WorldState;
}

export interface IntroRouteBuildParams {
  renderEdges: RenderEdge[];
  mainSequence: string[];
  startNodeId: string;
  endNodeId: string;
  elevation?: number;
}

export function resolvePathStyle(pathStyle: WorldConfig["style"]["pathStyle"]): ResolvedPathStyle {
  return {
    baseColor: pathStyle.baseColor,
    highlightColor: pathStyle.highlightColor,
    loadedColor: pathStyle.loadedColor ?? "#8F8B84",
    completedColor: pathStyle.completedColor ?? pathStyle.baseColor,
    nextColor: pathStyle.nextColor ?? pathStyle.highlightColor,
    thickness: pathStyle.thickness,
    introSweepMs: pathStyle.introSweepMs ?? 1800,
    stateFadeMs: pathStyle.stateFadeMs ?? 250,
  };
}

export function computeCandidateEdges({
  worldState,
  edges,
  visibleEdgeIds,
}: CandidateEdgesParams): RenderEdge[] {
  if (worldState === "intro") {
    return edges;
  }
  return edges.filter((edge) => visibleEdgeIds.has(edge.id));
}

export function computeEdgeVisualState({
  edge,
  progression,
  worldState,
}: VisualStateParams): EdgeVisualState {
  if (worldState === "intro") {
    return "intro";
  }

  if (progression.completedNodeIds.has(edge.to)) {
    return "completed";
  }

  const isNext =
    progression.completedNodeIds.has(edge.from) &&
    progression.availableNodeIds.has(edge.to) &&
    !progression.completedNodeIds.has(edge.to);

  if (isNext) {
    return "next";
  }

  return "default";
}

function samePoint(a: SceneCoords, b: SceneCoords, epsilon = 0.0001): boolean {
  return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon && Math.abs(a.z - b.z) <= epsilon;
}

export function buildIntroRouteFromEdges({
  renderEdges,
  mainSequence,
  startNodeId,
  endNodeId,
  elevation = 0.35,
}: IntroRouteBuildParams): SceneCoords[] {
  const startIndex = mainSequence.indexOf(startNodeId);
  const endIndex = mainSequence.indexOf(endNodeId);
  if (startIndex === -1 || endIndex === -1) {
    return [];
  }

  const nodePath =
    startIndex <= endIndex
      ? mainSequence.slice(startIndex, endIndex + 1)
      : mainSequence.slice(endIndex, startIndex + 1).reverse();

  const route: SceneCoords[] = [];
  let missingSegment = false;

  for (let i = 0; i < nodePath.length - 1; i += 1) {
    const fromNodeId = nodePath[i];
    const toNodeId = nodePath[i + 1];
    if (!fromNodeId || !toNodeId) {
      continue;
    }

    const edge = renderEdges.find(
      (candidate) =>
        candidate.type === "main" &&
        ((candidate.from === fromNodeId && candidate.to === toNodeId) ||
          (candidate.from === toNodeId && candidate.to === fromNodeId)),
    );

    if (!edge) {
      missingSegment = true;
      continue;
    }

    const segment =
      edge.from === fromNodeId && edge.to === toNodeId ? edge.scenePoints : [...edge.scenePoints].reverse();

    if (segment.length === 0) {
      continue;
    }

    if (route.length > 0) {
      const previous = route[route.length - 1];
      const first = segment[0];
      if (previous && first && samePoint(previous, first)) {
        route.push(...segment.slice(1));
        continue;
      }
    }

    route.push(...segment);
  }

  if (missingSegment) {
    console.warn(
      `[PathLayer] Intro route missing one or more main edges between '${startNodeId}' and '${endNodeId}'. Using partial route.`,
    );
  }

  return route.map((point) => ({ ...point, y: point.y + elevation }));
}
