import { describe, expect, it, vi } from "vitest";

import {
  buildIntroRouteFromEdges,
  computeCandidateEdges,
  computeEdgeVisualState,
  resolvePathStyle,
} from "../../scene/edgeVisualState";
import type { RenderEdge, RuntimeProgression, WorldConfig } from "../../types/world";

const edges: RenderEdge[] = [
  {
    id: "e_charlotte_to_gt",
    from: "charlotte",
    to: "georgia_tech",
    type: "main",
    scenePoints: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ],
    visibleWhen: { type: "always" },
  },
  {
    id: "e_gt_to_aquarium",
    from: "georgia_tech",
    to: "aquarium",
    type: "side",
    scenePoints: [
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
    ],
    visibleWhen: { type: "always" },
  },
];

const introMainEdges: RenderEdge[] = [
  {
    id: "e_charlotte_to_gt",
    from: "charlotte",
    to: "georgia_tech",
    type: "main",
    scenePoints: [
      { x: 0, y: 0.1, z: 0 },
      { x: 1, y: 0.1, z: 1 },
      { x: 2, y: 0.1, z: 0 },
    ],
    visibleWhen: { type: "always" },
  },
  {
    id: "e_gt_to_huntsville",
    from: "georgia_tech",
    to: "huntsville_parsons",
    type: "main",
    scenePoints: [
      { x: 2, y: 0.1, z: 0 },
      { x: 3, y: 0.1, z: -1 },
      { x: 4, y: 0.1, z: 0 },
    ],
    visibleWhen: { type: "always" },
  },
];

function progression({
  available = [],
  completed = [],
}: {
  available?: string[];
  completed?: string[];
} = {}): RuntimeProgression {
  return {
    availableNodeIds: new Set(available),
    completedNodeIds: new Set(completed),
  };
}

describe("edgeVisualState", () => {
  it("returns intro state for all edges during intro", () => {
    const visual = computeEdgeVisualState({
      edge: edges[0]!,
      progression: progression(),
      worldState: "intro",
    });

    expect(visual).toBe("intro");
  });

  it("returns default state when no progression condition is met", () => {
    const visual = computeEdgeVisualState({
      edge: edges[0]!,
      progression: progression({ available: ["charlotte"] }),
      worldState: "exploring",
    });

    expect(visual).toBe("default");
  });

  it("returns completed when edge.to is completed", () => {
    const visual = computeEdgeVisualState({
      edge: edges[0]!,
      progression: progression({
        available: ["charlotte", "georgia_tech"],
        completed: ["georgia_tech"],
      }),
      worldState: "exploring",
    });

    expect(visual).toBe("completed");
  });

  it("returns next when edge.from is completed and edge.to is available and not completed", () => {
    const visual = computeEdgeVisualState({
      edge: edges[0]!,
      progression: progression({
        available: ["charlotte", "georgia_tech"],
        completed: ["charlotte"],
      }),
      worldState: "exploring",
    });

    expect(visual).toBe("next");
  });

  it("applies next-state rule to side edges", () => {
    const visual = computeEdgeVisualState({
      edge: edges[1]!,
      progression: progression({
        available: ["georgia_tech", "aquarium"],
        completed: ["georgia_tech"],
      }),
      worldState: "exploring",
    });

    expect(visual).toBe("next");
  });

  it("returns all edges as intro candidates, and visible-only edges outside intro", () => {
    const introCandidates = computeCandidateEdges({
      worldState: "intro",
      edges,
      visibleEdgeIds: new Set(["e_charlotte_to_gt"]),
    });
    const exploringCandidates = computeCandidateEdges({
      worldState: "exploring",
      edges,
      visibleEdgeIds: new Set(["e_charlotte_to_gt"]),
    });

    expect(introCandidates).toHaveLength(2);
    expect(exploringCandidates.map((edge) => edge.id)).toEqual(["e_charlotte_to_gt"]);
  });

  it("fills fallback path style defaults", () => {
    const style = resolvePathStyle({
      baseColor: "#C9A227",
      highlightColor: "#FFD36A",
      thickness: 1,
      elevation: 0.2,
      pulseOnIntro: true,
      traceDurationMs: 1800,
    } as WorldConfig["style"]["pathStyle"]);

    expect(style.loadedColor).toBe("#8F8B84");
    expect(style.completedColor).toBe("#C9A227");
    expect(style.nextColor).toBe("#FFD36A");
    expect(style.introSweepMs).toBe(1800);
    expect(style.stateFadeMs).toBe(250);
  });

  it("builds intro route from edge waypoints (not direct node-center line)", () => {
    const route = buildIntroRouteFromEdges({
      renderEdges: introMainEdges,
      mainSequence: ["charlotte", "georgia_tech", "huntsville_parsons"],
      startNodeId: "charlotte",
      endNodeId: "huntsville_parsons",
      elevation: 0.35,
    });

    expect(route).toHaveLength(5);
    expect(route.some((point) => point.x === 1 && point.z === 1)).toBe(true);
    expect(route.some((point) => point.x === 3 && point.z === -1)).toBe(true);
  });

  it("traverses backwards and reverses segment point order when start is later in main sequence", () => {
    const route = buildIntroRouteFromEdges({
      renderEdges: introMainEdges,
      mainSequence: ["charlotte", "georgia_tech", "huntsville_parsons"],
      startNodeId: "huntsville_parsons",
      endNodeId: "charlotte",
      elevation: 0.35,
    });

    expect(route[0]?.x).toBe(4);
    expect(route[1]?.x).toBe(3);
    expect(route[2]?.x).toBe(2);
    expect(route[3]?.x).toBe(1);
    expect(route[4]?.x).toBe(0);
  });

  it("dedupes seam points across consecutive edge joins", () => {
    const route = buildIntroRouteFromEdges({
      renderEdges: introMainEdges,
      mainSequence: ["charlotte", "georgia_tech", "huntsville_parsons"],
      startNodeId: "charlotte",
      endNodeId: "huntsville_parsons",
      elevation: 0.35,
    });

    const seamCount = route.filter((point) => point.x === 2 && point.z === 0).length;
    expect(seamCount).toBe(1);
  });

  it("returns partial route and warns once if a main segment is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const route = buildIntroRouteFromEdges({
      renderEdges: [introMainEdges[0]!],
      mainSequence: ["charlotte", "georgia_tech", "huntsville_parsons"],
      startNodeId: "charlotte",
      endNodeId: "huntsville_parsons",
      elevation: 0.35,
    });

    expect(route.length).toBeGreaterThan(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});
