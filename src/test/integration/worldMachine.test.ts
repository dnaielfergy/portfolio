import { describe, expect, it } from "vitest";

import { reduceWorldState } from "../../state/worldMachine";

describe("worldMachine", () => {
  it("supports intro -> idleMap transition", () => {
    expect(reduceWorldState("intro", { type: "INTRO_COMPLETED" })).toBe("idleMap");
  });

  it("rejects illegal transition", () => {
    expect(() => reduceWorldState("idleMap", { type: "OPEN_CHECKPOINT", nodeId: "charlotte" })).toThrow(
      /Illegal world state transition/,
    );
  });
});
