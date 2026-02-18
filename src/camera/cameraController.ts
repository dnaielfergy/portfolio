import { CAMERA_PROFILES } from "./cameraProfiles";
import { toSceneCoords } from "../data/loadWorldConfig";
import type { CameraPreset, CameraRuntimeState, IntroConfig, WorldState } from "../types/world";

export interface CameraContext {
  state: WorldState;
  playerPosition: { x: number; y: number };
  playerVelocity: { x: number; y: number };
  intro: IntroConfig;
  checkpointNodePosition?: { x: number; y: number };
  transformProgress: number;
  transformMicroZoomPercent: number;
}

export interface CameraSnapshot {
  position: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
  fov: number;
  damping: number;
  dofBoost: number;
  presetKey: string;
}

export interface CameraController {
  setState: (state: WorldState, context: CameraContext, options?: { immediate?: boolean }) => CameraSnapshot;
  update: (deltaMs: number, context: CameraContext) => CameraSnapshot;
  skipIntroSettle: () => CameraSnapshot;
  getCurrent: () => CameraSnapshot;
}

function easeInOutCubic(t: number): number {
  if (t < 0.5) {
    return 4 * t * t * t;
  }
  return 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}

function clonePresetToRuntime(preset: CameraPreset): CameraRuntimeState {
  return {
    position: {
      x: preset.position[0],
      y: preset.position[1],
      z: preset.position[2],
    },
    lookAt: {
      x: preset.lookAt[0],
      y: preset.lookAt[1],
      z: preset.lookAt[2],
    },
    fov: preset.fov,
    damping: preset.damping,
  };
}

function applyZoom(base: CameraRuntimeState, percent: number): CameraRuntimeState {
  const factor = 1 - percent / 100;
  return {
    ...base,
    position: {
      x: base.lookAt.x + (base.position.x - base.lookAt.x) * factor,
      y: base.lookAt.y + (base.position.y - base.lookAt.y) * factor,
      z: base.lookAt.z + (base.position.z - base.lookAt.z) * factor,
    },
  };
}

function buildPlayerAnchoredTarget(
  basePreset: CameraRuntimeState,
  playerPosition: { x: number; y: number },
): CameraRuntimeState {
  const playerScene = toSceneCoords(playerPosition.x, playerPosition.y, 0);
  const offset = {
    x: basePreset.position.x - basePreset.lookAt.x,
    y: basePreset.position.y - basePreset.lookAt.y,
    z: basePreset.position.z - basePreset.lookAt.z,
  };

  return {
    position: {
      x: playerScene.x + offset.x,
      y: playerScene.y + offset.y,
      z: playerScene.z + offset.z,
    },
    lookAt: {
      x: playerScene.x,
      y: 0,
      z: playerScene.z,
    },
    fov: basePreset.fov,
    damping: basePreset.damping,
  };
}

export function createCameraController(config: {
  presets: {
    introStart: CameraPreset;
    introEnd: CameraPreset;
    focusCharlotte: CameraPreset;
    checkpointDefault: CameraPreset;
    finalSF: CameraPreset;
  };
}): CameraController {
  const stateToPreset: Record<WorldState, keyof typeof config.presets> = {
    intro: "introStart",
    idleMap: "introEnd",
    tutorial: "checkpointDefault",
    focusCharlotte: "checkpointDefault",
    exploring: "checkpointDefault",
    checkpointOpen: "checkpointDefault",
    transforming: "checkpointDefault",
    finalState: "finalSF",
  };

  let activeState: WorldState = "intro";
  let introElapsedMs = 0;
  let target = clonePresetToRuntime(config.presets.introStart);
  let current = clonePresetToRuntime(config.presets.introStart);
  let currentPresetKey: keyof typeof config.presets = "introStart";

  const updateTargetFromState = (state: WorldState, context: CameraContext): void => {
    const profile = CAMERA_PROFILES[state];
    const presetKey = stateToPreset[state];
    const basePreset = clonePresetToRuntime(config.presets[presetKey]);

    currentPresetKey = presetKey;

    if (state === "intro") {
      const t = Math.min(1, introElapsedMs / Math.max(1, context.intro.durationMs));
      const eased = easeInOutCubic(t);
      const start = config.presets.introStart;
      const end = config.presets.introEnd;

      target = {
        position: {
          x: lerp(start.position[0], end.position[0], eased),
          y: lerp(start.position[1], end.position[1], eased) + Math.sin(t * Math.PI) * 1.2,
          z: lerp(start.position[2], end.position[2], eased),
        },
        lookAt: {
          x: lerp(start.lookAt[0], end.lookAt[0], eased),
          y: lerp(start.lookAt[1], end.lookAt[1], eased),
          z: lerp(start.lookAt[2], end.lookAt[2], eased),
        },
        fov: lerp(start.fov, end.fov, eased),
        damping: basePreset.damping,
      };
      return;
    }

    if (state === "exploring") {
      // Stable isometric framing: no direction-based lead/rotation while exploring.
      target = buildPlayerAnchoredTarget(basePreset, context.playerPosition);
      return;
    }

    if (state === "tutorial" || state === "focusCharlotte") {
      const anchored = buildPlayerAnchoredTarget(basePreset, context.playerPosition);
      target =
        state === "tutorial"
          ? {
              ...anchored,
              // Keep the start-journey zoom-in comfortable and readable.
              damping: Math.min(anchored.damping, 0.06),
            }
          : anchored;
      return;
    }

    if (state === "checkpointOpen") {
      const focusWorld = context.checkpointNodePosition ?? context.playerPosition;
      const focus = toSceneCoords(focusWorld.x, focusWorld.y, 0);
      const offset = {
        x: basePreset.position.x - basePreset.lookAt.x,
        y: basePreset.position.y - basePreset.lookAt.y,
        z: basePreset.position.z - basePreset.lookAt.z,
      };

      target = applyZoom(
        {
          position: {
            x: focus.x + offset.x,
            y: focus.y + offset.y + 2,
            z: focus.z + offset.z,
          },
          lookAt: {
            x: focus.x,
            y: focus.y,
            z: focus.z,
          },
          fov: basePreset.fov,
          damping: basePreset.damping,
        },
        profile.zoomDeltaPercent,
      );
      return;
    }

    if (state === "transforming") {
      const playerScene = toSceneCoords(context.playerPosition.x, context.playerPosition.y, 0);
      const offset = {
        x: basePreset.position.x - basePreset.lookAt.x,
        y: basePreset.position.y - basePreset.lookAt.y,
        z: basePreset.position.z - basePreset.lookAt.z,
      };

      const zoomProgress = easeInOutCubic(Math.min(1, Math.max(0, context.transformProgress)));
      const microZoom = context.transformMicroZoomPercent * zoomProgress;

      target = applyZoom(
        {
          position: {
            x: playerScene.x + offset.x,
            y: playerScene.y + offset.y,
            z: playerScene.z + offset.z,
          },
          lookAt: {
            x: playerScene.x,
            y: playerScene.y,
            z: playerScene.z,
          },
          fov: basePreset.fov,
          damping: basePreset.damping,
        },
        microZoom,
      );
      return;
    }

    target = applyZoom(basePreset, profile.zoomDeltaPercent);
  };

  const updateCurrent = (): CameraSnapshot => {
    const damping = Math.min(1, Math.max(0.01, target.damping));
    const alpha = 1 - Math.pow(1 - damping, 1.4);

    current = {
      position: {
        x: lerp(current.position.x, target.position.x, alpha),
        y: lerp(current.position.y, target.position.y, alpha),
        z: lerp(current.position.z, target.position.z, alpha),
      },
      lookAt: {
        x: lerp(current.lookAt.x, target.lookAt.x, alpha),
        y: lerp(current.lookAt.y, target.lookAt.y, alpha),
        z: lerp(current.lookAt.z, target.lookAt.z, alpha),
      },
      fov: lerp(current.fov, target.fov, alpha),
      damping: target.damping,
    };

    return {
      ...current,
      dofBoost: CAMERA_PROFILES[activeState].dofBoost,
      presetKey: currentPresetKey,
    };
  };

  return {
    setState: (state, context, options) => {
      if (activeState !== state) {
        if (state === "intro") {
          introElapsedMs = 0;
        }
        activeState = state;
      }

      updateTargetFromState(state, context);

      if (options?.immediate) {
        current = {
          ...target,
        };
      }

      return updateCurrent();
    },
    update: (deltaMs, context) => {
      if (activeState === "intro") {
        introElapsedMs += deltaMs;
      }

      updateTargetFromState(activeState, context);
      return updateCurrent();
    },
    skipIntroSettle: () => {
      const end = clonePresetToRuntime(config.presets.introEnd);
      activeState = "idleMap";
      introElapsedMs = 0;
      currentPresetKey = "introEnd";
      target = end;
      current = end;
      return {
        ...current,
        dofBoost: CAMERA_PROFILES.idleMap.dofBoost,
        presetKey: "introEnd",
      };
    },
    getCurrent: () => ({
      ...current,
      dofBoost: CAMERA_PROFILES[activeState].dofBoost,
      presetKey: currentPresetKey,
    }),
  };
}
