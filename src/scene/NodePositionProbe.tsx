import { Html, useTexture } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useWorldStoreContext } from "../state/worldStore";
import { isCalibrationFeatureEnabled } from "../tuning/calibrationFlags";
import { useNodePositionCalibration } from "../tuning/nodePositionCalibrationContext";
import { deriveMapWorldBounds, sceneToWorld, worldToScene } from "../tuning/nodePositionCalibration";

const MARKER_ELEVATION = 0.35;

function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? value.toFixed(4) : "--";
}

function releasePointerCapture(event: ThreeEvent<PointerEvent>): void {
  const target = event.target as EventTarget & { releasePointerCapture?: (pointerId: number) => void };
  target.releasePointerCapture?.(event.pointerId);
}

function setPointerCapture(event: ThreeEvent<PointerEvent>): void {
  const target = event.target as EventTarget & { setPointerCapture?: (pointerId: number) => void };
  target.setPointerCapture?.(event.pointerId);
}

export function NodePositionProbe(): React.JSX.Element | null {
  if (!isCalibrationFeatureEnabled()) {
    return null;
  }

  return <NodePositionProbeInner />;
}

function NodePositionProbeInner(): React.JSX.Element {
  const {
    world: { config },
  } = useWorldStoreContext();
  const { candidateCoords, setCandidateCoords, setDragging, isDragging, setMapBounds } = useNodePositionCalibration();
  const markerPosition = useMemo(
    () => worldToScene(candidateCoords.x, candidateCoords.y, MARKER_ELEVATION),
    [candidateCoords.x, candidateCoords.y],
  );
  const texture = useTexture(config.assets.mapImage);
  const probeGroupRef = useRef<THREE.Group>(null);
  const dragPlaneRef = useRef(new THREE.Plane());
  const worldPlanePointRef = useRef(new THREE.Vector3());
  const worldHitRef = useRef(new THREE.Vector3());
  const worldNormalRef = useRef(new THREE.Vector3(0, 1, 0));
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    const image = texture.image as { width?: number; height?: number } | undefined;
    const bounds = deriveMapWorldBounds({
      imageWidth: image?.width,
      imageHeight: image?.height,
    });
    setMapBounds(bounds);
  }, [setMapBounds, texture.image]);

  useEffect(() => {
    return () => {
      setDragging(false);
    };
  }, [setDragging]);

  const updateFromPointerEvent = (event: ThreeEvent<PointerEvent>): void => {
    const probeGroup = probeGroupRef.current;
    if (!probeGroup || !probeGroup.parent) {
      return;
    }

    const worldGroup = probeGroup.parent;
    worldPlanePointRef.current.set(0, MARKER_ELEVATION, 0).applyMatrix4(worldGroup.matrixWorld);
    dragPlaneRef.current.setFromNormalAndCoplanarPoint(worldNormalRef.current, worldPlanePointRef.current);

    const intersection = event.ray.intersectPlane(dragPlaneRef.current, worldHitRef.current);
    if (!intersection) {
      return;
    }

    const localPoint = worldGroup.worldToLocal(worldHitRef.current.clone());
    setCandidateCoords(sceneToWorld(localPoint.x, localPoint.z));
  };

  return (
    <group ref={probeGroupRef} position={[markerPosition.x, markerPosition.y, markerPosition.z]}>
      <mesh
        onPointerDown={(event) => {
          event.stopPropagation();
          pointerIdRef.current = event.pointerId;
          setPointerCapture(event);
          setDragging(true);
          updateFromPointerEvent(event);
        }}
        onPointerMove={(event) => {
          if (!isDragging || pointerIdRef.current !== event.pointerId) {
            return;
          }
          event.stopPropagation();
          updateFromPointerEvent(event);
        }}
        onPointerUp={(event) => {
          if (pointerIdRef.current !== event.pointerId) {
            return;
          }
          pointerIdRef.current = null;
          releasePointerCapture(event);
          setDragging(false);
          event.stopPropagation();
        }}
        onPointerCancel={(event) => {
          if (pointerIdRef.current !== event.pointerId) {
            return;
          }
          pointerIdRef.current = null;
          releasePointerCapture(event);
          setDragging(false);
          event.stopPropagation();
        }}
      >
        <sphereGeometry args={[1.15, 20, 20]} />
        <meshStandardMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.28, 24]} />
        <meshStandardMaterial
          color={isDragging ? "#ffd36a" : "#68d0ff"}
          emissive={isDragging ? "#c9a227" : "#2f6f90"}
          emissiveIntensity={0.6}
          roughness={0.55}
          metalness={0.08}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.21, 0]}>
        <ringGeometry args={[0.88, 1.15, 32]} />
        <meshBasicMaterial
          color={isDragging ? "#ffe8a8" : "#8be3ff"}
          transparent
          opacity={0.95}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Html distanceFactor={10} position={[0, 1.2, 0]} center>
        <div className="node-probe-label">
          Test Node ({formatCoordinate(candidateCoords.x)}, {formatCoordinate(candidateCoords.y)})
        </div>
      </Html>
    </group>
  );
}
