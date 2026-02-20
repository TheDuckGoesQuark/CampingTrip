// Placeholder — will be replaced with GLTF + AnimationMixer in build stage 9
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../../../store/sceneStore';

export default function Cat() {
  const groupRef = useRef<THREE.Group>(null);
  const catLocation = useSceneStore((s) => s.catLocation);

  // Simple breathing bob — placeholder until GLTF is loaded
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta;
    if (groupRef.current && catLocation === 'sleeping') {
      groupRef.current.position.y = Math.sin(t.current * 1.2) * 0.015;
    }
  });

  return (
    <group ref={groupRef} position={[1.5, 0.08, 0.5]}>
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.1, 0.22, 4, 8]} />
        <meshStandardMaterial color="#e8c88a" roughness={0.9} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.22, 0.1]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#e8c88a" roughness={0.9} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.055, 0.31, 0.1]} castShadow>
        <coneGeometry args={[0.035, 0.07, 4]} />
        <meshStandardMaterial color="#d4a870" roughness={0.9} />
      </mesh>
      <mesh position={[0.055, 0.31, 0.1]} castShadow>
        <coneGeometry args={[0.035, 0.07, 4]} />
        <meshStandardMaterial color="#d4a870" roughness={0.9} />
      </mesh>
    </group>
  );
}
