import { useGLTF, useTexture } from "@react-three/drei";
import gsap from "gsap";
import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { requestOpen } from "../../../routing/navigation";
import { useInteractionStore } from "../../../store/interactionStore";
import { useSceneStore } from "../../../store/sceneStore";
import { asset, DRACO_PATH } from "../../../utils/assetPath";
import SceneLabel from "../SceneLabel";

// Credit: "Laptop" on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/laptop-7d870e900889481395b4a575b9fa8c3e

useGLTF.preload(asset("models/laptop.glb"), DRACO_PATH);
useTexture.preload(asset("images/logo.webp"));

// Resting transform (inside tent)
const REST_POS: [number, number, number] = [-1.6, 0.67, -0.85];
const REST_ROT: [number, number, number] = [-0.2, Math.PI * 0.3, 0.15];
const REST_SCALE: [number, number, number] = [0.045, 0.045, 0.045];

/**
 * Where the logo sits on the screen panel, in group-local units — the panel's own
 * centre, a hair in front of its front face. Derived from laptop.glb rather than
 * measured at runtime: the screen is a sub-node carrying both a ~100x scale and a
 * 180-degree Y rotation, so its extent works out at x -15.2..15.2, y 0.46..20.56,
 * front face z -9.89.
 *
 * The depth matters more than it looks. REST_ROT turns the group 54 degrees about
 * Y, which maps local +Z onto world (0.81, 0, 0.59) — so any gap between the logo
 * and the panel projects sideways, and reads as the icon drifting right rather
 * than as it floating forward.
 */
const LOGO_POS: [number, number, number] = [0, 10.5, -9.8];

// Focused transform (screen fills camera view — lower and further from camera)
const FOCUS_POS: [number, number, number] = [0, 1.7, 0.8];
const FOCUS_ROT: [number, number, number] = [-0.1, 0, 0];
const FOCUS_SCALE: [number, number, number] = [0.08, 0.08, 0.08];

/** One in-and-out of the idle hint's breath, in seconds. */
const BREATH_SECONDS = 1.6;

interface Props {
  screenOn: boolean;
  /** Draw attention to the laptop: the visitor has gone still without finding it. */
  hint?: boolean;
}

export default function Laptop({ screenOn, hint = false }: Props) {
  const { scene } = useGLTF(asset("models/laptop.glb"), DRACO_PATH);
  const logoTexture = useTexture(asset("images/logo.webp"));
  const groupRef = useRef<THREE.Group>(null);
  const logoMeshRef = useRef<THREE.Mesh>(null);
  const screenMeshes = useRef<THREE.Mesh[]>([]);
  const lightMeshes = useRef<
    { mat: THREE.MeshStandardMaterial; color: THREE.Color; intensity: number }[]
  >([]);
  const laptopFocused = useSceneStore((s) => s.laptopFocused);

  // Interaction store for "projects" logo hover/focus/label
  const hoveredId = useInteractionStore((s) => s.hoveredId);
  const focusedId = useInteractionStore((s) => s.focusedId);
  const setHovered = useInteractionStore((s) => s.setHovered);
  const isLogoHighlighted = hoveredId === "projects" || focusedId === "projects";
  const isLaptopHighlighted = hoveredId === "laptop" || focusedId === "laptop";
  const reducedMotion = useReducedMotion();

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
        nameLC.includes("screen") ||
        nameLC.includes("display") ||
        nameLC.includes("monitor") ||
        nameLC.includes("lcd");

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
  }, [scene]);

  /**
   * The laptop's own indicator LEDs. One effect owns them, because the two things
   * that want to would otherwise fight: hover lights them steadily (the pattern
   * the Scarlett Solo and the MPK also use), and the idle hint breathes them the
   * way a sleeping machine does. Hover wins — a visitor already pointing at the
   * laptop has found it, and does not need telling.
   *
   * Only the LEDs, which carry `skipHighlight`, so nothing here can collide with
   * the warm emissive `applyHighlight` puts on the body meshes.
   */
  useEffect(() => {
    const lights = lightMeshes.current;
    const dark = () => {
      lights.forEach(({ mat }) => {
        mat.emissiveIntensity = 0;
      });
    };
    const steady = () => {
      lights.forEach(({ mat, color, intensity }) => {
        mat.emissive.copy(color);
        mat.emissiveIntensity = intensity;
      });
    };

    if (isLaptopHighlighted) {
      steady();
      return dark;
    }
    if (!hint) {
      dark();
      return;
    }
    // Reduced motion still gets the hint, just without the breathing.
    if (reducedMotion) {
      steady();
      return dark;
    }

    const breath = { level: 0 };
    lights.forEach(({ mat, color }) => mat.emissive.copy(color));
    const tween = gsap.to(breath, {
      level: 1,
      duration: BREATH_SECONDS,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      onUpdate: () => {
        lights.forEach(({ mat, intensity }) => {
          mat.emissiveIntensity = breath.level * intensity;
        });
      },
    });
    return () => {
      tween.kill();
      dark();
    };
  }, [hint, isLaptopHighlighted, reducedMotion]);

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
        x: FOCUS_POS[0],
        y: FOCUS_POS[1],
        z: FOCUS_POS[2],
        duration: 1,
        ease: "power2.inOut",
      });
      gsap.to(g.rotation, {
        x: FOCUS_ROT[0],
        y: FOCUS_ROT[1],
        z: FOCUS_ROT[2],
        duration: 1,
        ease: "power2.inOut",
      });
      gsap.to(g.scale, {
        x: FOCUS_SCALE[0],
        y: FOCUS_SCALE[1],
        z: FOCUS_SCALE[2],
        duration: 1,
        ease: "power2.inOut",
      });
    } else {
      gsap.to(g.position, {
        x: REST_POS[0],
        y: REST_POS[1],
        z: REST_POS[2],
        duration: 0.8,
        ease: "power2.inOut",
      });
      gsap.to(g.rotation, {
        x: REST_ROT[0],
        y: REST_ROT[1],
        z: REST_ROT[2],
        duration: 0.8,
        ease: "power2.inOut",
      });
      gsap.to(g.scale, {
        x: REST_SCALE[0],
        y: REST_SCALE[1],
        z: REST_SCALE[2],
        duration: 0.8,
        ease: "power2.inOut",
      });
    }
  }, [laptopFocused]);

  // Opening the blog is a navigation, not a direct state change. The laptop lives
  // inside the R3F Canvas (no router access), so it asks to open the blog through
  // the overlayNavigation emitter, which SceneRoot subscribes to.
  const handleLogoActivate = useCallback(() => {
    requestOpen.blog();
  }, []);

  const handleLogoClick = useCallback(
    (e: any) => {
      if (!screenOn) return;
      e.stopPropagation();
      handleLogoActivate();
    },
    [screenOn, handleLogoActivate],
  );

  return (
    <group ref={groupRef}>
      <primitive object={scene} />

      {/* Logo icon on screen — always mounted to avoid geometry/material
          creation at toggle time; visibility toggled instead */}
      <group visible={screenOn} position={LOGO_POS}>
        <mesh
          ref={logoMeshRef}
          onClick={handleLogoClick}
          onPointerEnter={(e: any) => {
            if (!screenOn) return;
            e.stopPropagation();
            setHovered("projects");
            document.body.style.cursor = "pointer";
            if (logoMeshRef.current) logoMeshRef.current.scale.setScalar(1.15);
          }}
          onPointerLeave={(e: any) => {
            e.stopPropagation();
            setHovered(null);
            document.body.style.cursor = "auto";
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
