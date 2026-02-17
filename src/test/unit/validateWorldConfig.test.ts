import { describe, expect, it } from "vitest";

import worldConfig from "../../../world/schema/world_schema_example.json";
import { validateWorldConfig } from "../../bootstrap/validateWorldConfig";
import type { WorldConfig } from "../../types/world";

const typedWorldConfig = worldConfig as unknown as WorldConfig;

describe("validateWorldConfig", () => {
  it("accepts canonical world schema example", () => {
    expect(() => validateWorldConfig(typedWorldConfig)).not.toThrow();
  });

  it("rejects duplicate node ids", () => {
    const invalid = {
      ...typedWorldConfig,
      nodes: [...typedWorldConfig.nodes, { ...typedWorldConfig.nodes[0] }],
    };

    expect(() => validateWorldConfig(invalid as WorldConfig)).toThrow(/Duplicate node id/);
  });
});
