import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Credit: "Acoustic Guitar" on Sketchfab (CC-BY)
// Model placed inside tent, leaning to the left of the door

useGLTF.preload('/models/acoustic_guitar.glb');

export default function Guitar() {
  const { scene } = useGLTF('/models/acoustic_guitar.glb');

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <group
      position={[1.6, 0.7, -0.6]}
      rotation={[-0.10, Math.PI * 1.25 - Math.PI / 12, -1.15]}
      scale={[1.8, 1.8, -1.8]}
    >
      <primitive object={scene} />
    </group>
  );
}
