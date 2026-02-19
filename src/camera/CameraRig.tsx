import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { PerspectiveCamera } from "three";

import { createCameraController } from "./cameraController";
import { SCENE_SCALE, toSceneCoords } from "../data/loadWorldConfig";
import { resolveActivePlayerRadius } from "../physics/vehicleCollider";
import { useWorldStoreContext } from "../state/worldStore";
import { toCameraOffset, type CameraCalibrationMetrics } from "../tuning/cameraCalibration";
import { useCameraCalibration } from "../tuning/cameraCalibrationContext";
import type { NodeId, SceneCoords, WorldState } from "../types/world";

const GAMEPLAY_STATES: ReadonlySet<WorldState> = new Set([
  "tutorial",
  "focusCharlotte",
  "exploring",
  "checkpointOpen",
  "transforming",
  "finalState",
]);

function isGameplayState(state: WorldState): boolean {
  return GAMEPLAY_STATES.has(state);
}

function toScreenPoint(
  point: THREE.Vector3,
  camera: THREE.Camera,
  viewport: { width: number; height: number },
): { x: number; y: number } {
  const projected = point.clone().project(camera);
  return {
    x: ((projected.x + 1) / 2) * viewport.width,
    y: ((1 - projected.y) / 2) * viewport.height,
  };
}

function transformForVisualScale(
  point: SceneCoords,
  anchor: SceneCoords,
  multiplier: number,
  out: THREE.Vector3,
): THREE.Vector3 {
  out.set(
    anchor.x + (point.x - anchor.x) * multiplier,
    anchor.y + (point.y - anchor.y) * multiplier,
    anchor.z + (point.z - anchor.z) * multiplier,
  );
  return out;
}

function resolveNextMainNodeId(params: {
  mainSequence: NodeId[];
  activeNodeId: NodeId;
  completedNodeIds: Set<NodeId>;
}): NodeId {
  const { mainSequence, activeNodeId, completedNodeIds } = params;
  const activeIndex = mainSequence.indexOf(activeNodeId);
  if (activeIndex >= 0 && activeIndex < mainSequence.length - 1) {
    const next = mainSequence[activeIndex + 1];
    if (next) {
      return next;
    }
  }

  const firstIncomplete = mainSequence.find((nodeId) => !completedNodeIds.has(nodeId));
  return firstIncomplete ?? activeNodeId;
}

function computeMetrics(params: {
  camera: THREE.Camera;
  viewport: { width: number; height: number };
  scaleAnchorScene: SceneCoords;
  playerScene: SceneCoords;
  activeNodeScene?: SceneCoords;
  nextNodeScene?: SceneCoords;
  worldVisualMultiplier: number;
  vehicleVisualMultiplier: number;
  vehicleSceneRadius: number;
  pathThickness: number;
}): CameraCalibrationMetrics {
  const {
    camera,
    viewport,
    scaleAnchorScene,
    playerScene,
    activeNodeScene,
    nextNodeScene,
    worldVisualMultiplier,
    vehicleVisualMultiplier,
    vehicleSceneRadius,
    pathThickness,
  } = params;
  const anchor = scaleAnchorScene;
  const top = new THREE.Vector3();
  const bottom = new THREE.Vector3();

  const approximateVehicleHeight = Math.max(1.1, vehicleSceneRadius * 3.1) * vehicleVisualMultiplier;
  transformForVisualScale(
    { x: playerScene.x, y: playerScene.y + approximateVehicleHeight, z: playerScene.z },
    anchor,
    worldVisualMultiplier,
    top,
  );
  transformForVisualScale(
    { x: playerScene.x, y: playerScene.y, z: playerScene.z },
    anchor,
    worldVisualMultiplier,
    bottom,
  );
  const topPx = toScreenPoint(top, camera, viewport);
  const bottomPx = toScreenPoint(bottom, camera, viewport);
  const vehicleViewportHeightPercent = Math.abs(topPx.y - bottomPx.y) / viewport.height * 100;

  const nodeBaseRadius = 0.85;
  const aCenter = new THREE.Vector3();
  const bCenter = new THREE.Vector3();
  const aRight = new THREE.Vector3();
  const bRight = new THREE.Vector3();
  let nodeClusterWidthPercent = 0;
  if (activeNodeScene) {
    transformForVisualScale(activeNodeScene, anchor, worldVisualMultiplier, aCenter);
    transformForVisualScale(
      { x: activeNodeScene.x + nodeBaseRadius, y: activeNodeScene.y, z: activeNodeScene.z },
      anchor,
      worldVisualMultiplier,
      aRight,
    );

    const aCenterPx = toScreenPoint(aCenter, camera, viewport);
    const aRightPx = toScreenPoint(aRight, camera, viewport);
    const aRadiusPx = Math.abs(aRightPx.x - aCenterPx.x);

    if (nextNodeScene) {
      transformForVisualScale(nextNodeScene, anchor, worldVisualMultiplier, bCenter);
      transformForVisualScale(
        { x: nextNodeScene.x + nodeBaseRadius, y: nextNodeScene.y, z: nextNodeScene.z },
        anchor,
        worldVisualMultiplier,
        bRight,
      );

      const bCenterPx = toScreenPoint(bCenter, camera, viewport);
      const bRightPx = toScreenPoint(bRight, camera, viewport);
      const bRadiusPx = Math.abs(bRightPx.x - bCenterPx.x);
      const clusterMinX = Math.min(aCenterPx.x - aRadiusPx, bCenterPx.x - bRadiusPx);
      const clusterMaxX = Math.max(aCenterPx.x + aRadiusPx, bCenterPx.x + bRadiusPx);
      nodeClusterWidthPercent = Math.abs(clusterMaxX - clusterMinX) / viewport.width * 100;
    } else {
      nodeClusterWidthPercent = (aRadiusPx * 2) / viewport.width * 100;
    }
  }

  const vehicleHalfWidth = Math.max(0.35, vehicleSceneRadius * 1.9) * vehicleVisualMultiplier;
  const left = new THREE.Vector3();
  const right = new THREE.Vector3();
  transformForVisualScale(
    { x: playerScene.x - vehicleHalfWidth, y: playerScene.y, z: playerScene.z },
    anchor,
    worldVisualMultiplier,
    left,
  );
  transformForVisualScale(
    { x: playerScene.x + vehicleHalfWidth, y: playerScene.y, z: playerScene.z },
    anchor,
    worldVisualMultiplier,
    right,
  );
  const leftPx = toScreenPoint(left, camera, viewport);
  const rightPx = toScreenPoint(right, camera, viewport);
  const vehicleWidthPx = Math.max(1, Math.abs(rightPx.x - leftPx.x));
  const roadWidthPx = 10.2 * Math.max(0.5, pathThickness);
  const roadToVehicleWidthRatio = roadWidthPx / vehicleWidthPx;

  return {
    vehicleViewportHeightPercent,
    nodeClusterWidthPercent,
    roadToVehicleWidthRatio,
  };
}

export function CameraRig(): null {
  const { world, state } = useWorldStoreContext();
  const calibration = useCameraCalibration();
  const { camera, size } = useThree();
  const controller = useMemo(
    () =>
      createCameraController({
        presets: world.config.cameraPresets,
      }),
    [world.config.cameraPresets],
  );
  const initializedRef = useRef(false);
  const previousStateRef = useRef(state.worldState);
  const metricsElapsedRef = useRef(0);
  const metricsRef = useRef<CameraCalibrationMetrics>(calibration.metrics);

  useFrame((_, delta) => {
    const checkpointNode = state.checkpointNodeId ? world.nodesById[state.checkpointNodeId] : undefined;
    const context = {
      state: state.worldState,
      playerPosition: state.player.position,
      playerVelocity: state.player.velocity,
      intro: world.config.intro,
      checkpointNodePosition: checkpointNode?.coords,
      transformProgress: state.transform.progress,
      transformMicroZoomPercent: world.config.vehicles.transformRules.cameraMicroZoomPercent,
      followLeadDistanceOverride: calibration.isCandidateActive
        ? calibration.candidate.followLeadDistance
        : undefined,
    };

    if (!initializedRef.current) {
      controller.setState(state.worldState, context, { immediate: true });
      initializedRef.current = true;
      previousStateRef.current = state.worldState;
    } else if (previousStateRef.current !== state.worldState) {
      controller.setState(state.worldState, context);
      previousStateRef.current = state.worldState;
    }

    const snapshot = controller.update(delta * 1000, context);

    let finalPosition = snapshot.position;
    const finalLookAt = snapshot.lookAt;
    let finalFov = snapshot.fov;

    if (calibration.isCandidateActive && isGameplayState(state.worldState)) {
      const offset = toCameraOffset({
        pitchDeg: calibration.candidate.pitchDeg,
        yawDeg: calibration.candidate.yawDeg,
        distance: calibration.candidate.distance,
        heightOffset: calibration.candidate.heightOffset,
      });
      finalPosition = {
        x: finalLookAt.x + offset.x,
        y: finalLookAt.y + offset.y,
        z: finalLookAt.z + offset.z,
      };
      finalFov = calibration.candidate.fov;
    }

    camera.position.set(finalPosition.x, finalPosition.y, finalPosition.z);
    camera.lookAt(finalLookAt.x, finalLookAt.y, finalLookAt.z);
    if ("fov" in camera) {
      (camera as PerspectiveCamera).fov = finalFov;
      (camera as PerspectiveCamera).updateProjectionMatrix();
    } else {
      camera.updateProjectionMatrix();
    }

    metricsElapsedRef.current += delta;
    if (metricsElapsedRef.current >= 0.12) {
      metricsElapsedRef.current = 0;

      const playerScene = toSceneCoords(state.player.position.x, state.player.position.y, 0);
      const scaleAnchorScene =
        state.worldState === "checkpointOpen" && checkpointNode
          ? toSceneCoords(checkpointNode.coords.x, checkpointNode.coords.y, 0)
          : playerScene;
      const activeNode = world.nodesById[state.activeNodeId];
      const nextNodeId = resolveNextMainNodeId({
        mainSequence: world.config.progression.mainSequence,
        activeNodeId: state.activeNodeId,
        completedNodeIds: state.progression.completedNodeIds,
      });
      const nextNode = world.nodesById[nextNodeId];
      const activeNodeScene = activeNode ? toSceneCoords(activeNode.coords.x, activeNode.coords.y, 0.05) : undefined;
      const nextNodeScene = nextNode ? toSceneCoords(nextNode.coords.x, nextNode.coords.y, 0.05) : undefined;
      const vehicleSceneRadius =
        resolveActivePlayerRadius({
          worldConfig: world.config,
          activeVehicleStageId: state.activeVehicleStageId,
          transform: state.transform,
        }) * SCENE_SCALE;

      const nextMetrics = computeMetrics({
        camera,
        viewport: { width: size.width, height: size.height },
        scaleAnchorScene,
        playerScene,
        activeNodeScene,
        nextNodeScene,
        worldVisualMultiplier: calibration.activeWorldVisualMultiplier,
        vehicleVisualMultiplier: calibration.activeVehicleVisualMultiplier,
        vehicleSceneRadius,
        pathThickness: world.config.style.pathStyle.thickness,
      });

      const previousMetrics = metricsRef.current;
      const changed =
        Math.abs(previousMetrics.vehicleViewportHeightPercent - nextMetrics.vehicleViewportHeightPercent) > 0.03 ||
        Math.abs(previousMetrics.nodeClusterWidthPercent - nextMetrics.nodeClusterWidthPercent) > 0.03 ||
        Math.abs(previousMetrics.roadToVehicleWidthRatio - nextMetrics.roadToVehicleWidthRatio) > 0.001;

      if (changed) {
        metricsRef.current = nextMetrics;
        calibration.setMetrics(nextMetrics);
      }
    }
  });

  return null;
}
