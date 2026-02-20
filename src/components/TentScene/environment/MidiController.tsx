import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useInteractionStore } from '../../../store/interactionStore';

// Credit: "Akai MPK Mini MIDI Controller" on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/akai-mpk-mini-midi-controller-89eae01d0547430bb8e10110eaadaa81

useGLTF.preload('/models/akai_mpk_mini_midi_controller.glb');

export default function MidiController() {
  const { scene } = useGLTF('/models/akai_mpk_mini_midi_controller.glb');
  const lightMeshes = useRef<
    { mat: THREE.MeshStandardMaterial; color: THREE.Color; intensity: number }[]
  >([]);

  const hoveredId = useInteractionStore((s) => s.hoveredId);
  const focusedId = useInteractionStore((s) => s.focusedId);
  const isHighlighted = hoveredId === 'midi' || focusedId === 'midi';

  // Initial setup: find light meshes, save originals, turn them off
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

        // Detect light meshes: anything with meaningful emissive
        if (stdMat.emissiveIntensity > 0.1) {
          const hsl = { h: 0, s: 0, l: 0 };
          stdMat.emissive.getHSL(hsl);
          if (hsl.l > 0.05) {
            lights.push({
              mat: stdMat,
              color: stdMat.emissive.clone(),
              intensity: stdMat.emissiveIntensity,
            });
            // Mark so InteractiveObject skips these
            child.userData.skipHighlight = true;
            // Turn lights off by default
            stdMat.emissiveIntensity = 0;
            stdMat.needsUpdate = true;
          }
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

  // Native: ~11.6 x 1.5 x 6.3 units. Scale 0.03 → ~35cm wide
  return (
    <group
      position={[-1.05, 0.30, 0.4]}
      rotation={[-Math.PI * 0.01, Math.PI * 0.3, 0]}
      scale={[0.075, 0.075, 0.075]}
    >
      <primitive object={scene} />
    </group>
  );
}
