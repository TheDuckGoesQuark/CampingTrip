import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { asset, DRACO_PATH } from '../../../utils/assetPath';
import { fixDarkMetallics } from '../../../utils/materialFixes';

// Credit: "Moka Pot" on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/moka-pot-2ca52d750d95471a953fb2c9eb577da6

useGLTF.preload(asset('models/moka_pot.glb'), DRACO_PATH);

export default function MokaPot() {
  const { scene } = useGLTF(asset('models/moka_pot.glb'), DRACO_PATH);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        fixDarkMetallics(child);
      }
    });
  }, [scene]);

  // Native: ~3.5 x 4 x 2.1 units. Scale 0.25 → ~88cm tall
  return (
    <group
      position={[-1, 0.1, -1.8]}
      rotation={[0, Math.PI * 0.1, 0]}
      scale={[0.25, 0.25, 0.25]}
    >
      <primitive object={scene} />
    </group>
  );
}
