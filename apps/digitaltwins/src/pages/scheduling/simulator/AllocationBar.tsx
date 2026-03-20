import { useCallback, useRef, useState } from 'react';
import { Text } from '@mantine/core';
import type { QueueDef } from './simulation';
import '../notebook.css';

/**
 * Vertical stacked bar showing time allocation per project.
 *
 * Each segment's height ∝ its allocation fraction.
 * Drag the boundary between two segments to redistribute time.
 */

interface AllocationBarProps {
  queueDefs: QueueDef[];
  allocation: Record<string, number>;
  onChange: (allocation: Record<string, number>) => void;
  width?: number;
}

const MIN_FRAC = 0.05;

export function AllocationBar({
  queueDefs,
  allocation,
  onChange,
  width = 32,
}: AllocationBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  // Build ordered fractions
  const fracs = queueDefs.map((d) => allocation[d.id] ?? 1 / queueDefs.length);
  const cumulative = fracs.reduce<number[]>((acc, f, i) => {
    acc.push((acc[i - 1] ?? 0) + f);
    return acc;
  }, []);

  const onPointerDown = useCallback(
    (boundaryIndex: number, e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(boundaryIndex);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging === null) return;
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const totalH = rect.height;
      const targetFrac = Math.max(0, Math.min(1, y / totalH));

      // dragging boundary `i` means the divider between segment i and i+1
      // Cumulative up to i = targetFrac
      // Compute new fractions
      const newFracs = [...fracs];
      const n = queueDefs.length;

      // Sum of segments before the dragged boundary
      const sumBefore = fracs.slice(0, dragging).reduce((s, v) => s + v, 0);
      // Sum of segments after the dragged boundary + 1
      const sumAfter = fracs.slice(dragging + 2).reduce((s, v) => s + v, 0);

      // The two segments adjacent to the boundary
      const aboveFrac = Math.max(MIN_FRAC, targetFrac - sumBefore);
      const belowFrac = Math.max(MIN_FRAC, 1 - sumAfter - sumBefore - aboveFrac);

      // Check minimums — if either would go below MIN_FRAC, clamp
      if (aboveFrac < MIN_FRAC || belowFrac < MIN_FRAC) return;

      newFracs[dragging] = aboveFrac;
      newFracs[dragging + 1] = belowFrac;

      // Normalise
      const total = newFracs.reduce((s, v) => s + v, 0);
      const next: Record<string, number> = {};
      for (let i = 0; i < n; i++) {
        next[queueDefs[i]!.id] = newFracs[i]! / total;
      }
      onChange(next);
    },
    [dragging, fracs, queueDefs, onChange],
  );

  const onPointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{
        position: 'relative',
        width,
        height: '100%',
        borderRadius: 6,
        overflow: 'hidden',
        border: '1.5px solid #d0cdc4',
        touchAction: 'none',
        cursor: dragging !== null ? 'row-resize' : undefined,
      }}
    >
      {queueDefs.map((def, i) => {
        const top = i === 0 ? 0 : cumulative[i - 1]!;
        const height = fracs[i]!;
        const pct = Math.round(fracs[i]! * 100);

        return (
          <div
            key={def.id}
            style={{
              position: 'absolute',
              top: `${top * 100}%`,
              left: 0,
              right: 0,
              height: `${height * 100}%`,
              background: def.color + '30',
              borderBottom: i < queueDefs.length - 1 ? `1.5px solid ${def.color}44` : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Text
              className="notebook-text"
              fw={600}
              style={{
                fontSize: pct < 15 ? 10 : 13,
                color: def.color,
                lineHeight: 1,
                textAlign: 'center',
                userSelect: 'none',
              }}
            >
              {pct}%
            </Text>
          </div>
        );
      })}

      {/* Drag handles between segments */}
      {queueDefs.slice(0, -1).map((_, i) => {
        const top = cumulative[i]!;
        return (
          <div
            key={`handle-${i}`}
            onPointerDown={(e) => onPointerDown(i, e)}
            style={{
              position: 'absolute',
              top: `${top * 100}%`,
              left: 0,
              right: 0,
              height: 10,
              marginTop: -5,
              cursor: 'row-resize',
              zIndex: 2,
              // Visible handle line
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{
              width: '60%',
              height: 2,
              borderRadius: 1,
              background: dragging === i ? '#2c3e6b' : '#bbb8ae',
              transition: 'background 100ms',
            }} />
          </div>
        );
      })}
    </div>
  );
}
