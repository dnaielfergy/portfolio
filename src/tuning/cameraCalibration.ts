import type { CameraPreset, CameraPresetMap } from "../types/world";

export type CalibrationProjection = "perspective";
export type CalibrationProfile = "current" | "candidate";

export interface CameraCalibrationCandidate {
  pitchDeg: number;
  yawDeg: number;
  distance: number;
  heightOffset: number;
  fov: number;
  followLeadDistance: number;
  worldVisualMultiplier: number;
  vehicleVisualMultiplier: number;
  projection: CalibrationProjection;
}

export interface CameraCalibrationMetrics {
  vehicleViewportHeightPercent: number;
  nodeClusterWidthPercent: number;
  roadToVehicleWidthRatio: number;
}

export const DEFAULT_CAMERA_CALIBRATION_CANDIDATE: CameraCalibrationCandidate = {
  pitchDeg: 38,
  yawDeg: -14,
  distance: 118,
  heightOffset: 6,
  fov: 39,
  followLeadDistance: 1.2,
  worldVisualMultiplier: 1.1,
  vehicleVisualMultiplier: 1.12,
  projection: "perspective",
};

function round(value: number, precision = 3): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toCameraOffset(params: {
  pitchDeg: number;
  yawDeg: number;
  distance: number;
  heightOffset: number;
}): { x: number; y: number; z: number } {
  const pitchRad = toRadians(params.pitchDeg);
  const yawRad = toRadians(params.yawDeg);
  const horizontalDistance = Math.cos(pitchRad) * params.distance;

  return {
    x: Math.sin(yawRad) * horizontalDistance,
    y: Math.sin(pitchRad) * params.distance + params.heightOffset,
    z: Math.cos(yawRad) * horizontalDistance,
  };
}

export function derivePitchYawDistanceFromPreset(preset: CameraPreset): {
  pitchDeg: number;
  yawDeg: number;
  distance: number;
  heightOffset: number;
} {
  const offsetX = preset.position[0] - preset.lookAt[0];
  const offsetY = preset.position[1] - preset.lookAt[1];
  const offsetZ = preset.position[2] - preset.lookAt[2];
  const horizontalDistance = Math.hypot(offsetX, offsetZ);
  const distance = Math.hypot(horizontalDistance, offsetY);
  const pitchDeg = distance > 0 ? (Math.atan2(offsetY, horizontalDistance) * 180) / Math.PI : 0;
  const yawDeg = (Math.atan2(offsetX, offsetZ) * 180) / Math.PI;
  const heightOffset = offsetY - Math.sin(toRadians(pitchDeg)) * distance;

  return {
    pitchDeg: round(pitchDeg, 3),
    yawDeg: round(yawDeg, 3),
    distance: round(distance, 3),
    heightOffset: round(heightOffset, 3),
  };
}

function applyCalibrationToPreset(params: {
  basePreset: CameraPreset;
  calibration: CameraCalibrationCandidate;
  distanceMultiplier?: number;
  fovDelta?: number;
  heightOffsetDelta?: number;
}): CameraPreset {
  const {
    basePreset,
    calibration,
    distanceMultiplier = 1,
    fovDelta = 0,
    heightOffsetDelta = 0,
  } = params;
  const offset = toCameraOffset({
    pitchDeg: calibration.pitchDeg,
    yawDeg: calibration.yawDeg,
    distance: calibration.distance * distanceMultiplier,
    heightOffset: calibration.heightOffset + heightOffsetDelta,
  });

  return {
    position: [
      round(basePreset.lookAt[0] + offset.x),
      round(basePreset.lookAt[1] + offset.y),
      round(basePreset.lookAt[2] + offset.z),
    ],
    lookAt: [...basePreset.lookAt] as [number, number, number],
    fov: round(calibration.fov + fovDelta, 2),
    damping: basePreset.damping,
  };
}

export function buildPresetSetFromCalibration(
  basePresets: CameraPresetMap,
  calibration: CameraCalibrationCandidate,
): CameraPresetMap {
  return {
    introStart: applyCalibrationToPreset({
      basePreset: basePresets.introStart,
      calibration,
      distanceMultiplier: 1.2,
      fovDelta: 1,
      heightOffsetDelta: 8,
    }),
    introEnd: applyCalibrationToPreset({
      basePreset: basePresets.introEnd,
      calibration,
      distanceMultiplier: 1.35,
      fovDelta: 1,
      heightOffsetDelta: 14,
    }),
    focusCharlotte: applyCalibrationToPreset({
      basePreset: basePresets.focusCharlotte,
      calibration,
      distanceMultiplier: 0.95,
      heightOffsetDelta: 2,
    }),
    checkpointDefault: applyCalibrationToPreset({
      basePreset: basePresets.checkpointDefault,
      calibration,
    }),
    finalSF: applyCalibrationToPreset({
      basePreset: basePresets.finalSF,
      calibration,
      distanceMultiplier: 0.92,
      fovDelta: -1,
      heightOffsetDelta: 1,
    }),
  };
}

export function buildCalibrationJsonPayload(params: {
  basePresets: CameraPresetMap;
  calibration: CameraCalibrationCandidate;
}): {
  cameraPresets: CameraPresetMap;
  style: {
    scale: {
      worldVisualMultiplier: number;
      vehicleVisualMultiplier: number;
    };
  };
} {
  const { basePresets, calibration } = params;

  return {
    cameraPresets: buildPresetSetFromCalibration(basePresets, calibration),
    style: {
      scale: {
        worldVisualMultiplier: round(calibration.worldVisualMultiplier, 3),
        vehicleVisualMultiplier: round(calibration.vehicleVisualMultiplier, 3),
      },
    },
  };
}
