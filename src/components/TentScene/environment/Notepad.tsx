import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useSceneStore } from '../../../store/sceneStore';
import { asset } from '../../../utils/assetPath';

// Credit: "Notepad" on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/notepadb-0b30d2efe63f41b0a812904b610fe577

useGLTF.preload(asset('models/notepadb.glb'), true);

// Resting transform (inside tent)
const REST_POS: [number, number, number] = [-0.7, 0.4, -0.7];
const REST_ROT: [number, number, number] = [0.1, Math.PI * 0.48, 0.3];
const REST_SCALE: [number, number, number] = [0.004, 0.004, 0.004];

// Focused transform (centered in front of camera, angled toward viewer)
const FOCUS_POS: [number, number, number] = [0, 1.8, 1.2];
const FOCUS_ROT: [number, number, number] = [-0.3, 0, 0];
const FOCUS_SCALE: [number, number, number] = [0.012, 0.012, 0.012];

export default function Notepad() {
  const { scene } = useGLTF(asset('models/notepadb.glb'), true);
  const groupRef = useRef<THREE.Group>(null);
  const notepadFocused = useSceneStore((s) => s.notepadFocused);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  // Set initial transform imperatively (so GSAP can animate without React overriding)
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...REST_POS);
    groupRef.current.rotation.set(...REST_ROT);
    groupRef.current.scale.set(...REST_SCALE);
  }, []);

  // GSAP focus / unfocus animation
  useEffect(() => {
    if (!groupRef.current) return;
    const g = groupRef.current;

    if (notepadFocused) {
      gsap.to(g.position, {
        x: FOCUS_POS[0], y: FOCUS_POS[1], z: FOCUS_POS[2],
        duration: 0.9, ease: 'power2.inOut',
      });
      gsap.to(g.rotation, {
        x: FOCUS_ROT[0], y: FOCUS_ROT[1], z: FOCUS_ROT[2],
        duration: 0.9, ease: 'power2.inOut',
      });
      gsap.to(g.scale, {
        x: FOCUS_SCALE[0], y: FOCUS_SCALE[1], z: FOCUS_SCALE[2],
        duration: 0.9, ease: 'power2.inOut',
      });
    } else {
      gsap.to(g.position, {
        x: REST_POS[0], y: REST_POS[1], z: REST_POS[2],
        duration: 0.7, ease: 'power2.inOut',
      });
      gsap.to(g.rotation, {
        x: REST_ROT[0], y: REST_ROT[1], z: REST_ROT[2],
        duration: 0.7, ease: 'power2.inOut',
      });
      gsap.to(g.scale, {
        x: REST_SCALE[0], y: REST_SCALE[1], z: REST_SCALE[2],
        duration: 0.7, ease: 'power2.inOut',
      });
    }
  }, [notepadFocused]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}
