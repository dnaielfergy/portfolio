import { describe, expect, it } from "vitest";

import { resolveActivePlayerRadius, type VehicleColliderWorldConfig } from "../../physics/vehicleCollider";
import type { TransformState } from "../../types/world";

const IDLE_TRANSFORM: TransformState = {
  status: "idle",
  progress: 0,
  fromStage: "runner",
  toStage: "runner",
};

function makeWorldConfig(): VehicleColliderWorldConfig {
  return {
    vehicles: {
      stages: [
        {
          id: "runner",
          label: "Runner",
          ref: "/world/vehicles/vehicles_spec.md",
          collider: {
            shape: "circle",
            radius: 0.18,
          },
        },
        {
          id: "wreck",
          label: "Wreck",
          ref: "/world/vehicles/vehicles_spec.md",
          collider: {
            shape: "circle",
            radius: 0.3,
          },
        },
        {
          id: "whale",
          label: "Whale",
          ref: "/world/vehicles/vehicles_spec.md",
          collider: {
            shape: "circle",
            radius: 0.2,
          },
        },
        {
          id: "fallback_stage",
          label: "Fallback",
          ref: "/world/vehicles/vehicles_spec.md",
        },
      ],
    },
    environment: {
      collision: {
        enabled: true,
        playerRadius: 0.85,
        maxSlideIterations: 4,
      },
    },
  };
}

describe("resolveActivePlayerRadius", () => {
  it("uses stage collider radius when available", () => {
    const radius = resolveActivePlayerRadius({
      worldConfig: makeWorldConfig(),
      activeVehicleStageId: "wreck",
      transform: IDLE_TRANSFORM,
    });

    expect(radius).toBe(0.3);
  });

  it("falls back to global radius when stage collider is missing", () => {
    const radius = resolveActivePlayerRadius({
      worldConfig: makeWorldConfig(),
      activeVehicleStageId: "fallback_stage",
      transform: IDLE_TRANSFORM,
    });

    expect(radius).toBe(0.85);
  });

  it("uses the larger from/to radius while transforming", () => {
    const radius = resolveActivePlayerRadius({
      worldConfig: makeWorldConfig(),
      activeVehicleStageId: "whale",
      transform: {
        status: "running",
        progress: 0.4,
        fromStage: "whale",
        toStage: "wreck",
      },
    });

    expect(radius).toBe(0.3);
  });

  it("handles unknown stage ids with fallback safely", () => {
    const radius = resolveActivePlayerRadius({
      worldConfig: makeWorldConfig(),
      activeVehicleStageId: "unknown_stage",
      transform: IDLE_TRANSFORM,
    });

    expect(radius).toBe(0.85);
  });
});
