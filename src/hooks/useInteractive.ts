import { useState, useCallback, useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';

/**
 * Makes a 3D object feel clickable: pointer cursor on hover,
 * returns hover state + event handlers to spread on a mesh/group.
 */
export function useInteractive(name?: string) {
  const [hovered, setHovered] = useState(false);

  const onPointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const onPointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  const handlers = useMemo(
    () => ({ onPointerOver, onPointerOut }),
    [onPointerOver, onPointerOut]
  );

  return { hovered, handlers } as const;
}
