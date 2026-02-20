import { useSceneStore } from '../../../store/sceneStore';

// Visible through the tent door when open.
// Simple low-poly geometry — forest floor, a few trees, night sky.
export default function OutdoorScene() {
  const doorState = useSceneStore((s) => s.tentDoorState);
  const visible = doorState === 'open' || doorState === 'opening';

  // Always render (geometry is behind the door mesh); visibility is controlled
  // by the door mesh occluding it when closed.
  return (
    <group position={[0, 0, -4]}>
      {/* Ground plane extending outside */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a2d1a" roughness={1} />
      </mesh>

      {/* Night sky backdrop */}
      <mesh position={[0, 5, -10]}>
        <planeGeometry args={[30, 15]} />
        <meshStandardMaterial color="#080412" roughness={1} />
      </mesh>

      {/* A few low-poly tree silhouettes */}
      <Tree position={[-3, 0, -5]} height={4} />
      <Tree position={[3.5, 0, -6]} height={3.2} />
      <Tree position={[-1.5, 0, -8]} height={5} />
      <Tree position={[5, 0, -4]} height={2.8} />

      {/* Campfire glow hint (placeholder sphere) */}
      <mesh position={[0, 0.1, -6]} visible={visible}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#ff6a00" emissive="#ff4400" emissiveIntensity={2} />
      </mesh>
      {visible && (
        <pointLight
          position={[0, 0.4, -6]}
          color="#ff6a00"
          intensity={1.2}
          distance={4}
          decay={2}
        />
      )}
    </group>
  );
}

function Tree({
  position,
  height,
}: {
  position: [number, number, number];
  height: number;
}) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, height * 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, height * 0.4, 6]} />
        <meshStandardMaterial color="#2d1f0e" roughness={1} />
      </mesh>
      {/* Canopy — two stacked cones for low-poly look */}
      <mesh position={[0, height * 0.55, 0]} castShadow>
        <coneGeometry args={[height * 0.3, height * 0.5, 7]} />
        <meshStandardMaterial color="#0d2210" roughness={1} />
      </mesh>
      <mesh position={[0, height * 0.75, 0]} castShadow>
        <coneGeometry args={[height * 0.2, height * 0.35, 7]} />
        <meshStandardMaterial color="#112a14" roughness={1} />
      </mesh>
    </group>
  );
}
