import { describe, expect, it } from "vitest";

import { buildCollisionIndex, resolveMovementWithCollisions } from "../../physics/collision";
import type { EnvironmentConfig } from "../../types/world";

const RADIUS_SWEEP = [0.65, 0.75, 0.85, 0.95, 1.05] as const;
const ATLANTA_BLOCKER = {
  center: { x: 21.2, y: -5.8 },
  halfSize: { x: 1.4, y: 1.4 },
  rotationRad: (8 * Math.PI) / 180,
};

function rotate(point: { x: number; y: number }, radians: number): { x: number; y: number } {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

function distanceToBlockerFootprint(point: { x: number; y: number }): number {
  const translated = {
    x: point.x - ATLANTA_BLOCKER.center.x,
    y: point.y - ATLANTA_BLOCKER.center.y,
  };
  const local = rotate(translated, -ATLANTA_BLOCKER.rotationRad);
  const dx = Math.max(Math.abs(local.x) - ATLANTA_BLOCKER.halfSize.x, 0);
  const dy = Math.max(Math.abs(local.y) - ATLANTA_BLOCKER.halfSize.y, 0);
  return Math.hypot(dx, dy);
}

function makeAtlantaTuningEnvironment(playerRadius: number): EnvironmentConfig {
  return {
    collision: {
      enabled: true,
      playerRadius,
      maxSlideIterations: 4,
    },
    buildings: [
      {
        id: "atlanta_tuning_blocker",
        position: { x: 21.2, y: -5.8 },
        size: { width: 2.8, depth: 2.8, height: 5.8 },
        rotation: 8,
      },
    ],
  };
}

function runSweepCase(playerRadius: number): {
  direct: ReturnType<typeof resolveMovementWithCollisions>;
  diagonal: ReturnType<typeof resolveMovementWithCollisions>;
  tunneling: ReturnType<typeof resolveMovementWithCollisions>;
} {
  const environment = makeAtlantaTuningEnvironment(playerRadius);
  const index = buildCollisionIndex(environment);

  const direct = resolveMovementWithCollisions({
    index,
    position: { x: 24.5, y: -5.8 },
    velocity: { x: -22, y: 0 },
    deltaSeconds: 0.45,
    collision: environment.collision,
  });

  const diagonal = resolveMovementWithCollisions({
    index,
    position: { x: 24.3, y: -8.2 },
    velocity: { x: -16, y: 10 },
    deltaSeconds: 0.45,
    collision: environment.collision,
  });

  const tunneling = resolveMovementWithCollisions({
    index,
    position: { x: 25.5, y: -5.8 },
    velocity: { x: -110, y: 0 },
    deltaSeconds: 0.2,
    collision: environment.collision,
  });

  return {
    direct,
    diagonal,
    tunneling,
  };
}

describe("collision radius sweep baseline", () => {
  it("keeps blockers solid and sliding behavior stable across the Atlanta radius sweep", () => {
    const results = RADIUS_SWEEP.map((radius) => {
      const scenarios = runSweepCase(radius);
      const directGap = distanceToBlockerFootprint(scenarios.direct.position);
      const diagonalGap = distanceToBlockerFootprint(scenarios.diagonal.position);
      const tunnelGap = distanceToBlockerFootprint(scenarios.tunneling.position);

      expect(scenarios.direct.collided).toBe(true);
      expect(scenarios.direct.position.x).toBeLessThan(24.5);
      expect(directGap).toBeGreaterThanOrEqual(radius - 0.01);

      expect(scenarios.diagonal.collided).toBe(true);
      expect(scenarios.diagonal.position.y).toBeGreaterThan(-8.2);
      expect(diagonalGap).toBeGreaterThanOrEqual(radius - 0.01);

      expect(scenarios.tunneling.collided).toBe(true);
      expect(scenarios.tunneling.position.x).toBeGreaterThan(3.5 + 8);
      expect(tunnelGap).toBeGreaterThanOrEqual(radius - 0.01);

      return {
        radius,
        directGap,
      };
    });

    for (let index = 1; index < results.length; index += 1) {
      const previous = results[index - 1];
      const current = results[index];
      expect(current?.directGap ?? 0).toBeGreaterThan(previous?.directGap ?? 0);
    }
  });
});
