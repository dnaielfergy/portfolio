import { describe, expect, it } from "vitest";

import {
  buildCoordsPayload,
  clampToMapBounds,
  deriveMapWorldBounds,
  sceneToWorld,
  worldToScene,
} from "../../tuning/nodePositionCalibration";

describe("nodePositionCalibration", () => {
  it("round-trips world and scene coordinates", () => {
    const world = { x: 47.75, y: -5.75 };
    const scene = worldToScene(world.x, world.y);
    const roundTrip = sceneToWorld(scene.x, scene.z);

    expect(roundTrip.x).toBeCloseTo(world.x, 6);
    expect(roundTrip.y).toBeCloseTo(world.y, 6);
  });

  it("builds deterministic coords payload JSON", () => {
    const payload = buildCoordsPayload({ x: 47.75, y: -5.75 });

    expect(payload).toBe('{\n  "x": 47.75,\n  "y": -5.75\n}');
  });

  it("clamps coords to bounds derived from map dimensions", () => {
    const bounds = deriveMapWorldBounds({
      imageWidth: 1376,
      imageHeight: 768,
    });
    const clamped = clampToMapBounds({ x: 120, y: -80 }, bounds);

    expect(bounds.minX).toBeCloseTo(-86, 4);
    expect(bounds.maxX).toBeCloseTo(86, 4);
    expect(bounds.minY).toBeCloseTo(-48, 4);
    expect(bounds.maxY).toBeCloseTo(48, 4);
    expect(clamped.x).toBeCloseTo(86, 4);
    expect(clamped.y).toBeCloseTo(-48, 4);
  });
});
