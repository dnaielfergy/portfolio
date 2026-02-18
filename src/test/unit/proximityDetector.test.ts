import { describe, expect, it } from "vitest";

import { isNodeOpenableNow } from "../../input/proximityDetector";

describe("isNodeOpenableNow", () => {
  it("returns true only when exploring + available + in range", () => {
    const openable = isNodeOpenableNow({
      worldState: "exploring",
      isAvailable: true,
      player: { x: 10, y: 5 },
      node: {
        coords: { x: 10, y: 5 },
        radius: 3,
      },
    });

    expect(openable).toBe(true);
  });

  it("returns false when player is out of range", () => {
    const openable = isNodeOpenableNow({
      worldState: "exploring",
      isAvailable: true,
      player: { x: 50, y: 50 },
      node: {
        coords: { x: 10, y: 5 },
        radius: 3,
      },
    });

    expect(openable).toBe(false);
  });

  it("returns false for unavailable nodes or non-exploring states", () => {
    const unavailable = isNodeOpenableNow({
      worldState: "exploring",
      isAvailable: false,
      player: { x: 10, y: 5 },
      node: {
        coords: { x: 10, y: 5 },
        radius: 3,
      },
    });
    const wrongState = isNodeOpenableNow({
      worldState: "checkpointOpen",
      isAvailable: true,
      player: { x: 10, y: 5 },
      node: {
        coords: { x: 10, y: 5 },
        radius: 3,
      },
    });

    expect(unavailable).toBe(false);
    expect(wrongState).toBe(false);
  });
});

