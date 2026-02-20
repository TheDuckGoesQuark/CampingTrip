import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { asset } from '../../../utils/assetPath';

// Credit: "Focusrite Scarlett Solo Interface" on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/focusrite-scarlett-solo-interface-f09111be4a5c48228c3b898965d62bba

useGLTF.preload(asset('models/focusrite_scarlett_solo_interface.glb'));

export default function ScarlettSolo() {
  const { scene } = useGLTF(asset('models/focusrite_scarlett_solo_interface.glb'));

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  // Native: ~14.3 x 4.8 x 9.9 units. Scale 0.012 → ~17cm wide
  return (
    <group
      position={[-1.9, 0.45, -0.1]}
      rotation={[0, Math.PI * 0.0, 0]}
      scale={[0.05,0.05,0.05]}
    >
      <primitive object={scene} />
    </group>
  );
}
