import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { SCENE_SCALE, toSceneCoords } from "../data/loadWorldConfig";
import { resolveActivePlayerRadius } from "../physics/vehicleCollider";
import { useWorldStoreContext } from "../state/worldStore";
import type { EnvironmentObject } from "../types/world";

const FALLBACK_COLOR = new THREE.Color("#5c6772");
const COLLIDER_WIREFRAME_COLOR = new THREE.Color("#4cd9ff");
const COLLIDER_RADIUS_GAP_COLOR = new THREE.Color("#ffb347");
const SHOW_COLLIDER_WIREFRAME = true;
const SHOW_COLLIDER_RADIUS_GAP = true;

function getObjectColor(
  object: EnvironmentObject,
  palettes: Record<string, { primary: string; secondary: string; accent: string }>,
): THREE.Color {
  if (!object.styleKey) {
    return FALLBACK_COLOR;
  }

  const palette = palettes[object.styleKey];
  return palette ? new THREE.Color(palette.primary) : FALLBACK_COLOR;
}

function getRoofColor(
  object: EnvironmentObject,
  palettes: Record<string, { primary: string; secondary: string; accent: string }>,
): THREE.Color {
  const base = getObjectColor(object, palettes);
  return base.clone().multiplyScalar(0.78);
}

interface InstancedPlacementOptions {
  yScale?: number;
  yOffsetMultiplier?: number;
  xzScale?: number;
  sceneScale?: number;
  xzPaddingWorld?: number;
}

function applyTransforms(params: {
  mesh: THREE.InstancedMesh;
  objects: EnvironmentObject[];
  colors: THREE.Color[];
  options?: InstancedPlacementOptions;
}): void {
  const {
    mesh,
    objects,
    colors,
    options,
  } = params;
  const dummy = new THREE.Object3D();
  const yScale = options?.yScale ?? 1;
  const yOffsetMultiplier = options?.yOffsetMultiplier ?? 0.5;
  const xzScale = options?.xzScale ?? 1;
  const sceneScale = options?.sceneScale ?? SCENE_SCALE;
  const xzPaddingWorld = options?.xzPaddingWorld ?? 0;

  objects.forEach((object, index) => {
    const elevation = object.position.elevation ?? 0;
    const center = toSceneCoords(
      object.position.x,
      object.position.y,
      (elevation + object.size.height * yOffsetMultiplier) * sceneScale,
    );
    dummy.position.set(center.x, center.y, center.z);
    dummy.rotation.set(0, -((object.rotation ?? 0) * Math.PI) / 180, 0);
    const paddedWidth = object.size.width + xzPaddingWorld * 2;
    const paddedDepth = object.size.depth + xzPaddingWorld * 2;
    dummy.scale.set(
      paddedWidth * xzScale * sceneScale,
      object.size.height * yScale * sceneScale,
      paddedDepth * xzScale * sceneScale,
    );
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    mesh.setColorAt(index, colors[index] ?? FALLBACK_COLOR);
  });

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }
  mesh.computeBoundingSphere();
}

export function EnvironmentLayer(): React.JSX.Element {
  const {
    world,
    state,
  } = useWorldStoreContext();
  const buildingMeshRef = useRef<THREE.InstancedMesh>(null);
  const roofMeshRef = useRef<THREE.InstancedMesh>(null);
  const propMeshRef = useRef<THREE.InstancedMesh>(null);
  const colliderGapWireframeRef = useRef<THREE.InstancedMesh>(null);
  const colliderWireframeRef = useRef<THREE.InstancedMesh>(null);

  const buildings = world.config.environment.buildings;
  const colliderBuildings = useMemo(
    () => buildings.filter((building) => building.collider !== false),
    [buildings],
  );
  const props = useMemo(
    () => (state.qualityTier === "low" ? [] : (world.config.environment.props ?? [])),
    [state.qualityTier, world.config.environment.props],
  );
  const buildingColors = useMemo(
    () => buildings.map((building) => getObjectColor(building, world.config.style.regionPalettes)),
    [buildings, world.config.style.regionPalettes],
  );
  const roofColors = useMemo(
    () => buildings.map((building) => getRoofColor(building, world.config.style.regionPalettes)),
    [buildings, world.config.style.regionPalettes],
  );
  const propColors = useMemo(
    () => props.map((prop) => getObjectColor(prop, world.config.style.regionPalettes)),
    [props, world.config.style.regionPalettes],
  );
  const colliderWireframeColors = useMemo(
    () => colliderBuildings.map(() => COLLIDER_WIREFRAME_COLOR),
    [colliderBuildings],
  );
  const colliderGapWireframeColors = useMemo(
    () => colliderBuildings.map(() => COLLIDER_RADIUS_GAP_COLOR),
    [colliderBuildings],
  );
  const activePlayerRadius = useMemo(
    () =>
      resolveActivePlayerRadius({
        worldConfig: world.config,
        activeVehicleStageId: state.activeVehicleStageId,
        transform: state.transform,
      }),
    [state.activeVehicleStageId, state.transform.fromStage, state.transform.status, state.transform.toStage, world.config],
  );
  const showRoofCaps = state.qualityTier !== "low";

  useLayoutEffect(() => {
    const mesh = buildingMeshRef.current;
    if (!mesh || buildings.length === 0) {
      return;
    }
    applyTransforms({
      mesh,
      objects: buildings,
      colors: buildingColors,
    });
  }, [buildingColors, buildings]);

  useLayoutEffect(() => {
    const roofMesh = roofMeshRef.current;
    if (!roofMesh || !showRoofCaps || buildings.length === 0) {
      return;
    }
    applyTransforms({
      mesh: roofMesh,
      objects: buildings,
      colors: roofColors,
      options: {
        yScale: 0.08,
        yOffsetMultiplier: 1,
        xzScale: 0.82,
      },
    });
  }, [buildings, roofColors, showRoofCaps]);

  useLayoutEffect(() => {
    const mesh = propMeshRef.current;
    if (!mesh || props.length === 0) {
      return;
    }
    applyTransforms({
      mesh,
      objects: props,
      colors: propColors,
    });
  }, [propColors, props]);

  useLayoutEffect(() => {
    const mesh = colliderGapWireframeRef.current;
    if (!mesh || !SHOW_COLLIDER_RADIUS_GAP || colliderBuildings.length === 0) {
      return;
    }
    applyTransforms({
      mesh,
      objects: colliderBuildings,
      colors: colliderGapWireframeColors,
      options: {
        xzPaddingWorld: activePlayerRadius,
      },
    });
  }, [activePlayerRadius, colliderBuildings, colliderGapWireframeColors]);

  useLayoutEffect(() => {
    const mesh = colliderWireframeRef.current;
    if (!mesh || !SHOW_COLLIDER_WIREFRAME || colliderBuildings.length === 0) {
      return;
    }
    applyTransforms({
      mesh,
      objects: colliderBuildings,
      colors: colliderWireframeColors,
      options: {
        xzScale: 1.01,
        yScale: 1.01,
      },
    });
  }, [colliderBuildings, colliderWireframeColors]);

  return (
    <group>
      <instancedMesh
        ref={buildingMeshRef}
        args={[undefined, undefined, buildings.length]}
        castShadow={state.qualityTier !== "low"}
        receiveShadow={state.qualityTier === "high"}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={1} metalness={0} vertexColors />
      </instancedMesh>

      {showRoofCaps ? (
        <instancedMesh
          ref={roofMeshRef}
          args={[undefined, undefined, buildings.length]}
          castShadow={false}
          receiveShadow={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={1} metalness={0} vertexColors />
        </instancedMesh>
      ) : null}

      {props.length > 0 ? (
        <instancedMesh
          ref={propMeshRef}
          args={[undefined, undefined, props.length]}
          castShadow={false}
          receiveShadow={state.qualityTier === "high"}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={1} metalness={0} vertexColors />
        </instancedMesh>
      ) : null}

      {SHOW_COLLIDER_RADIUS_GAP && colliderBuildings.length > 0 ? (
        <instancedMesh
          ref={colliderGapWireframeRef}
          args={[undefined, undefined, colliderBuildings.length]}
          castShadow={false}
          receiveShadow={false}
          frustumCulled={false}
          renderOrder={49}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ffb347" wireframe transparent opacity={0.55} depthTest={false} />
        </instancedMesh>
      ) : null}

      {SHOW_COLLIDER_WIREFRAME && colliderBuildings.length > 0 ? (
        <instancedMesh
          ref={colliderWireframeRef}
          args={[undefined, undefined, colliderBuildings.length]}
          castShadow={false}
          receiveShadow={false}
          frustumCulled={false}
          renderOrder={50}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#4cd9ff" wireframe transparent opacity={0.9} depthTest={false} />
        </instancedMesh>
      ) : null}
    </group>
  );
}
