import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_CAMERA_CALIBRATION_CANDIDATE,
  buildCalibrationJsonPayload,
  type CalibrationProfile,
  type CameraCalibrationCandidate,
  type CameraCalibrationMetrics,
} from "./cameraCalibration";
import { isCalibrationFeatureEnabled } from "./calibrationFlags";
import type { WorldConfig } from "../types/world";

interface CameraCalibrationContextValue {
  profile: CalibrationProfile;
  setProfile: (profile: CalibrationProfile) => void;
  candidate: CameraCalibrationCandidate;
  setCandidateValue: <K extends keyof CameraCalibrationCandidate>(
    key: K,
    value: CameraCalibrationCandidate[K],
  ) => void;
  resetCandidate: () => void;
  metrics: CameraCalibrationMetrics;
  setMetrics: (metrics: CameraCalibrationMetrics) => void;
  lockedWorldVisualMultiplier: number;
  lockedVehicleVisualMultiplier: number;
  worldVisualOverrideMultiplier: number;
  vehicleVisualOverrideMultiplier: number;
  activeWorldVisualMultiplier: number;
  activeVehicleVisualMultiplier: number;
  isCandidateActive: boolean;
  copyCalibrationJson: () => string;
}

const DEFAULT_METRICS: CameraCalibrationMetrics = {
  vehicleViewportHeightPercent: 0,
  nodeClusterWidthPercent: 0,
  roadToVehicleWidthRatio: 0,
};

const CameraCalibrationContext = createContext<CameraCalibrationContextValue | null>(null);

function sanitizeMultiplier(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  return value;
}

export function CameraCalibrationProvider({
  children,
  worldConfig,
}: {
  children: ReactNode;
  worldConfig: WorldConfig;
}): React.JSX.Element {
  const [profile, setProfile] = useState<CalibrationProfile>("current");
  const [candidate, setCandidate] = useState<CameraCalibrationCandidate>(DEFAULT_CAMERA_CALIBRATION_CANDIDATE);
  const [metrics, setMetrics] = useState<CameraCalibrationMetrics>(DEFAULT_METRICS);

  const calibrationFeatureEnabled = isCalibrationFeatureEnabled();
  const lockedWorldVisualMultiplier = sanitizeMultiplier(worldConfig.style.scale?.worldVisualMultiplier ?? 1);
  const lockedVehicleVisualMultiplier = sanitizeMultiplier(worldConfig.style.scale?.vehicleVisualMultiplier ?? 1);
  const isCandidateActive = calibrationFeatureEnabled && profile === "candidate";
  const worldVisualOverrideMultiplier = isCandidateActive
    ? sanitizeMultiplier(candidate.worldVisualMultiplier / lockedWorldVisualMultiplier)
    : 1;
  const vehicleVisualOverrideMultiplier = isCandidateActive
    ? sanitizeMultiplier(candidate.vehicleVisualMultiplier / lockedVehicleVisualMultiplier)
    : 1;
  const activeWorldVisualMultiplier = lockedWorldVisualMultiplier * worldVisualOverrideMultiplier;
  const activeVehicleVisualMultiplier = lockedVehicleVisualMultiplier * vehicleVisualOverrideMultiplier;

  const setCandidateValue = useCallback(
    <K extends keyof CameraCalibrationCandidate>(key: K, value: CameraCalibrationCandidate[K]) => {
      setCandidate((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const resetCandidate = useCallback(() => {
    setCandidate(DEFAULT_CAMERA_CALIBRATION_CANDIDATE);
  }, []);

  const copyCalibrationJson = useCallback((): string => {
    const payload = buildCalibrationJsonPayload({
      basePresets: worldConfig.cameraPresets,
      calibration: candidate,
    });
    const serialized = JSON.stringify(payload, null, 2);
    console.info("[Calibration] Paste into world_schema_example.json:\n", serialized);
    return serialized;
  }, [candidate, worldConfig.cameraPresets]);

  const contextValue = useMemo<CameraCalibrationContextValue>(
    () => ({
      profile,
      setProfile,
      candidate,
      setCandidateValue,
      resetCandidate,
      metrics,
      setMetrics,
      lockedWorldVisualMultiplier,
      lockedVehicleVisualMultiplier,
      worldVisualOverrideMultiplier,
      vehicleVisualOverrideMultiplier,
      activeWorldVisualMultiplier,
      activeVehicleVisualMultiplier,
      isCandidateActive,
      copyCalibrationJson,
    }),
    [
      activeVehicleVisualMultiplier,
      activeWorldVisualMultiplier,
      candidate,
      copyCalibrationJson,
      isCandidateActive,
      lockedVehicleVisualMultiplier,
      lockedWorldVisualMultiplier,
      metrics,
      profile,
      resetCandidate,
      setCandidateValue,
      vehicleVisualOverrideMultiplier,
      worldVisualOverrideMultiplier,
    ],
  );

  return <CameraCalibrationContext.Provider value={contextValue}>{children}</CameraCalibrationContext.Provider>;
}

export function useCameraCalibration(): CameraCalibrationContextValue {
  const context = useContext(CameraCalibrationContext);
  if (!context) {
    throw new Error("useCameraCalibration must be used within CameraCalibrationProvider");
  }
  return context;
}
