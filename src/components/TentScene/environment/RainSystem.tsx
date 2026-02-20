import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../../store/sceneStore';

const RAIN_COUNT = 800;

export default function RainSystem() {
  const doorState = useSceneStore((s) => s.tentDoorState);
  const active = doorState === 'open' || doorState === 'opening';

  const pointsRef = useRef<THREE.Points>(null);

  // Generate random raindrop positions
  const { positions } = useMemo(() => {
    const pos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 14;  // x
      pos[i * 3 + 1] = Math.random() * 8;            // y (height)
      pos[i * 3 + 2] = -4 - Math.random() * 12;     // z (outside the tent)
    }
    return { positions: pos };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current || !active) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < RAIN_COUNT; i++) {
      arr[i * 3 + 1] -= delta * 6; // fall speed
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 8; // reset to top
      }
    }
    pos.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#8ab4cc"
        size={0.03}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}
