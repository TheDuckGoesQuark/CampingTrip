import { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { asset } from '../../../utils/assetPath';

// Credit: "Stylized Campfire" by Natalia Campos on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/stylized-campfire-3b507b1eb4c142218a4b3baa043e3ed4

const SCALE = 60.0;

useGLTF.preload(asset('models/stylized_campfire.glb'));

export default function Campfire() {
  const { scene } = useGLTF(asset('models/stylized_campfire.glb'));
  const fireLight = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  // Flickering fire light
  useFrame((_, delta) => {
    if (!fireLight.current) return;
    t.current += delta;
    const flicker = Math.sin(t.current * 8) * 0.4
      + Math.sin(t.current * 13) * 0.2
      + Math.sin(t.current * 21) * 0.1;
    fireLight.current.intensity = 4.0 + flicker;
  });

  return (
    <group position={[0, 0, -12]}>
      {/* Campfire model — scaled down, lights stay in world space */}
      <group scale={[SCALE, SCALE, SCALE]} rotation={[0, -Math.PI * 0.3, 0]}>
        <primitive object={scene} />
      </group>

      {/* Warm campfire light — offset toward tent + slightly right to match fire in model */}
      <pointLight
        ref={fireLight}
        position={[1.0, 1.2, 5.5]}
        color="#ff7722"
        intensity={5.0}
        distance={25}
        decay={0.8}
        castShadow={false}
      />

      {/* Secondary wider glow — ground bounce, same offset */}
      <pointLight
        position={[1.0, 0.3, 5.5]}
        color="#ffaa44"
        intensity={2.5}
        distance={18}
        decay={1.0}
        castShadow={false}
      />
    </group>
  );
}
