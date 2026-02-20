import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Credit: "Cosy Picnic Area" on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/cosy-picnic-area-0a1fc21d723e454b91314809871e1031

const SCALE = 2.88;
// Model is ~2.85 units along X (the long side). After ~83° Y rotation,
// that length runs mostly along Z. Half-length at scale:
const HALF_LENGTH = (2.85 * SCALE) / 2; // ~4.1 units

useGLTF.preload('/models/cosy_picnic_area.glb');

function applyMoireFix(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      const mat = child.material as THREE.MeshStandardMaterial;
      if (mat.normalMap) {
        mat.normalScale = new THREE.Vector2(0.3, 0.3);
        mat.normalMap.anisotropy = 16;
        mat.normalMap.minFilter = THREE.LinearMipmapLinearFilter;
        mat.normalMap.generateMipmaps = true;
      }
      if (mat.map) {
        mat.map.anisotropy = 16;
      }
    }
  });
}

export default function PicnicArea() {
  const { scene } = useGLTF('/models/cosy_picnic_area.glb');

  // Clone for the second blanket so we don't share the same scene graph
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    applyMoireFix(scene);
    applyMoireFix(clonedScene);
  }, [scene, clonedScene]);

  return (
    <>
      {/* Main blanket — near the door */}
      <group
        position={[-0.3, 0.05, -0.2]}
        rotation={[0, -Math.PI * 0.46, 0]}
        scale={[SCALE, SCALE, SCALE]}
      >
        <primitive object={scene} />
      </group>

      {/* Second blanket — closer to camera, extends the cosy floor */}
      <group
        position={[-0.3, 0.15, -1.3 + HALF_LENGTH]}
        rotation={[0, -Math.PI * 0.52, 0]}
        scale={[SCALE, SCALE, SCALE]}
      >
        <primitive object={clonedScene} />
      </group>
    </>
  );
}
