import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { asset, DRACO_PATH } from '../../../utils/assetPath';

// Credit: "Shure SM57 Dynamic Microphone" on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/shure-sm57-dynamic-microphone-ec2dc94e022547beadee622b1ff34a5d

useGLTF.preload(asset('models/shure_sm57_dynamic_microphone.glb'), DRACO_PATH);

export default function ShureMic() {
  const { scene } = useGLTF(asset('models/shure_sm57_dynamic_microphone.glb'), DRACO_PATH);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  // Native: ~3.5 x 0.7 x 0.7 units. Scale 0.05 → ~17cm long
  return (
    <group
      position={[-0.6, 0.28, -0.4]}
      rotation={[0.1, Math.PI * 1.2, -0.1]}
      scale={[0.2, 0.2, 0.2]}
    >
      <primitive object={scene} />
    </group>
  );
}
