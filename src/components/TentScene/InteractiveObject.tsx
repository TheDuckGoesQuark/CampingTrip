import { useRef, useCallback, useEffect, MutableRefObject } from 'react';
import * as THREE from 'three';
import { useInteractionStore } from '../../store/interactionStore';
import SceneLabel from './SceneLabel';

interface Props {
  id: string;
  children: React.ReactNode;
  label: string;
  labelPosition: [number, number, number];
  onActivate?: () => void;
}

export default function InteractiveObject({
  id,
  children,
  label,
  labelPosition,
  onActivate,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>() as MutableRefObject<ReturnType<typeof setTimeout> | undefined>;
  const originalEmissives = useRef<
    Map<string, { color: THREE.Color; intensity: number }>
  >(new Map());

  const hoveredId = useInteractionStore((s) => s.hoveredId);
  const focusedId = useInteractionStore((s) => s.focusedId);
  const setHovered = useInteractionStore((s) => s.setHovered);

  const isHighlighted = hoveredId === id || focusedId === id;

  // Clean up leave timer on unmount
  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  // Listen for keyboard activation events from the accessibility overlay
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.id === id) onActivate?.();
    };
    window.addEventListener('scene-activate', handler);
    return () => window.removeEventListener('scene-activate', handler);
  }, [id, onActivate]);

  // Apply / remove warm highlight on child meshes
  useEffect(() => {
    if (!groupRef.current) return;

    if (isHighlighted) {
      groupRef.current.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || !child.material) return;
        if (child.userData?.skipHighlight) return;
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        mats.forEach((mat, i) => {
          if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial)
            return;
          const key = `${child.uuid}-${i}`;
          if (!originalEmissives.current.has(key)) {
            originalEmissives.current.set(key, {
              color: mat.emissive.clone(),
              intensity: mat.emissiveIntensity,
            });
          }
          mat.emissive.set(0x442200);
          mat.emissiveIntensity = 0.35;
        });
      });
    } else {
      // Restore originals
      groupRef.current.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || !child.material) return;
        if (child.userData?.skipHighlight) return;
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        mats.forEach((mat, i) => {
          const key = `${child.uuid}-${i}`;
          const orig = originalEmissives.current.get(key);
          if (orig) {
            mat.emissive.copy(orig.color);
            mat.emissiveIntensity = orig.intensity;
          }
        });
      });
      originalEmissives.current.clear();
    }
  }, [isHighlighted]);

  const handlePointerEnter = useCallback(
    (e: THREE.Event) => {
      (e as any).stopPropagation();
      // Cancel any pending leave — avoids flicker when pointer moves
      // between child meshes within the same group
      clearTimeout(leaveTimer.current);
      setHovered(id);
      document.body.style.cursor = 'pointer';
    },
    [id, setHovered],
  );

  const handlePointerLeave = useCallback(
    (e: THREE.Event) => {
      (e as any).stopPropagation();
      // Small delay so rapid enter→leave→enter between child meshes
      // doesn't flicker the highlight on/off
      leaveTimer.current = setTimeout(() => {
        // Only clear if we're still the hovered item — another element
        // (e.g. the logo inside the laptop) may have claimed hover already
        if (useInteractionStore.getState().hoveredId === id) {
          setHovered(null);
          document.body.style.cursor = 'auto';
        }
      }, 50);
    },
    [setHovered],
  );

  const handleClick = useCallback(
    (e: THREE.Event) => {
      (e as any).stopPropagation();
      onActivate?.();
    },
    [onActivate],
  );

  return (
    <group
      ref={groupRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      {children}
      {isHighlighted && (
        <SceneLabel text={label} position={labelPosition} />
      )}
    </group>
  );
}
