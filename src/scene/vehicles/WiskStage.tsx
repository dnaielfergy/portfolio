import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

export function WiskStage(): React.JSX.Element {
  const rotorRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!rotorRef.current) {
      return;
    }

    rotorRef.current.rotation.y += delta * 8;
  });

  return (
    <group>
      <mesh castShadow position={[0, 0.95, 0]}>
        <boxGeometry args={[0.55, 0.4, 2.4]} />
        <meshStandardMaterial color="#ffffff" roughness={1} metalness={0} />
      </mesh>
      <mesh castShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[4.2, 0.1, 0.5]} />
        <meshStandardMaterial color="#ffd100" roughness={1} metalness={0} />
      </mesh>
      <group ref={rotorRef}>
        {[-1.7, 1.7].map((x) => (
          <mesh key={x} castShadow position={[x, 1.15, 0]}>
            <boxGeometry args={[0.15, 0.06, 1.2]} />
            <meshStandardMaterial color="#1b1b1b" roughness={1} metalness={0} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
