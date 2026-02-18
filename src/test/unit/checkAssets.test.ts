import { afterEach, describe, expect, it, vi } from "vitest";

import { checkRequiredAssets } from "../../bootstrap/checkAssets";
import type { WorldConfig } from "../../types/world";

const baseConfig: WorldConfig = {
  meta: {
    worldId: "test_world",
    version: "1.0.0",
    title: "Test",
    resumePdfUrl: "/resume.pdf",
  },
  assets: {
    mapImage: "/assets/map_without_line.png",
    referenceImages: {
      charlotte: "/assets/charlotte.png",
    },
    models: {},
  },
  style: {
    materials: {
      finish: "matte",
      roundEdges: true,
      noPhotorealism: true,
      noHighFreqTextures: true,
    },
    pathStyle: {
      baseColor: "#C9A227",
      highlightColor: "#FFD36A",
      thickness: 1,
      elevation: 0.2,
      pulseOnIntro: true,
      traceDurationMs: 1800,
    },
    nodeMarkerStyle: {
      shape: "disc",
      defaultScale: 1,
      completedColor: "#2B2B2B",
      hoverGlow: true,
      labelOnProximity: false,
    },
    fogStyle: {
      introFogOpacity: 0.15,
      settleFogOpacity: 0.08,
      sfFogOpacity: 0.22,
    },
    regionPalettes: {
      charlotte: {
        primary: "#0085CA",
        secondary: "#000000",
        accent: "#C0C0C0",
      },
    },
  },
  intro: {
    enabled: true,
    durationMs: 3000,
    startPreset: "introStart",
    endPreset: "introEnd",
    skipOnInput: true,
    settleToState: "idleMap",
    pathTrace: {
      enabled: true,
      startNodeId: "charlotte",
      endNodeId: "charlotte",
      durationMs: 1800,
      glowColor: "#FFD36A",
      pulseNodes: true,
    },
    fogAnimation: {
      startOpacity: 0.15,
      endOpacity: 0.08,
      easing: "cubicInOut",
    },
  },
  cameraPresets: {
    introStart: { position: [0, 0, 0], lookAt: [0, 0, 0], fov: 42, damping: 0.08 },
    introEnd: { position: [0, 0, 0], lookAt: [0, 0, 0], fov: 42, damping: 0.08 },
    focusCharlotte: { position: [0, 0, 0], lookAt: [0, 0, 0], fov: 42, damping: 0.08 },
    checkpointDefault: { position: [0, 0, 0], lookAt: [0, 0, 0], fov: 42, damping: 0.08 },
    finalSF: { position: [0, 0, 0], lookAt: [0, 0, 0], fov: 42, damping: 0.08 },
  },
  ui: {
    startButton: { label: "Start", centered: true },
    tutorial: { title: "Tutorial", lines: ["Line"], dismissOnAnyInput: true },
    hud: { showProgress: true, showResumeLink: true, resumeLabel: "Resume" },
    checkpointPanel: {
      titleSuffix: "- Checkpoint",
      openKey: "Enter",
      closeKey: "Escape",
      slideFrom: "right",
      widthPercent: 55,
      blurBackground: true,
    },
  },
  vehicles: {
    stages: [{ id: "runner", label: "Runner", ref: "/world/vehicles/vehicles_spec.md" }],
    transformRules: {
      durationMs: 500,
      spinDegrees: 360,
      swapAtPercent: 0.6,
      motionBlur: true,
      dustPuff: true,
      cameraMicroZoomPercent: 3,
    },
    stageByNodeId: { charlotte: "runner" },
  },
  environment: {
    collision: {
      enabled: true,
      playerRadius: 0.9,
      maxSlideIterations: 4,
    },
    buildings: [
      {
        id: "test_building",
        position: { x: 4, y: 4 },
        size: { width: 3, depth: 3, height: 2 },
      },
    ],
  },
  nodes: [
    {
      id: "charlotte",
      name: "Charlotte",
      type: "main",
      region: "charlotte",
      coords: { x: 0, y: 0 },
      radius: 1,
      marker: { label: true, icon: "dot" },
      checkpointContentRef: "/content/checkpoints/charlotte.md",
      unlock: { type: "start" },
      completion: { type: "open_checkpoint_once" },
    },
  ],
  edges: [],
  progression: {
    startNodeId: "charlotte",
    finalNodeId: "charlotte",
    mainSequence: ["charlotte"],
    sideQuests: {},
    onCompleteNode: {
      setNodeCompletedColor: "#2B2B2B",
      enableNextEdgeGlow: true,
      triggerTransform: true,
    },
    onEnterFinal: {
      lockMovement: true,
      increaseFog: true,
      showResumeCTA: true,
      showFutureLevelsText: true,
    },
  },
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("checkRequiredAssets", () => {
  it("flags duplicate configured base map content", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const target = String(input);
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      if (target === "/assets/map_without_line.png" || target === "/assets/map.png") {
        return new Response("same-map-content", { status: 200 });
      }
      return new Response("other", { status: 200 });
    }) as typeof globalThis.fetch;

    const result = await checkRequiredAssets(baseConfig);

    expect(result.missing).toHaveLength(0);
    expect(result.identityIssues).toHaveLength(1);
  });

  it("does not flag identity issue when base map differs from legacy map", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const target = String(input);
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      if (target === "/assets/map_without_line.png") {
        return new Response("clean-map-content", { status: 200 });
      }
      if (target === "/assets/map.png") {
        return new Response("legacy-map-content", { status: 200 });
      }
      return new Response("other", { status: 200 });
    }) as typeof globalThis.fetch;

    const result = await checkRequiredAssets(baseConfig);

    expect(result.missing).toHaveLength(0);
    expect(result.identityIssues).toHaveLength(0);
  });
});
