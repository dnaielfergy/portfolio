import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { SCENE_SCALE, toSceneCoords } from "../data/loadWorldConfig";
import { resolveActivePlayerRadius } from "../physics/vehicleCollider";
import { useWorldStoreContext } from "../state/worldStore";
import { VehicleStageMesh } from "./vehicles/stageRegistry";

const SHOW_VEHICLE_COLLIDER_OUTLINE = true;

export function VehicleRig(): React.JSX.Element {
  const {
    world,
    state,
  } = useWorldStoreContext();

  const groupRef = useRef<THREE.Group>(null);

  const renderedStage = useMemo(() => {
    if (state.transform.status !== "running") {
      return state.activeVehicleStageId;
    }

    return state.transform.progress < world.config.vehicles.transformRules.swapAtPercent
      ? state.transform.fromStage
      : state.transform.toStage;
  }, [state.activeVehicleStageId, state.transform.fromStage, state.transform.progress, state.transform.status, state.transform.toStage, world.config.vehicles.transformRules.swapAtPercent]);
  const activePlayerRadius = useMemo(
    () =>
      resolveActivePlayerRadius({
        worldConfig: world.config,
        activeVehicleStageId: state.activeVehicleStageId,
        transform: state.transform,
      }),
    [state.activeVehicleStageId, state.transform.fromStage, state.transform.status, state.transform.toStage, world.config],
  );
  const colliderRadiusScene = activePlayerRadius * SCENE_SCALE;
  const colliderOutlineInnerRadius = Math.max(0.02, colliderRadiusScene - 0.05);
  const colliderOutlineOuterRadius = colliderRadiusScene + 0.05;
  const colliderCenter = toSceneCoords(state.player.position.x, state.player.position.y, 0);

  useEffect(() => {
    const root = groupRef.current;
    if (!root) {
      return;
    }

    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) {
        return;
      }

      obj.renderOrder = 0;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((material) => {
        material.transparent = true;
        material.opacity = 1;
        material.depthTest = true;
        material.depthWrite = true;
        material.needsUpdate = true;
      });
    });
  }, [renderedStage]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const target = toSceneCoords(state.player.position.x, state.player.position.y, 0);
    group.position.lerp(new THREE.Vector3(target.x, target.y, target.z), Math.min(1, delta * 10));

    if (state.transform.status === "running") {
      const spinRadians = (state.transform.progress * world.config.vehicles.transformRules.spinDegrees * Math.PI) / 180;
      group.rotation.y = spinRadians;
      group.position.y = target.y + Math.sin(state.transform.progress * Math.PI) * 0.35;
    } else {
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, 0, Math.min(1, delta * 8));
      group.position.y = target.y;
    }
  });

  const showDustPuff =
    world.config.vehicles.transformRules.dustPuff &&
    state.transform.status === "running" &&
    state.transform.progress > 0.75;
  const dustScale = 0.4 + state.transform.progress * 1.8;

  return (
    <>
      {SHOW_VEHICLE_COLLIDER_OUTLINE ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[colliderCenter.x, 0.04, colliderCenter.z]}
          renderOrder={60}
        >
          <ringGeometry args={[colliderOutlineInnerRadius, colliderOutlineOuterRadius, 56]} />
          <meshBasicMaterial color="#ff4d6d" transparent opacity={0.95} depthTest={false} depthWrite={false} />
        </mesh>
      ) : null}

      <group ref={groupRef} position={[0, 0, 0]}>
        <group position={[0, 0.02, 0]}>
          <VehicleStageMesh stage={renderedStage} />
        </group>
        {showDustPuff ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[dustScale, dustScale + 0.45, 24]} />
            <meshBasicMaterial color="#d5d5d5" transparent opacity={Math.max(0, 1 - state.transform.progress)} />
          </mesh>
        ) : null}
      </group>
    </>
  );
}
