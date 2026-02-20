import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../../../store/sceneStore';

export default function Lantern() {
  const groupRef  = useRef<THREE.Group>(null);
  const glowRef   = useRef<THREE.Mesh>(null);
  const lanternOn = useSceneStore((s) => s.lanternOn);
  const toggle    = useSceneStore((s) => s.toggleLantern);

  // Subtle sway + glow pulse — all in useFrame, zero state
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(t.current * 0.6) * 0.03;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = lanternOn
        ? 1.2 + Math.sin(t.current * 3.5) * 0.15
        : THREE.MathUtils.lerp(mat.emissiveIntensity, 0, 0.1);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, 2.2, 0.5]}
      onClick={toggle}
    >
      {/* Lantern body */}
      <mesh castShadow>
        <boxGeometry args={[0.18, 0.28, 0.18]} />
        <meshStandardMaterial color="#5c3d1a" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Glass pane (glow) */}
      <mesh ref={glowRef} castShadow>
        <boxGeometry args={[0.13, 0.22, 0.13]} />
        <meshStandardMaterial
          color="#ffb347"
          emissive="#ff8c00"
          emissiveIntensity={lanternOn ? 1.2 : 0}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Hanging wire */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.3, 4]} />
        <meshStandardMaterial color="#3a2a10" roughness={0.8} />
      </mesh>

      {/* Hook at top */}
      <mesh position={[0, 0.37, 0]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshStandardMaterial color="#3a2a10" roughness={0.8} />
      </mesh>
    </group>
  );
}
