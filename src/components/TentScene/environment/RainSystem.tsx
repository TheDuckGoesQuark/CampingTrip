import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../../store/sceneStore';

const RAIN_COUNT = 600;
const WIND_X = -0.8; // slight wind drift

export default function RainSystem() {
  const doorState = useSceneStore((s) => s.tentDoorState);
  const active = doorState === 'open' || doorState === 'opening';

  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(RAIN_COUNT * 3);
    const vel = new Float32Array(RAIN_COUNT);
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = Math.random() * 10;
      pos[i * 3 + 2] = -4 - Math.random() * 14;
      vel[i] = 5 + Math.random() * 3; // vary fall speed per drop
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current || !active) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < RAIN_COUNT; i++) {
      arr[i * 3]     += WIND_X * delta; // wind drift
      arr[i * 3 + 1] -= velocities[i] * delta;
      if (arr[i * 3 + 1] < -0.5) {
        arr[i * 3]     = (Math.random() - 0.5) * 16;
        arr[i * 3 + 1] = 8 + Math.random() * 2;
        arr[i * 3 + 2] = -4 - Math.random() * 14;
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
        size={0.04}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}
