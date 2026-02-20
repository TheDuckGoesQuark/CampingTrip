import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../store/sceneStore';

export default function Lighting() {
  const lanternLightRef = useRef<THREE.PointLight>(null);
  const lanternOn   = useSceneStore((s) => s.lanternOn);
  const doorState   = useSceneStore((s) => s.tentDoorState);
  const doorOpen    = doorState === 'open' || doorState === 'opening';

  useFrame(() => {
    if (!lanternLightRef.current) return;
    const target = lanternOn ? 4.0 : 0;
    lanternLightRef.current.intensity = THREE.MathUtils.lerp(
      lanternLightRef.current.intensity,
      target,
      0.08
    );
  });

  return (
    <>
      {/* Scene fog — adds atmospheric depth */}
      <fog attach="fog" args={['#1a0f0a', 3, 18]} />

      {/* Warm ambient — base so nothing is pitch black */}
      <ambientLight
        intensity={lanternOn ? 0.5 : 0.1}
        color="#b08050"
      />

      {/* Hemisphere light — warm from above, cool from below */}
      <hemisphereLight
        args={['#ffcc88', '#223344', 0.3]}
      />

      {/* Main lantern light — warm point light */}
      <pointLight
        ref={lanternLightRef}
        position={[0, 2.2, 0.5]}
        color="#ffb347"
        intensity={4.0}
        distance={14}
        decay={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={12}
      />

      {/* Fill from behind camera — illuminate tent interior */}
      <pointLight
        position={[0, 1.2, 3]}
        color="#ffa060"
        intensity={lanternOn ? 1.5 : 0}
        distance={8}
        decay={1.5}
        castShadow={false}
      />

      {/* Cold outdoor light when door is open */}
      <spotLight
        position={[0, 2, -6]}
        target-position={[0, 0, 0]}
        intensity={doorOpen ? 1.2 : 0}
        color="#6a9fc5"
        angle={0.5}
        penumbra={0.9}
        castShadow={false}
      />
    </>
  );
}
