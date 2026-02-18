export function FictivStage(): React.JSX.Element {
  return (
    <group>
      <mesh castShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[1.6, 1.3, 1.2]} />
        <meshStandardMaterial color="#58b99e" roughness={1} metalness={0} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <group key={x} position={[x, 0.2, 0]}>
          <mesh castShadow position={[0, 0.45, 0]}>
            <boxGeometry args={[0.35, 0.9, 0.35]} />
            <meshStandardMaterial color="#2b2b2b" roughness={1} metalness={0} />
          </mesh>
          <mesh castShadow position={[0, -0.05, 0]}>
            <boxGeometry args={[0.55, 0.2, 0.65]} />
            <meshStandardMaterial color="#f5f5f5" roughness={1} metalness={0} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 1.65, 0.55]}>
        <boxGeometry args={[1.5, 0.35, 0.28]} />
        <meshStandardMaterial color="#2b2b2b" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
