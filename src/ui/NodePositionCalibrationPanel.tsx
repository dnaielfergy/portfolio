import { useMemo } from "react";

import { useWorldStoreContext } from "../state/worldStore";
import { isCalibrationFeatureEnabled } from "../tuning/calibrationFlags";
import { useNodePositionCalibration } from "../tuning/nodePositionCalibrationContext";
import { worldToScene } from "../tuning/nodePositionCalibration";

function formatValue(value: number, digits = 4): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "--";
}

export function NodePositionCalibrationPanel(): React.JSX.Element | null {
  if (!isCalibrationFeatureEnabled()) {
    return null;
  }

  return <NodePositionCalibrationPanelInner />;
}

function NodePositionCalibrationPanelInner(): React.JSX.Element {
  const { world } = useWorldStoreContext();
  const {
    candidateCoords,
    seedNodeId,
    setSeedNodeId,
    setCandidateCoords,
    seedFromNode,
    nudge,
    isDragging,
    lastCopied,
    copyCoordsJson,
    mapBounds,
  } = useNodePositionCalibration();

  const sceneCoords = useMemo(
    () => worldToScene(candidateCoords.x, candidateCoords.y, 0.35),
    [candidateCoords.x, candidateCoords.y],
  );

  return (
    <aside className="node-calibration-panel" data-testid="node-calibration-panel">
      <div className="node-calibration-header">
        <strong>Node Position Calibration</strong>
      </div>

      <p className="node-calibration-note">
        Testing marker only. This does not change real node coords until you paste copied values into schema.
      </p>

      <label className="node-calibration-field">
        <span>Seed from existing node</span>
        <div className="node-calibration-field-row">
          <select value={seedNodeId} onChange={(event) => setSeedNodeId(event.target.value)}>
            {world.config.nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => seedFromNode(seedNodeId)}>
            Load Node Coords
          </button>
        </div>
      </label>

      <div className="node-calibration-controls">
        <label className="node-calibration-field">
          <span>World X</span>
          <input
            type="number"
            step={0.01}
            value={candidateCoords.x}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              if (!Number.isFinite(nextValue)) {
                return;
              }
              setCandidateCoords({
                x: nextValue,
                y: candidateCoords.y,
              });
            }}
          />
        </label>

        <label className="node-calibration-field">
          <span>World Y</span>
          <input
            type="number"
            step={0.01}
            value={candidateCoords.y}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              if (!Number.isFinite(nextValue)) {
                return;
              }
              setCandidateCoords({
                x: candidateCoords.x,
                y: nextValue,
              });
            }}
          />
        </label>
      </div>

      <div className="node-calibration-nudges">
        <button type="button" onClick={() => nudge(-0.1, 0)}>
          X -0.1
        </button>
        <button type="button" onClick={() => nudge(-0.01, 0)}>
          X -0.01
        </button>
        <button type="button" onClick={() => nudge(0.01, 0)}>
          X +0.01
        </button>
        <button type="button" onClick={() => nudge(0.1, 0)}>
          X +0.1
        </button>
        <button type="button" onClick={() => nudge(0, -0.1)}>
          Y -0.1
        </button>
        <button type="button" onClick={() => nudge(0, -0.01)}>
          Y -0.01
        </button>
        <button type="button" onClick={() => nudge(0, 0.01)}>
          Y +0.01
        </button>
        <button type="button" onClick={() => nudge(0, 0.1)}>
          Y +0.1
        </button>
      </div>

      <div className="node-calibration-info">
        <span>
          Scene: ({formatValue(sceneCoords.x, 3)}, {formatValue(sceneCoords.y, 3)}, {formatValue(sceneCoords.z, 3)})
        </span>
        <span>
          Bounds X: [{formatValue(mapBounds.minX, 2)}, {formatValue(mapBounds.maxX, 2)}]
        </span>
        <span>
          Bounds Y: [{formatValue(mapBounds.minY, 2)}, {formatValue(mapBounds.maxY, 2)}]
        </span>
        <span>Drag State: {isDragging ? "Dragging" : "Idle"}</span>
      </div>

      <div className="node-calibration-actions">
        <button type="button" onClick={() => void copyCoordsJson()}>
          Copy Coords JSON
        </button>
      </div>

      {lastCopied ? <div className="node-calibration-copy-status">{lastCopied}</div> : null}
    </aside>
  );
}
