import { describe, expect, it } from "vitest";

import { createCameraController } from "../../camera/cameraController";
import type { CameraContext, CameraSnapshot } from "../../camera/cameraController";

const PRESETS = {
  introStart: {
    position: [-40, 40, 60] as [number, number, number],
    lookAt: [-25, 0, 0] as [number, number, number],
    fov: 42,
    damping: 0.08,
  },
  introEnd: {
    position: [0, 65, 110] as [number, number, number],
    lookAt: [0, 0, 0] as [number, number, number],
    fov: 42,
    damping: 0.08,
  },
  focusCharlotte: {
    position: [35, 35, 45] as [number, number, number],
    lookAt: [28, -5, 0] as [number, number, number],
    fov: 42,
    damping: 0.1,
  },
  checkpointDefault: {
    position: [0, 30, 35] as [number, number, number],
    lookAt: [0, 0, 0] as [number, number, number],
    fov: 42,
    damping: 0.12,
  },
  finalSF: {
    position: [-30, 38, 52] as [number, number, number],
    lookAt: [-28, 5, 0] as [number, number, number],
    fov: 40,
    damping: 0.08,
  },
};

const INTRO = {
  enabled: true,
  durationMs: 3000,
  startPreset: "introStart",
  endPreset: "introEnd",
  skipOnInput: true,
  settleToState: "idleMap" as const,
  pathTrace: {
    enabled: true,
    startNodeId: "san_francisco",
    endNodeId: "charlotte",
    durationMs: 1800,
    glowColor: "#FFD36A",
    pulseNodes: true,
  },
  fogAnimation: {
    startOpacity: 0.15,
    endOpacity: 0.08,
    easing: "cubicInOut",
  },
};

function context(overrides?: Partial<CameraContext>): CameraContext {
  return {
    state: "exploring",
    playerPosition: { x: 10, y: 5 },
    playerVelocity: { x: 0, y: 0 },
    intro: INTRO,
    transformProgress: 0,
    transformMicroZoomPercent: 0,
    ...overrides,
  };
}

function orientation(snapshot: CameraSnapshot): { x: number; y: number; z: number } {
  return {
    x: snapshot.position.x - snapshot.lookAt.x,
    y: snapshot.position.y - snapshot.lookAt.y,
    z: snapshot.position.z - snapshot.lookAt.z,
  };
}

describe("cameraController exploring behavior", () => {
  it("keeps orientation invariant for opposite movement directions", () => {
    const controller = createCameraController({ presets: PRESETS });

    const withPositiveVelocity = controller.setState(
      "exploring",
      context({ playerVelocity: { x: 10, y: -10 } }),
      { immediate: true },
    );
    const withNegativeVelocity = controller.setState(
      "exploring",
      context({ playerVelocity: { x: -10, y: 10 } }),
      { immediate: true },
    );

    expect(orientation(withPositiveVelocity)).toEqual(orientation(withNegativeVelocity));
  });

  it("tracks player translation while preserving camera offset", () => {
    const controller = createCameraController({ presets: PRESETS });

    const snapshotA = controller.setState("exploring", context({ playerPosition: { x: 0, y: 0 } }), {
      immediate: true,
    });
    const snapshotB = controller.setState("exploring", context({ playerPosition: { x: 20, y: -10 } }), {
      immediate: true,
    });

    expect(snapshotA.position.x).not.toBe(snapshotB.position.x);
    expect(snapshotA.position.z).not.toBe(snapshotB.position.z);
    expect(orientation(snapshotA)).toEqual(orientation(snapshotB));
  });

  it("approaches target smoothly without snapping", () => {
    const controller = createCameraController({ presets: PRESETS });
    controller.setState("exploring", context({ playerPosition: { x: 0, y: 0 } }), { immediate: true });
    controller.setState("exploring", context({ playerPosition: { x: 30, y: 0 } }));

    const first = controller.update(16, context({ playerPosition: { x: 30, y: 0 } }));
    const second = controller.update(16, context({ playerPosition: { x: 30, y: 0 } }));

    expect(first.position.x).toBeLessThan(second.position.x);
  });

  it("keeps checkpoint and final state preset behavior intact", () => {
    const controller = createCameraController({ presets: PRESETS });

    const checkpoint = controller.setState(
      "checkpointOpen",
      context({
        state: "checkpointOpen",
        checkpointNodePosition: { x: 12, y: 4 },
      }),
      { immediate: true },
    );
    const finalState = controller.setState("finalState", context({ state: "finalState" }), { immediate: true });

    expect(checkpoint.presetKey).toBe("checkpointDefault");
    expect(finalState.presetKey).toBe("finalSF");
  });

  it("centers focusCharlotte lookAt on the player position", () => {
    const controller = createCameraController({ presets: PRESETS });
    const playerPosition = { x: 18, y: -4 };
    const snapshot = controller.setState(
      "focusCharlotte",
      context({ state: "focusCharlotte", playerPosition }),
      { immediate: true },
    );

    const expected = snapshot.lookAt;
    const exploring = controller.setState(
      "exploring",
      context({ state: "exploring", playerPosition }),
      { immediate: true },
    );

    expect(expected.x).toBeCloseTo(exploring.lookAt.x, 6);
    expect(expected.z).toBeCloseTo(exploring.lookAt.z, 6);
  });

  it("keeps tutorial and exploring aligned for the same player position", () => {
    const controller = createCameraController({ presets: PRESETS });
    const ctx = context({ playerPosition: { x: 14, y: -3 } });

    const tutorial = controller.setState("tutorial", { ...ctx, state: "tutorial" }, { immediate: true });
    const exploring = controller.setState("exploring", { ...ctx, state: "exploring" }, { immediate: true });

    expect(orientation(tutorial)).toEqual(orientation(exploring));
    expect(tutorial.position.x).toBeCloseTo(exploring.position.x, 6);
    expect(tutorial.position.y).toBeCloseTo(exploring.position.y, 6);
    expect(tutorial.position.z).toBeCloseTo(exploring.position.z, 6);
  });

  it("transitions smoothly from intro to idleMap without a snap", () => {
    const controller = createCameraController({ presets: PRESETS });
    const ctx = context({ playerPosition: { x: 12, y: 8 } });

    controller.setState("intro", { ...ctx, state: "intro" }, { immediate: true });
    controller.update(1500, { ...ctx, state: "intro" });
    const introFrame = controller.update(16, { ...ctx, state: "intro" });

    controller.setState("idleMap", { ...ctx, state: "idleMap" });
    const idleFrameA = controller.update(16, { ...ctx, state: "idleMap" });
    const idleFrameB = controller.update(16, { ...ctx, state: "idleMap" });

    const deltaA = Math.abs(idleFrameA.position.x - introFrame.position.x);
    const deltaB = Math.abs(idleFrameB.position.x - idleFrameA.position.x);

    expect(deltaA).toBeGreaterThan(0);
    expect(deltaB).toBeGreaterThan(0);
    expect(deltaB).toBeLessThan(deltaA);
  });
});
