export function ParsonsStage(): React.JSX.Element {
  return (
    <group>
      <mesh castShadow position={[0, 0.65, 0]}>
        <boxGeometry args={[2.1, 0.7, 3.2]} />
        <meshStandardMaterial color="#4b5320" roughness={1} metalness={0} />
      </mesh>
      <mesh castShadow position={[0, 1.22, -0.5]}>
        <boxGeometry args={[1.45, 0.5, 1.5]} />
        <meshStandardMaterial color="#76866c" roughness={1} metalness={0} />
      </mesh>
      <mesh castShadow position={[0, 0.95, 1.35]}>
        <boxGeometry args={[1.3, 0.28, 0.35]} />
        <meshStandardMaterial color="#303030" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
