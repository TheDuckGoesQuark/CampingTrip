import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Credit: "Moka Pot" on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/moka-pot-2ca52d750d95471a953fb2c9eb577da6

useGLTF.preload('/models/moka_pot.glb');

export default function MokaPot() {
  const { scene } = useGLTF('/models/moka_pot.glb');

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        mats.forEach((mat) => {
          if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial)
            return;
          const stdMat = mat as THREE.MeshStandardMaterial;

          // The scene uses Environment preset="night" at 0.3 intensity —
          // metallic surfaces reflect almost nothing from it. Fix:
          // 1. Lower metalness so scene lights (warm ambient, hemisphere,
          //    campfire) contribute a diffuse component
          // 2. Add a warm emissive to simulate ambient light bounce
          // 3. Bump roughness slightly for softer, broader reflections
          // 4. Keep moderate envMapIntensity for remaining specular highlights

          stdMat.envMapIntensity = 3.0;
          stdMat.metalness = Math.min(stdMat.metalness, 0.65);
          stdMat.roughness = Math.max(stdMat.roughness, 0.35);

          // Warm emissive simulates ambient tent lighting on metal
          stdMat.emissive = new THREE.Color(0x331a08);
          stdMat.emissiveIntensity = 0.25;

          // Lighten pure-black base colors so there's something to shade
          const hsl = { h: 0, s: 0, l: 0 };
          stdMat.color.getHSL(hsl);
          if (hsl.l < 0.08) {
            stdMat.color.setHSL(hsl.h, hsl.s, 0.3);
          }

          stdMat.needsUpdate = true;
        });
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
