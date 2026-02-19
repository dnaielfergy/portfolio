import { afterEach, describe, expect, it, vi } from "vitest";

import worldConfig from "../../../world/schema/world_schema_example.json";
import { loadWorldConfig } from "../../data/loadWorldConfig";
import type { WorldConfigSource } from "../../types/world";

const originalFetch = globalThis.fetch;
const sourceConfig = worldConfig as unknown as WorldConfigSource;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("loadWorldConfig", () => {
  it("resolves manifest-based environment into runtime buildings and props", async () => {
    const worldWithManifest: WorldConfigSource = {
      ...sourceConfig,
      environment: {
        manifestRef: "/manifest.json",
      },
    };

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path === "/config.json") {
        return new Response(JSON.stringify(worldWithManifest), { status: 200 });
      }
      if (path === "/manifest.json") {
        return new Response(
          JSON.stringify({
            version: "1.0.0",
            collision: {
              enabled: true,
              playerRadius: 1,
              maxSlideIterations: 3,
            },
            kitRefs: ["/kit.json"],
            regionRefs: ["/region.json"],
          }),
          { status: 200 },
        );
      }
      if (path === "/kit.json") {
        return new Response(
          JSON.stringify({
            id: "test_kit",
            modules: [
              {
                id: "midrise",
                size: { width: 2, depth: 3, height: 4 },
                styleKey: "charlotte",
                colliderByDefault: true,
              },
              {
                id: "sculpture",
                size: { width: 1, depth: 1, height: 1.5 },
                styleKey: "charlotte",
                colliderByDefault: false,
              },
            ],
          }),
          { status: 200 },
        );
      }
      if (path === "/region.json") {
        return new Response(
          JSON.stringify({
            id: "charlotte",
            buildings: [
              {
                id: "charlotte_block_1",
                moduleId: "midrise",
                position: { x: 1, y: 2 },
                rotation: 30,
              },
            ],
            props: [
              {
                id: "charlotte_statue",
                moduleId: "sculpture",
                position: { x: 2, y: 3 },
              },
            ],
          }),
          { status: 200 },
        );
      }

      return new Response("not found", { status: 404 });
    }) as typeof globalThis.fetch;

    const config = await loadWorldConfig("/config.json");

    expect(config.environment.collision.playerRadius).toBe(1);
    expect(config.environment.buildings).toHaveLength(1);
    expect(config.environment.buildings[0]?.size.height).toBe(4);
    expect(config.environment.props).toHaveLength(1);
    expect(config.environment.props?.[0]?.id).toBe("charlotte_statue");
    expect(config.vehicles.stages.find((stage) => stage.id === "wreck")?.collider?.radius).toBe(0.3);
  });

  it("defaults style.scale multipliers to 1 when omitted", async () => {
    const withoutScale: WorldConfigSource = {
      ...sourceConfig,
      style: {
        ...sourceConfig.style,
        scale: undefined,
      },
      environment: {
        manifestRef: "/manifest.json",
      },
    };

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path === "/config.json") {
        return new Response(JSON.stringify(withoutScale), { status: 200 });
      }
      if (path === "/manifest.json") {
        return new Response(
          JSON.stringify({
            version: "1.0.0",
            collision: {
              enabled: true,
              playerRadius: 1,
              maxSlideIterations: 3,
            },
            kitRefs: ["/kit.json"],
            regionRefs: ["/region.json"],
          }),
          { status: 200 },
        );
      }
      if (path === "/kit.json") {
        return new Response(
          JSON.stringify({
            id: "test_kit",
            modules: [
              {
                id: "midrise",
                size: { width: 2, depth: 3, height: 4 },
                styleKey: "charlotte",
                colliderByDefault: true,
              },
            ],
          }),
          { status: 200 },
        );
      }
      if (path === "/region.json") {
        return new Response(
          JSON.stringify({
            id: "charlotte",
            buildings: [
              {
                id: "charlotte_block_1",
                moduleId: "midrise",
                position: { x: 1, y: 2 },
                rotation: 30,
              },
            ],
          }),
          { status: 200 },
        );
      }

      return new Response("not found", { status: 404 });
    }) as typeof globalThis.fetch;

    const config = await loadWorldConfig("/config.json");
    expect(config.style.scale).toEqual({
      worldVisualMultiplier: 1,
      vehicleVisualMultiplier: 1,
    });
  });
});
