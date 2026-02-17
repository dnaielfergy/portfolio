import { CAMERA_PROFILES } from "./cameraProfiles";
import type { CameraPresetMap, WorldState } from "../types/world";

export interface CameraContext {
  state: WorldState;
  playerPosition: { x: number; y: number };
  playerVelocity: { x: number; y: number };
}

export interface CameraSnapshot {
  presetKey: keyof CameraPresetMap;
  zoomDeltaPercent: number;
  freezeFollow: boolean;
  dofBoost: number;
}

export interface CameraController {
  setState: (state: WorldState, context: CameraContext) => CameraSnapshot;
  skipIntroSettle: () => CameraSnapshot;
  getCurrent: () => CameraSnapshot;
}

export function createCameraController(presets: CameraPresetMap): CameraController {
  const stateToPreset: Record<WorldState, keyof CameraPresetMap> = {
    intro: "introStart",
    idleMap: "introEnd",
    tutorial: "introEnd",
    focusCharlotte: "focusCharlotte",
    exploring: "checkpointDefault",
    checkpointOpen: "checkpointDefault",
    transforming: "checkpointDefault",
    finalState: "finalSF",
  };

  let current: CameraSnapshot = {
    presetKey: "introStart",
    zoomDeltaPercent: 0,
    freezeFollow: true,
    dofBoost: 0,
  };

  return {
    setState: (state, context) => {
      void context;
      const profile = CAMERA_PROFILES[state];
      current = {
        presetKey: stateToPreset[state],
        zoomDeltaPercent: profile.zoomDeltaPercent,
        freezeFollow: profile.freezeFollow,
        dofBoost: profile.dofBoost,
      };

      // NOTE: interpolation and frame-based follow are intentionally implemented by render runtime.
      void presets;
      return current;
    },
    skipIntroSettle: () => {
      current = {
        presetKey: "introEnd",
        zoomDeltaPercent: 0,
        freezeFollow: true,
        dofBoost: 0,
      };
      return current;
    },
    getCurrent: () => current,
  };
}
