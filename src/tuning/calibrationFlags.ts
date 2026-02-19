function normalizeFlag(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function isCalibrationFeatureEnabled(): boolean {
  if (!import.meta.env.DEV) {
    return false;
  }

  const value = normalizeFlag(import.meta.env.VITE_ENABLE_CAMERA_CALIBRATION);
  return value !== "false" && value !== "0" && value !== "off";
}

