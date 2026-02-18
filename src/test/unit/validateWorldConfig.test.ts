import { describe, expect, it } from "vitest";

import worldConfig from "../../../world/schema/world_schema_example.json";
import { validateWorldConfig } from "../../bootstrap/validateWorldConfig";
import type { WorldConfig, WorldConfigSource } from "../../types/world";

const typedWorldConfig = worldConfig as unknown as WorldConfigSource;

function makeInlineEnvironmentConfig(): WorldConfig {
  return {
    ...(typedWorldConfig as Omit<WorldConfig, "environment">),
    environment: {
      collision: {
        enabled: true,
        playerRadius: 0.9,
        maxSlideIterations: 4,
      },
      buildings: [
        {
          id: "test_building",
          position: { x: 0, y: 0 },
          size: { width: 2, depth: 2, height: 2 },
        },
      ],
      props: [
        {
          id: "test_prop",
          position: { x: 2, y: 2 },
          size: { width: 1, depth: 1, height: 1 },
        },
      ],
    },
  };
}

describe("validateWorldConfig", () => {
  it("accepts canonical world schema example", () => {
    expect(() => validateWorldConfig(typedWorldConfig as unknown as WorldConfig)).not.toThrow();
  });

  it("rejects duplicate node ids", () => {
    const invalid = {
      ...typedWorldConfig,
      nodes: [...typedWorldConfig.nodes, { ...typedWorldConfig.nodes[0] }],
    };

    expect(() => validateWorldConfig(invalid as WorldConfig)).toThrow(/Duplicate node id/);
  });

  it("rejects duplicate environment object ids", () => {
    const inline = makeInlineEnvironmentConfig();
    const invalid = {
      ...inline,
      environment: {
        ...inline.environment,
        props: [
          ...(inline.environment.props ?? []),
          {
            id: inline.environment.buildings[0]?.id ?? "test_building",
            position: { x: 0, y: 0 },
            size: { width: 1, depth: 1, height: 1 },
          },
        ],
      },
    };

    expect(() => validateWorldConfig(invalid as WorldConfig)).toThrow(/Duplicate environment object id/);
  });

  it("rejects out-of-bounds environment placements", () => {
    const inline = makeInlineEnvironmentConfig();
    const invalid = {
      ...inline,
      environment: {
        ...inline.environment,
        buildings: [
          ...inline.environment.buildings,
          {
            id: "far_away",
            position: { x: 1000, y: 1000 },
            size: { width: 2, depth: 2, height: 2 },
          },
        ],
      },
    };

    expect(() => validateWorldConfig(invalid as WorldConfig)).toThrow(/outside map sanity bounds/);
  });

  it("rejects invalid vehicle stage collider radius", () => {
    const invalid = {
      ...typedWorldConfig,
      vehicles: {
        ...typedWorldConfig.vehicles,
        stages: typedWorldConfig.vehicles.stages.map((stage, index) =>
          index === 0
            ? {
                ...stage,
                collider: {
                  shape: "circle",
                  radius: 0,
                },
              }
            : stage,
        ),
      },
    };

    expect(() => validateWorldConfig(invalid as unknown as WorldConfig)).toThrow(/radius|greater than 0|exclusiveMinimum/);
  });
});
