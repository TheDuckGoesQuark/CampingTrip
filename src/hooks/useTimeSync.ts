import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTimeStore, progressFromSystemClock } from '../store/timeStore';

/**
 * Syncs the timeStore to the system clock when not in manual (drag) mode.
 * Call once from a component inside the R3F Canvas (needs useFrame).
 * Updates at most once per second to avoid excessive store writes.
 */
export function useTimeSync() {
  const lastUpdate = useRef(0);

  useFrame(() => {
    const now = performance.now();
    if (now - lastUpdate.current < 1000) return; // throttle to 1 Hz
    lastUpdate.current = now;

    const { isManual, setProgress } = useTimeStore.getState();
    if (isManual) return;

    setProgress(progressFromSystemClock());
  });
}
