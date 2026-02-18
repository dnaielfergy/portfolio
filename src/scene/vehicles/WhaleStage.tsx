import { useTexture } from "@react-three/drei";

export function WhaleStage(): React.JSX.Element {
  const aquariumTexture = useTexture("/assets/aquarium.png");

  return (
    <group>
      <mesh castShadow position={[0, 0.95, 0]}>
        <capsuleGeometry args={[0.62, 1.55, 8, 18]} />
        <meshStandardMaterial color="#2b6ea8" roughness={0.95} metalness={0} />
      </mesh>

      <mesh castShadow position={[0, 1.08, -0.72]} rotation={[0.12, 0, 0]}>
        <coneGeometry args={[0.38, 0.95, 10]} />
        <meshStandardMaterial color="#1f5f93" roughness={1} metalness={0} />
      </mesh>

      <mesh castShadow position={[0, 1.28, 0.82]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.2, 0.55, 10]} />
        <meshStandardMaterial color="#2f7fbc" roughness={1} metalness={0} />
      </mesh>

      <mesh castShadow position={[0.56, 0.94, -0.14]} rotation={[0, 0, -0.45]}>
        <coneGeometry args={[0.16, 0.62, 10]} />
        <meshStandardMaterial color="#2673ac" roughness={1} metalness={0} />
      </mesh>
      <mesh castShadow position={[-0.56, 0.94, -0.14]} rotation={[0, 0, 0.45]}>
        <coneGeometry args={[0.16, 0.62, 10]} />
        <meshStandardMaterial color="#2673ac" roughness={1} metalness={0} />
      </mesh>

      <mesh castShadow position={[0, 1.0, 0.16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.72, 0.36]} />
        <meshStandardMaterial map={aquariumTexture} roughness={1} metalness={0} transparent opacity={0.88} />
      </mesh>
    </group>
  );
}
