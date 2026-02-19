import { useMemo, useState } from "react";

import { useCameraCalibration } from "../tuning/cameraCalibrationContext";
import { isCalibrationFeatureEnabled } from "../tuning/calibrationFlags";
import type { CalibrationProfile, CameraCalibrationCandidate } from "../tuning/cameraCalibration";

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: SliderControlProps): React.JSX.Element {
  return (
    <label className="camera-calibration-control">
      <span>{label}</span>
      <div className="camera-calibration-control-row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </label>
  );
}

function formatMetric(value: number, digits = 2): string {
  if (!Number.isFinite(value)) {
    return "--";
  }
  return value.toFixed(digits);
}

export function CameraScaleCalibrationPanel(): React.JSX.Element | null {
  const [lastCopied, setLastCopied] = useState<string | null>(null);
  const {
    profile,
    setProfile,
    candidate,
    setCandidateValue,
    resetCandidate,
    metrics,
    copyCalibrationJson,
    lockedWorldVisualMultiplier,
    lockedVehicleVisualMultiplier,
    activeWorldVisualMultiplier,
    activeVehicleVisualMultiplier,
    isCandidateActive,
  } = useCameraCalibration();

  if (!isCalibrationFeatureEnabled()) {
    return null;
  }

  const controls = useMemo(
    () =>
      [
        { key: "pitchDeg", label: "Pitch (deg)", min: 20, max: 60, step: 0.1 },
        { key: "yawDeg", label: "Yaw (deg)", min: -45, max: 30, step: 0.1 },
        { key: "distance", label: "Distance", min: 40, max: 260, step: 0.5 },
        { key: "heightOffset", label: "Height Offset", min: -20, max: 40, step: 0.25 },
        { key: "fov", label: "FOV", min: 24, max: 70, step: 0.1 },
        { key: "followLeadDistance", label: "Follow Lead", min: 0, max: 6, step: 0.05 },
        { key: "worldVisualMultiplier", label: "World Scale", min: 0.5, max: 2.5, step: 0.01 },
        { key: "vehicleVisualMultiplier", label: "Vehicle Scale", min: 0.5, max: 2.5, step: 0.01 },
      ] as const,
    [],
  );

  return (
    <aside className="camera-calibration-panel" data-testid="camera-calibration-panel">
      <div className="camera-calibration-header">
        <strong>Camera & Scale Calibration</strong>
        <div className="camera-calibration-toggle">
          {(["current", "candidate"] as CalibrationProfile[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={profile === mode ? "is-active" : ""}
              onClick={() => setProfile(mode)}
            >
              {mode === "current" ? "Current" : "Overcooked Candidate"}
            </button>
          ))}
        </div>
      </div>

      <div className="camera-calibration-info">
        <span>Locked World Scale: {formatMetric(lockedWorldVisualMultiplier, 3)}</span>
        <span>Locked Vehicle Scale: {formatMetric(lockedVehicleVisualMultiplier, 3)}</span>
        <span>Active World Scale: {formatMetric(activeWorldVisualMultiplier, 3)}</span>
        <span>Active Vehicle Scale: {formatMetric(activeVehicleVisualMultiplier, 3)}</span>
      </div>

      <div className="camera-calibration-controls">
        {controls.map((control) => (
          <SliderControl
            key={control.key}
            label={control.label}
            value={candidate[control.key]}
            min={control.min}
            max={control.max}
            step={control.step}
            disabled={!isCandidateActive}
            onChange={(value) => setCandidateValue(control.key as keyof CameraCalibrationCandidate, value)}
          />
        ))}
      </div>

      <div className="camera-calibration-metrics">
        <span>Vehicle viewport height: {formatMetric(metrics.vehicleViewportHeightPercent)}%</span>
        <span>Node cluster width: {formatMetric(metrics.nodeClusterWidthPercent)}%</span>
        <span>Road/vehicle width ratio: {formatMetric(metrics.roadToVehicleWidthRatio, 3)}</span>
      </div>

      <div className="camera-calibration-actions">
        <button type="button" onClick={resetCandidate} disabled={!isCandidateActive}>
          Reset Candidate
        </button>
        <button
          type="button"
          onClick={async () => {
            const payload = copyCalibrationJson();
            setLastCopied("Copied JSON to console");
            if (navigator.clipboard?.writeText) {
              try {
                await navigator.clipboard.writeText(payload);
                setLastCopied("Copied JSON to clipboard + console");
              } catch {
                // console copy is already guaranteed
              }
            }
          }}
        >
          Copy JSON
        </button>
      </div>

      {lastCopied ? <div className="camera-calibration-copy-status">{lastCopied}</div> : null}
    </aside>
  );
}
