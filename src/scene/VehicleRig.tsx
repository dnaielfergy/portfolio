import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { toSceneCoords } from "../data/loadWorldConfig";
import { useWorldStoreContext } from "../state/worldStore";
import { VehicleStageMesh } from "./vehicles/stageRegistry";

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

  useEffect(() => {
    const root = groupRef.current;
    if (!root) {
      return;
    }

    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) {
        return;
      }

      obj.renderOrder = 1000;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((material) => {
        material.transparent = true;
        material.opacity = 1;
        material.depthTest = false;
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
    <group ref={groupRef} position={[0, 0, 0]} renderOrder={1000}>
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
  );
}
