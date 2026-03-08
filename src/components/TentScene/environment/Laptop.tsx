import { useEffect, useRef, useCallback } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useSceneStore } from '../../../store/sceneStore';
import { useInteractionStore } from '../../../store/interactionStore';
import SceneLabel from '../SceneLabel';
import { asset, DRACO_PATH } from '../../../utils/assetPath';

// Credit: "Laptop" on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/laptop-7d870e900889481395b4a575b9fa8c3e

useGLTF.preload(asset('models/laptop.glb'), DRACO_PATH);
useTexture.preload(asset('images/logo.webp'));

// Resting transform (inside tent)
const REST_POS: [number, number, number] = [-1.6, 0.67, -0.85];
const REST_ROT: [number, number, number] = [-0.2, Math.PI * 0.3, 0.15];
const REST_SCALE: [number, number, number] = [0.045, 0.045, 0.045];

// Focused transform (screen fills camera view — lower and further from camera)
const FOCUS_POS: [number, number, number] = [0, 1.7, 0.8];
const FOCUS_ROT: [number, number, number] = [-0.1, 0, 0];
const FOCUS_SCALE: [number, number, number] = [0.08, 0.08, 0.08];

interface Props {
  screenOn: boolean;
}

export default function Laptop({ screenOn }: Props) {
  const { scene } = useGLTF(asset('models/laptop.glb'), DRACO_PATH);
  const logoTexture = useTexture(asset('images/logo.webp'));
  const groupRef = useRef<THREE.Group>(null);
  const logoMeshRef = useRef<THREE.Mesh>(null);
  const screenMeshes = useRef<THREE.Mesh[]>([]);
  const lightMeshes = useRef<
    { mat: THREE.MeshStandardMaterial; color: THREE.Color; intensity: number }[]
  >([]);
  const screenCenter = useRef(new THREE.Vector3(0, 12, -3));

  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const setLaptopFocused = useSceneStore((s) => s.setLaptopFocused);

  // Interaction store for "projects" logo hover/focus/label
  const hoveredId = useInteractionStore((s) => s.hoveredId);
  const focusedId = useInteractionStore((s) => s.focusedId);
  const setHovered = useInteractionStore((s) => s.setHovered);
  const isLogoHighlighted = hoveredId === 'projects' || focusedId === 'projects';
  const isLaptopHighlighted = hoveredId === 'laptop' || focusedId === 'laptop';

  // Initial setup: find screen meshes and emissive lights, configure materials
  useEffect(() => {
    const screens: THREE.Mesh[] = [];
    const lights: typeof lightMeshes.current = [];

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;

      const nameLC = child.name.toLowerCase();
      // Only detect screens by name — colour heuristic was too aggressive
      // and misclassified body/bezel meshes as screen panels
      const isScreen =
        nameLC.includes('screen') ||
        nameLC.includes('display') ||
        nameLC.includes('monitor') ||
        nameLC.includes('lcd');

      if (isScreen) {
        screens.push(child);
        // Prevent InteractiveObject from touching screen emissive
        child.userData.skipHighlight = true;
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat?.isMeshStandardMaterial) {
          mat.color.set(0x0a0a0e);
          mat.emissive.set(0x000000);
          mat.emissiveIntensity = 0;
          mat.needsUpdate = true;
        }
      } else {
        // Non-screen meshes (body, keyboard, bezel): fix dark materials
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat?.isMeshStandardMaterial) {
          mat.envMapIntensity = 3.0;
          mat.metalness = Math.min(mat.metalness, 0.65);
          mat.roughness = Math.max(mat.roughness, 0.35);

          // Emissive-mapped meshes (LEDs, indicators): toggle on hover
          if (mat.emissiveMap) {
            lights.push({
              mat,
              color: mat.emissive.clone(),
              intensity: mat.emissiveIntensity || 1,
            });
            child.userData.skipHighlight = true;
            mat.emissiveIntensity = 0;
          }

          const hsl = { h: 0, s: 0, l: 0 };
          mat.color.getHSL(hsl);
          if (hsl.l < 0.08) {
            mat.color.setHSL(hsl.h, hsl.s, 0.25);
          }
          mat.needsUpdate = true;
        }
      }
    });

    screenMeshes.current = screens;
    lightMeshes.current = lights;

    // Compute screen center for logo placement.
    // Force GLTF internal transforms to resolve first — on first load,
    // Three.js hasn't rendered yet so matrixWorld values are stale.
    // Then convert from world space → group-local space so the result
    // is consistent regardless of the group's current position.
    if (screens.length > 0) {
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3();
      screens.forEach((m) => box.expandByObject(m));
      const worldCenter = box.getCenter(new THREE.Vector3());

      if (groupRef.current) {
        groupRef.current.updateMatrixWorld(true);
        screenCenter.current.copy(worldCenter);
        groupRef.current.worldToLocal(screenCenter.current);
      } else {
        screenCenter.current.copy(worldCenter);
      }

    }
  }, [scene]);

  // Toggle emissive lights (LEDs, indicators) on hover — same pattern as Scarlett Solo / MPK
  useEffect(() => {
    lightMeshes.current.forEach(({ mat, color, intensity }) => {
      if (isLaptopHighlighted) {
        mat.emissive.copy(color);
        mat.emissiveIntensity = intensity;
      } else {
        mat.emissiveIntensity = 0;
      }
    });
  }, [isLaptopHighlighted]);

  // Set initial transform imperatively (so GSAP can animate without React overriding)
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...REST_POS);
    groupRef.current.rotation.set(...REST_ROT);
    groupRef.current.scale.set(...REST_SCALE);
  }, []);

  // Toggle screen appearance when screenOn changes
  useEffect(() => {
    screenMeshes.current.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat?.isMeshStandardMaterial) return;
      if (screenOn) {
        mat.color.set(0x1a2a44);
        mat.emissive.set(0x6688cc);
        mat.emissiveIntensity = 1.2;
      } else {
        mat.color.set(0x0a0a0e);
        mat.emissive.set(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }, [screenOn]);

  // GSAP focus / unfocus animation
  useEffect(() => {
    if (!groupRef.current) return;
    const g = groupRef.current;

    if (laptopFocused) {
      gsap.to(g.position, {
        x: FOCUS_POS[0], y: FOCUS_POS[1], z: FOCUS_POS[2],
        duration: 1, ease: 'power2.inOut',
      });
      gsap.to(g.rotation, {
        x: FOCUS_ROT[0], y: FOCUS_ROT[1], z: FOCUS_ROT[2],
        duration: 1, ease: 'power2.inOut',
      });
      gsap.to(g.scale, {
        x: FOCUS_SCALE[0], y: FOCUS_SCALE[1], z: FOCUS_SCALE[2],
        duration: 1, ease: 'power2.inOut',
      });
    } else {
      gsap.to(g.position, {
        x: REST_POS[0], y: REST_POS[1], z: REST_POS[2],
        duration: 0.8, ease: 'power2.inOut',
      });
      gsap.to(g.rotation, {
        x: REST_ROT[0], y: REST_ROT[1], z: REST_ROT[2],
        duration: 0.8, ease: 'power2.inOut',
      });
      gsap.to(g.scale, {
        x: REST_SCALE[0], y: REST_SCALE[1], z: REST_SCALE[2],
        duration: 0.8, ease: 'power2.inOut',
      });
    }
  }, [laptopFocused]);

  const handleLogoActivate = useCallback(() => {
    useSceneStore.getState().setFocusTarget('default');
    setLaptopFocused(true);
  }, [setLaptopFocused]);

  const handleLogoClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      handleLogoActivate();
    },
    [handleLogoActivate],
  );

  // Keyboard activation via accessibility overlay
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.id === 'projects' && screenOn && !laptopFocused) {
        handleLogoActivate();
      }
    };
    window.addEventListener('scene-activate', handler);
    return () => window.removeEventListener('scene-activate', handler);
  }, [screenOn, laptopFocused, handleLogoActivate]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />

      {/* Logo icon on screen — always mounted to avoid geometry/material
          creation at toggle time; visibility toggled instead */}
      <group
        visible={screenOn}
        position={[
          screenCenter.current.x,
          screenCenter.current.y,
          screenCenter.current.z + 2,
        ]}
      >
        <mesh
          ref={logoMeshRef}
          onClick={handleLogoClick}
          onPointerEnter={(e: any) => {
            e.stopPropagation();
            setHovered('projects');
            document.body.style.cursor = 'pointer';
            if (logoMeshRef.current) logoMeshRef.current.scale.setScalar(1.15);
          }}
          onPointerLeave={(e: any) => {
            e.stopPropagation();
            setHovered(null);
            document.body.style.cursor = 'auto';
            if (logoMeshRef.current) logoMeshRef.current.scale.setScalar(1);
          }}
        >
          <planeGeometry args={[7, 7]} />
          <meshBasicMaterial
            map={logoTexture}
            transparent
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* "Projects" label — shown on hover or keyboard focus */}
        {isLogoHighlighted && !laptopFocused && (
          <SceneLabel text="Projects" position={[-5, 10, 10]} />
        )}
      </group>
    </group>
  );
}
