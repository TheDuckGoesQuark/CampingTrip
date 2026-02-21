import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { asset } from '../../../utils/assetPath';

// Credit: "Notepad" on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/notepadb-0b30d2efe63f41b0a812904b610fe577

useGLTF.preload(asset('models/notepadb.glb'), true);

export default function Notepad() {
  const { scene } = useGLTF(asset('models/notepadb.glb'), true);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  // Native: ~184 x 13 x 149 units — massive model. Scale 0.001 → ~18cm wide
  return (
    <group
      position={[-0.7, 0.4, -0.7]}
      rotation={[0.1, Math.PI * 0.48, 0.3]}
      scale={[0.004, 0.004, 0.004]}
    >
      <primitive object={scene} />
    </group>
  );
}
