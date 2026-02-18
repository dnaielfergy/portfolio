import { describe, expect, it } from "vitest";

import { buildCollisionIndex, resolveMovementWithCollisions } from "../../physics/collision";
import type { EnvironmentConfig } from "../../types/world";

function makeEnvironment(): EnvironmentConfig {
  return {
    collision: {
      enabled: true,
      playerRadius: 0.9,
      maxSlideIterations: 4,
    },
    buildings: [
      {
        id: "core_block",
        position: { x: 0, y: 0 },
        size: { width: 4, depth: 4, height: 3 },
      },
      {
        id: "thin_wall",
        position: { x: 6, y: 0 },
        size: { width: 1, depth: 6, height: 3 },
      },
    ],
  };
}

describe("collision resolution", () => {
  it("prevents entering a blocking footprint", () => {
    const environment = makeEnvironment();
    const index = buildCollisionIndex(environment);

    const result = resolveMovementWithCollisions({
      index,
      position: { x: -4, y: 0 },
      velocity: { x: 10, y: 0 },
      deltaSeconds: 0.5,
      collision: environment.collision,
    });

    expect(result.collided).toBe(true);
    expect(result.position.x).toBeLessThanOrEqual(-2.9);
    expect(Math.abs(result.position.y)).toBeLessThan(0.05);
  });

  it("slides when approaching obstacle diagonally", () => {
    const environment = makeEnvironment();
    const index = buildCollisionIndex(environment);

    const result = resolveMovementWithCollisions({
      index,
      position: { x: -4, y: -3.2 },
      velocity: { x: 8, y: 6 },
      deltaSeconds: 0.5,
      collision: environment.collision,
    });

    expect(result.collided).toBe(true);
    expect(result.position.x).toBeLessThanOrEqual(-2.9);
    expect(result.position.y).toBeGreaterThan(-1.8);
  });

  it("uses substeps to avoid tunneling through thin blockers", () => {
    const environment = makeEnvironment();
    const index = buildCollisionIndex(environment);

    const result = resolveMovementWithCollisions({
      index,
      position: { x: 0, y: 0 },
      velocity: { x: 70, y: 0 },
      deltaSeconds: 0.2,
      collision: environment.collision,
    });

    expect(result.collided).toBe(true);
    expect(result.position.x).toBeLessThanOrEqual(4.6);
  });

  it("bypasses collision logic when disabled", () => {
    const environment = makeEnvironment();
    const index = buildCollisionIndex(environment);

    const result = resolveMovementWithCollisions({
      index,
      position: { x: -4, y: 0 },
      velocity: { x: 10, y: 0 },
      deltaSeconds: 0.5,
      collision: {
        ...environment.collision,
        enabled: false,
      },
    });

    expect(result.collided).toBe(false);
    expect(result.position.x).toBeCloseTo(1, 6);
  });
});

