import { describe, expect, it } from "vitest";

import worldConfig from "../../../world/schema/world_schema_example.json";
import type { WorldConfig } from "../../types/world";

const typedWorldConfig = worldConfig as unknown as WorldConfig;

const IMAGE_WIDTH = 1376;
const IMAGE_HEIGHT = 768;
const MAP_PLANE_HEIGHT = 240;
const SCENE_SCALE = 2.5;

function pixelToWorld(px: number, py: number): { x: number; y: number } {
  const mapPlaneWidth = MAP_PLANE_HEIGHT * (IMAGE_WIDTH / IMAGE_HEIGHT);
  const sceneX = (px / IMAGE_WIDTH - 0.5) * mapPlaneWidth;
  const sceneZ = (py / IMAGE_HEIGHT - 0.5) * MAP_PLANE_HEIGHT;
  return {
    x: sceneX / SCENE_SCALE,
    y: -sceneZ / SCENE_SCALE,
  };
}

describe("world anchor calibration", () => {
  it("maps canonical node anchors to schema world coords", () => {
    const expectedAnchors: Record<string, { px: number; py: number }> = {
      san_francisco: { px: 190, py: 334 },
      palo_alto_wisk: { px: 225, py: 372 },
      san_diego_fictiv: { px: 272, py: 480 },
      huntsville_parsons: { px: 871, py: 461 },
      georgia_tech: { px: 1000, py: 490 },
      aquarium: { px: 1032, py: 500 },
      charlotte: { px: 1070, py: 430 },
    };

    const nodesById = Object.fromEntries(typedWorldConfig.nodes.map((node) => [node.id, node]));

    for (const [nodeId, anchor] of Object.entries(expectedAnchors)) {
      const node = nodesById[nodeId];
      expect(node).toBeDefined();
      if (!node) {
        continue;
      }

      const expected = pixelToWorld(anchor.px, anchor.py);
      expect(node.coords.x).toBeCloseTo(expected.x, 4);
      expect(node.coords.y).toBeCloseTo(expected.y, 4);
    }
  });

  it("keeps aquarium east of Atlanta in calibrated layout", () => {
    const nodesById = Object.fromEntries(typedWorldConfig.nodes.map((node) => [node.id, node]));
    const aquarium = nodesById.aquarium;
    const atlanta = nodesById.georgia_tech;

    expect(aquarium).toBeDefined();
    expect(atlanta).toBeDefined();
    if (!aquarium || !atlanta) {
      return;
    }

    expect(aquarium.coords.x).toBeGreaterThan(atlanta.coords.x);
  });
});
