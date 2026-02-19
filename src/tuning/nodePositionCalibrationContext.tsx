import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  buildCoordsPayload,
  clampToMapBounds,
  deriveMapWorldBounds,
  roundCoord,
  type MapWorldBounds,
  type WorldCoords,
} from "./nodePositionCalibration";
import { isCalibrationFeatureEnabled } from "./calibrationFlags";
import type { NodeId, WorldConfig } from "../types/world";

interface NodePositionCalibrationContextValue {
  candidateCoords: WorldCoords;
  seedNodeId: NodeId;
  setSeedNodeId: (nodeId: NodeId) => void;
  setCandidateCoords: (coords: WorldCoords) => void;
  seedFromNode: (nodeId: NodeId) => void;
  nudge: (dx: number, dy: number) => void;
  isDragging: boolean;
  setDragging: (dragging: boolean) => void;
  lastCopied: string | null;
  copyCoordsJson: () => Promise<string>;
  mapBounds: MapWorldBounds;
  setMapBounds: (bounds: MapWorldBounds) => void;
}

const NodePositionCalibrationContext = createContext<NodePositionCalibrationContextValue | null>(null);

function toRoundedCoords(coords: WorldCoords): WorldCoords {
  return {
    x: roundCoord(coords.x),
    y: roundCoord(coords.y),
  };
}

function clampAndRoundCoords(coords: WorldCoords, bounds: MapWorldBounds): WorldCoords {
  return toRoundedCoords(clampToMapBounds(coords, bounds));
}

function resolveStartNode(worldConfig: WorldConfig): WorldConfig["nodes"][number] | undefined {
  return worldConfig.nodes.find((node) => node.id === worldConfig.progression.startNodeId) ?? worldConfig.nodes[0];
}

export function NodePositionCalibrationProvider({
  children,
  worldConfig,
}: {
  children: ReactNode;
  worldConfig: WorldConfig;
}): React.JSX.Element {
  const startNode = resolveStartNode(worldConfig);
  const startCoords = startNode ? toRoundedCoords(startNode.coords) : { x: 0, y: 0 };
  const [mapBounds, setMapBoundsState] = useState<MapWorldBounds>(() => deriveMapWorldBounds());
  const [candidateCoords, setCandidateCoordsState] = useState<WorldCoords>(() =>
    clampAndRoundCoords(startCoords, mapBounds),
  );
  const [seedNodeId, setSeedNodeId] = useState<NodeId>(startNode?.id ?? "");
  const [isDragging, setDragging] = useState(false);
  const [lastCopied, setLastCopied] = useState<string | null>(null);

  const calibrationFeatureEnabled = isCalibrationFeatureEnabled();

  const setCandidateCoords = useCallback(
    (coords: WorldCoords) => {
      setCandidateCoordsState(clampAndRoundCoords(coords, mapBounds));
    },
    [mapBounds],
  );

  const setMapBounds = useCallback((bounds: MapWorldBounds) => {
    setMapBoundsState(bounds);
    setCandidateCoordsState((current) => clampAndRoundCoords(current, bounds));
  }, []);

  const seedFromNode = useCallback(
    (nodeId: NodeId) => {
      const node = worldConfig.nodes.find((candidate) => candidate.id === nodeId);
      if (!node) {
        return;
      }

      setSeedNodeId(nodeId);
      setCandidateCoordsState(clampAndRoundCoords(node.coords, mapBounds));
    },
    [mapBounds, worldConfig.nodes],
  );

  const nudge = useCallback(
    (dx: number, dy: number) => {
      setCandidateCoordsState((current) =>
        clampAndRoundCoords(
          {
            x: current.x + dx,
            y: current.y + dy,
          },
          mapBounds,
        ),
      );
    },
    [mapBounds],
  );

  const copyCoordsJson = useCallback(async (): Promise<string> => {
    const payload = buildCoordsPayload(candidateCoords);
    console.info("[Node Position Calibration] Paste into nodes[*].coords:\n", payload);
    let nextStatus = "Copied coords JSON to console";

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(payload);
        nextStatus = "Copied coords JSON to clipboard + console";
      } catch {
        // console output is already available
      }
    }

    setLastCopied(nextStatus);
    return payload;
  }, [candidateCoords]);

  const contextValue = useMemo<NodePositionCalibrationContextValue>(
    () => ({
      candidateCoords,
      seedNodeId,
      setSeedNodeId,
      setCandidateCoords,
      seedFromNode,
      nudge,
      isDragging,
      setDragging,
      lastCopied,
      copyCoordsJson,
      mapBounds,
      setMapBounds,
    }),
    [
      candidateCoords,
      copyCoordsJson,
      isDragging,
      lastCopied,
      mapBounds,
      nudge,
      seedFromNode,
      seedNodeId,
      setCandidateCoords,
      setMapBounds,
    ],
  );

  if (!calibrationFeatureEnabled) {
    return <>{children}</>;
  }

  return (
    <NodePositionCalibrationContext.Provider value={contextValue}>{children}</NodePositionCalibrationContext.Provider>
  );
}

export function useNodePositionCalibration(): NodePositionCalibrationContextValue {
  const context = useContext(NodePositionCalibrationContext);
  if (!context) {
    throw new Error("useNodePositionCalibration must be used within NodePositionCalibrationProvider");
  }
  return context;
}
