import { describe, expect, it } from "vitest";

import {
  DEFAULT_CAMERA_CALIBRATION_CANDIDATE,
  buildCalibrationJsonPayload,
  buildPresetSetFromCalibration,
  derivePitchYawDistanceFromPreset,
  toCameraOffset,
} from "../../tuning/cameraCalibration";
import type { CameraPresetMap } from "../../types/world";

const BASE_PRESETS: CameraPresetMap = {
  introStart: {
    position: [-80, 80, 120],
    lookAt: [-50, 0, 0],
    fov: 42,
    damping: 0.08,
  },
  introEnd: {
    position: [0, 130, 220],
    lookAt: [0, 0, 0],
    fov: 42,
    damping: 0.08,
  },
  focusCharlotte: {
    position: [35, 35, 45],
    lookAt: [28, -5, 0],
    fov: 42,
    damping: 0.1,
  },
  checkpointDefault: {
    position: [0, 80, 84],
    lookAt: [0, 0, 0],
    fov: 42,
    damping: 0.12,
  },
  finalSF: {
    position: [-30, 38, 52],
    lookAt: [-28, 5, 0],
    fov: 40,
    damping: 0.08,
  },
};

describe("cameraCalibration", () => {
  it("converts pitch/yaw/distance into deterministic camera offsets", () => {
    const offset = toCameraOffset({
      pitchDeg: 38,
      yawDeg: -14,
      distance: 118,
      heightOffset: 6,
    });

    expect(offset.x).toBeCloseTo(-22.495, 3);
    expect(offset.y).toBeCloseTo(78.648, 3);
    expect(offset.z).toBeCloseTo(90.223, 3);
  });

  it("derives orientation values from an existing preset", () => {
    const derived = derivePitchYawDistanceFromPreset(BASE_PRESETS.checkpointDefault);

    expect(derived.pitchDeg).toBeGreaterThan(40);
    expect(derived.yawDeg).toBeCloseTo(0, 3);
    expect(derived.distance).toBeGreaterThan(110);
    expect(derived.heightOffset).toBeCloseTo(0, 3);
  });

  it("builds a full deterministic preset set from calibration candidate", () => {
    const presets = buildPresetSetFromCalibration(BASE_PRESETS, DEFAULT_CAMERA_CALIBRATION_CANDIDATE);

    expect(presets.checkpointDefault.position).toEqual([-22.495, 78.648, 90.223]);
    expect(presets.focusCharlotte.fov).toBe(39);
    expect(presets.finalSF.fov).toBe(38);
  });

  it("builds export payload with camera presets and scale multipliers", () => {
    const payload = buildCalibrationJsonPayload({
      basePresets: BASE_PRESETS,
      calibration: DEFAULT_CAMERA_CALIBRATION_CANDIDATE,
    });

    expect(payload.style.scale.worldVisualMultiplier).toBe(1.1);
    expect(payload.style.scale.vehicleVisualMultiplier).toBe(1.12);
    expect(payload.cameraPresets.focusCharlotte).toBeDefined();
    expect(payload.cameraPresets.checkpointDefault.lookAt).toEqual(BASE_PRESETS.checkpointDefault.lookAt);
  });
});
