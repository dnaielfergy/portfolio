import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { toSceneCoords } from "../data/loadWorldConfig";
import { useWorldStoreContext } from "../state/worldStore";

export function CharacterRig(): React.JSX.Element {
  const {
    state: { player },
  } = useWorldStoreContext();

  const groupRef = useRef<THREE.Group>(null);

  useFrame((frameState, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const target = toSceneCoords(player.position.x, player.position.y, 0.75);
    group.position.lerp(new THREE.Vector3(target.x, target.y, target.z), Math.min(1, delta * 10));

    const speed = Math.hypot(player.velocity.x, player.velocity.y);
    if (speed > 0.01) {
      const yaw = Math.atan2(-player.velocity.y, player.velocity.x);
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, -yaw + Math.PI / 2, Math.min(1, delta * 10));
    }

    group.position.y = target.y + (speed < 0.1 ? Math.sin(frameState.clock.elapsedTime * 3.2) * 0.06 : 0.02);
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshStandardMaterial color="#f2d0b8" roughness={1} metalness={0} />
      </mesh>
      <mesh castShadow position={[0, 0.42, 0]}>
        <capsuleGeometry args={[0.2, 0.5, 4, 10]} />
        <meshStandardMaterial color="#293241" roughness={1} metalness={0} />
      </mesh>
      <mesh castShadow position={[0.22, 0.98, 0.2]}>
        <boxGeometry args={[0.09, 0.05, 0.08]} />
        <meshStandardMaterial color="#1b1b1b" roughness={1} metalness={0} />
      </mesh>
      <mesh castShadow position={[-0.22, 0.98, 0.2]}>
        <boxGeometry args={[0.09, 0.05, 0.08]} />
        <meshStandardMaterial color="#1b1b1b" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
