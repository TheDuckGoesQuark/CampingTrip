// Placeholder sleeping bag — sits below/around the camera position
export default function SleepingBag() {
  return (
    <group position={[0, 0.08, 2.2]} rotation={[0, 0, 0]}>
      {/* Main body — long rounded shape */}
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.3, 1.2, 4, 12]} />
        <meshStandardMaterial color="#3a5c3a" roughness={0.85} />
      </mesh>

      {/* Pillow bump at the head end */}
      <mesh position={[0, 0.12, 0.65]} castShadow>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#d4c9a8" roughness={0.9} />
      </mesh>

      {/* Folded-back top flap */}
      <mesh position={[0, 0.18, 0.2]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.55, 0.06, 0.5]} />
        <meshStandardMaterial color="#2e4a2e" roughness={0.85} />
      </mesh>
    </group>
  );
}
