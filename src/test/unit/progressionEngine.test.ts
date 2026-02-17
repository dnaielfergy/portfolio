import { describe, expect, it } from "vitest";

import { normalizeWorldConfig } from "../../data/loadWorldConfig";
import worldConfig from "../../../world/schema/world_schema_example.json";
import { createProgressionEngine } from "../../domain/progressionEngine";
import type { WorldConfig } from "../../types/world";

const typedWorldConfig = worldConfig as unknown as WorldConfig;

describe("progressionEngine", () => {
  it("starts with the configured start node available", () => {
    const world = normalizeWorldConfig(typedWorldConfig);
    const engine = createProgressionEngine(world);

    expect(engine.getAvailableNodes()).toContain(world.config.progression.startNodeId);
  });

  it("marks completion and reveals next main node", () => {
    const world = normalizeWorldConfig(typedWorldConfig);
    const engine = createProgressionEngine(world);

    engine.markCompleted("charlotte");

    expect(engine.getAvailableNodes()).toContain("georgia_tech");
    expect(engine.getProgression().completedNodeIds.has("charlotte")).toBe(true);
  });
});
