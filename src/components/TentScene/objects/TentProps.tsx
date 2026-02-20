/** Small cosy props scattered around the tent interior */
export default function TentProps() {
  return (
    <group>
      {/* === Mug near sleeping bag === */}
      <group position={[0.6, 0.01, 1.8]} rotation={[0, 0.3, 0]}>
        {/* Body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.08, 8]} />
          <meshStandardMaterial color="#c4734f" roughness={0.7} />
        </mesh>
        {/* Handle — tiny torus */}
        <mesh position={[0.045, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.02, 0.006, 6, 8]} />
          <meshStandardMaterial color="#c4734f" roughness={0.7} />
        </mesh>
      </group>

      {/* === Stack of books (left side, near laptop area) === */}
      <group position={[-1.1, 0.01, 1.2]} rotation={[0, -0.2, 0]}>
        <mesh position={[0, 0.015, 0]} castShadow>
          <boxGeometry args={[0.14, 0.025, 0.1]} />
          <meshStandardMaterial color="#8b3a3a" roughness={0.8} />
        </mesh>
        <mesh position={[0.005, 0.04, -0.003]} rotation={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.13, 0.02, 0.095]} />
          <meshStandardMaterial color="#2a4a6a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.005, 0.06, 0.002]} rotation={[0, -0.08, 0]} castShadow>
          <boxGeometry args={[0.12, 0.018, 0.09]} />
          <meshStandardMaterial color="#4a6a3a" roughness={0.8} />
        </mesh>
      </group>

      {/* === Small cushion / folded blanket at back of tent === */}
      <group position={[-0.5, 0.02, 2.0]} rotation={[0, 0.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.08, 0.3]} />
          <meshStandardMaterial color="#6a4a5a" roughness={0.9} />
        </mesh>
      </group>

      {/* === Rolled-up blanket near right wall === */}
      <group position={[1.8, 0.06, 0.0]} rotation={[0, 0.2, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.06, 0.35, 6, 8]} />
          <meshStandardMaterial color="#5a3a2a" roughness={0.9} />
        </mesh>
      </group>

      {/* === Water bottle near mug === */}
      <group position={[0.8, 0.01, 1.6]} rotation={[0, -0.5, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.12, 8]} />
          <meshStandardMaterial color="#4a7a8a" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Cap */}
        <mesh position={[0, 0.065, 0]} castShadow>
          <cylinderGeometry args={[0.027, 0.027, 0.015, 8]} />
          <meshStandardMaterial color="#3a6a7a" roughness={0.4} metalness={0.4} />
        </mesh>
      </group>

      {/* === Headlamp / torch near pillow area === */}
      <group position={[0.25, 0.02, 2.5]} rotation={[Math.PI / 2, 0, 0.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.018, 0.015, 0.08, 6]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Lens */}
        <mesh position={[0, 0.042, 0]}>
          <circleGeometry args={[0.016, 8]} />
          <meshStandardMaterial
            color="#aaccdd"
            emissive="#446688"
            emissiveIntensity={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>
    </group>
  );
}
