import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../store/sceneStore';

export default function Lighting() {
  const lanternLightRef = useRef<THREE.PointLight>(null);
  const lanternOn   = useSceneStore((s) => s.lanternOn);
  const doorState   = useSceneStore((s) => s.tentDoorState);
  const doorOpen    = doorState === 'open' || doorState === 'opening';

  // Smoothly animate lantern intensity rather than snapping
  useFrame(() => {
    if (!lanternLightRef.current) return;
    const target = lanternOn ? 5.0 : 0;
    lanternLightRef.current.intensity = THREE.MathUtils.lerp(
      lanternLightRef.current.intensity,
      target,
      0.08
    );
  });

  return (
    <>
      {/* Warm ambient — base visibility so nothing is pitch black */}
      <ambientLight
        intensity={lanternOn ? 0.6 : 0.12}
        color="#8a6a40"
      />

      {/* Warm lantern — main light source, hangs from ridge */}
      <pointLight
        ref={lanternLightRef}
        position={[0, 2.2, 0.5]}
        color="#ffb347"
        distance={12}
        decay={1.2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.1}
        shadow-camera-far={10}
      />

      {/* Floor fill — subtle warm bounce light so props on the floor are visible */}
      <pointLight
        position={[0, 0.3, 1.0]}
        color="#ffcc88"
        intensity={lanternOn ? 1.0 : 0}
        distance={5}
        decay={1.5}
        castShadow={false}
      />

      {/* Cold outdoor light — activates when door is open */}
      <spotLight
        position={[0, 1.5, -5]}
        target-position={[0, 0, 0]}
        intensity={doorOpen ? 0.8 : 0}
        color="#4a7fa5"
        angle={0.4}
        penumbra={0.8}
        castShadow={false}
      />
    </>
  );
}
