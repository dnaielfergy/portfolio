export function WreckStage(): React.JSX.Element {
  return (
    <group>
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[1.8, 0.6, 3]} />
        <meshStandardMaterial color="#b3a369" roughness={1} metalness={0} />
      </mesh>
      <mesh castShadow position={[0, 1.0, -0.25]}>
        <boxGeometry args={[1.3, 0.45, 1.7]} />
        <meshStandardMaterial color="#f0f0f0" roughness={1} metalness={0} />
      </mesh>
      {[-0.95, 0.95].flatMap((x) => [-1.1, 1.1].map((z) => [x, z] as const)).map(([x, z]) => (
        <mesh key={`${x}-${z}`} castShadow position={[x, 0.25, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.35, 18]} />
          <meshStandardMaterial color="#202020" roughness={1} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}
