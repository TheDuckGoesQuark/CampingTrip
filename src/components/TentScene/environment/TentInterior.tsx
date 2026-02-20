import { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const TENT_SCALE = 4;

useGLTF.preload('/models/tent.glb');

export default function TentInterior() {
  const { scene } = useGLTF('/models/tent.glb');
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Fix moiré: reduce normal map intensity and enable anisotropic filtering
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

    // Hide the bed (Krovat) — we don't need it
    const bed = scene.getObjectByName('Krovat');
    if (bed) bed.visible = false;

    // Door left visible — it includes the front awning/canopy structure
  }, [scene]);

  return (
    <group
      ref={groupRef}
      scale={[TENT_SCALE, TENT_SCALE, TENT_SCALE]}
      position={[0, 0.59 * TENT_SCALE, 0]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <primitive object={scene} />
    </group>
  );
}
