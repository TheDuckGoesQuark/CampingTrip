import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useInteractionStore } from '../../../store/interactionStore';
import { asset } from '../../../utils/assetPath';

// Credit: "Focusrite Scarlett Solo Interface" on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/focusrite-scarlett-solo-interface-f09111be4a5c48228c3b898965d62bba

useGLTF.preload(asset('models/focusrite_scarlett_solo_interface.glb'), true);

export default function ScarlettSolo() {
  const { scene } = useGLTF(asset('models/focusrite_scarlett_solo_interface.glb'), true);
  const lightMeshes = useRef<
    { mat: THREE.MeshStandardMaterial; color: THREE.Color; intensity: number }[]
  >([]);

  const hoveredId = useInteractionStore((s) => s.hoveredId);
  const focusedId = useInteractionStore((s) => s.focusedId);
  const isHighlighted = hoveredId === 'scarlett' || focusedId === 'scarlett';

  // Initial setup: find emissive meshes, save originals, turn lights off
  useEffect(() => {
    const lights: typeof lightMeshes.current = [];

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;

      const mats = Array.isArray(child.material)
        ? child.material
        : [child.material];
      mats.forEach((mat) => {
        if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
        const stdMat = mat as THREE.MeshStandardMaterial;

        if (stdMat.emissiveMap) {
          lights.push({
            mat: stdMat,
            color: stdMat.emissive.clone(),
            intensity: stdMat.emissiveIntensity || 1,
          });
          // Mark so InteractiveObject skips these
          child.userData.skipHighlight = true;
          // Turn lights off by default
          stdMat.emissiveIntensity = 0;
          stdMat.needsUpdate = true;
        }
      });
    });

    lightMeshes.current = lights;
  }, [scene]);

  // Toggle lights on/off with hover
  useEffect(() => {
    lightMeshes.current.forEach(({ mat, color, intensity }) => {
      if (isHighlighted) {
        mat.emissive.copy(color);
        mat.emissiveIntensity = intensity;
      } else {
        mat.emissiveIntensity = 0;
      }
      mat.needsUpdate = true;
    });
  }, [isHighlighted]);

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
