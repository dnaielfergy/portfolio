import { describe, expect, it } from "vitest";

import worldConfig from "../../../world/schema/world_schema_example.json";
import { resolveVehicleStageForNode, resolveVehicleStageForProgression } from "../../domain/stageResolver";
import type { WorldConfig } from "../../types/world";

const typedWorldConfig = worldConfig as unknown as WorldConfig;

describe("stageResolver", () => {
  it("defaults to runner at start", () => {
    expect(resolveVehicleStageForProgression(new Set(), typedWorldConfig)).toBe("runner");
  });

  it("does not change main stage for aquarium side quest completion", () => {
    expect(resolveVehicleStageForProgression(new Set(["aquarium"]), typedWorldConfig)).toBe("runner");
  });

  it("maps aquarium node to whale stage", () => {
    expect(resolveVehicleStageForNode("aquarium", typedWorldConfig)).toBe("whale");
  });

  it("promotes stage with main progression completion", () => {
    const completed = new Set(["charlotte", "georgia_tech", "huntsville_parsons"]);
    expect(resolveVehicleStageForProgression(completed, typedWorldConfig)).toBe("parsons_truck");
  });
});
