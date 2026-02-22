import { useRef, useCallback, useEffect, MutableRefObject } from 'react';
import * as THREE from 'three';
import { useInteractionStore } from '../../store/interactionStore';
import SceneLabel from './SceneLabel';
import { applyHighlight, removeHighlight, type EmissiveCache } from '../../utils/highlight';

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
  const emissiveCache = useRef<EmissiveCache>(new Map());

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
      applyHighlight(groupRef.current, emissiveCache.current);
    } else {
      removeHighlight(groupRef.current, emissiveCache.current);
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
