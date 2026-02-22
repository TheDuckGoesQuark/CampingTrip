import { useCallback, useEffect, useRef, useState } from 'react';
import { useTimeStore, getTimeOfDay } from '../../store/timeStore';

const SIZE = 120;
const PAD = 18;
const RADIUS = SIZE - PAD * 2;
const CX = PAD;
const CY = PAD;

/** Point on the quarter-circle arc at parameter t ∈ [0,1].
 *  t=0 → bottom of arc,  t=1 → right of arc. */
function arcPoint(t: number): { x: number; y: number } {
  const angle = (Math.PI / 2) * (1 - t);
  return {
    x: CX + RADIUS * Math.cos(angle),
    y: CY + RADIUS * Math.sin(angle),
  };
}

// Key points along the arc with labels
const KEY_LABELS: { t: number; label: string }[] = [
  { t: 0, label: '6am' },
  { t: 0.25, label: 'noon' },
  { t: 0.5, label: '6pm' },
  { t: 0.75, label: '12am' },
];

/** Convert a page-space pointer position to arc progress (0–1). */
function pointerToProgress(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
): number {
  // Pointer relative to the arc center (CX, CY) in SVG coords
  const svgX = clientX - containerRect.left - 14; // 14 = container left offset
  const svgY = clientY - containerRect.top - 14;
  const dx = svgX - CX;
  const dy = svgY - CY;

  // atan2 gives angle from center; convert to arc parameter
  // Arc goes from bottom (angle = π/2) to right (angle = 0)
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += Math.PI * 2;

  // Clamp to the quarter-circle range [0, π/2]
  angle = Math.max(0, Math.min(Math.PI / 2, angle));

  // Convert: angle π/2 → t=0 (bottom), angle 0 → t=1 (right)
  return 1 - angle / (Math.PI / 2);
}

export default function TimeOfDayArc() {
  const progress = useTimeStore((s) => s.progress);
  const setProgress = useTimeStore((s) => s.setProgress);
  const setManual = useTimeStore((s) => s.setManual);

  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isDaytime, timeStr } = getTimeOfDay(progress);
  const pos = arcPoint(progress);

  // Arc SVG path from bottom to right
  const arcPath = `M ${CX} ${CY + RADIUS} A ${RADIUS} ${RADIUS} 0 0 0 ${CX + RADIUS} ${CY}`;

  // ─── Drag handlers ──────────────────────────────────────────
  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      setDragging(true);
      setManual(true);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setProgress(pointerToProgress(e.clientX, e.clientY, rect));
      }
    },
    [setManual, setProgress],
  );

  const onDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setProgress(pointerToProgress(e.clientX, e.clientY, rect));
    },
    [dragging, setProgress],
  );

  const endDrag = useCallback(() => {
    setDragging(false);
  }, []);

  // Swallow native touch events so CameraController (on window) doesn't react
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const stop = (e: TouchEvent) => e.stopPropagation();
    el.addEventListener('touchstart', stop, { passive: true });
    el.addEventListener('touchmove', stop, { passive: true });
    el.addEventListener('touchend', stop, { passive: true });
    return () => {
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('touchmove', stop);
      el.removeEventListener('touchend', stop);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 14,
        left: 14,
        width: SIZE + 40,
        height: SIZE + 10,
        zIndex: 50,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={startDrag}
      onPointerMove={onDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <svg
        width={SIZE + 40}
        height={SIZE + 10}
        viewBox={`0 0 ${SIZE + 40} ${SIZE + 10}`}
        fill="none"
        style={{
          transition: dragging ? 'none' : 'filter 0.3s',
          filter: dragging ? 'drop-shadow(0 0 8px rgba(255,200,60,0.4))' : 'none',
        }}
      >
        {/* Dashed arc track */}
        <path
          d={arcPath}
          stroke="rgba(255, 220, 150, 0.25)"
          strokeWidth={dragging ? 2.5 : 1.5}
          strokeDasharray="3 6"
          strokeLinecap="round"
        />

        {/* Key-point tick marks and labels */}
        {KEY_LABELS.map(({ t, label }) => {
          const p = arcPoint(t);
          const angle = (Math.PI / 2) * (1 - t);
          const ox = Math.cos(angle) * 10;
          const oy = Math.sin(angle) * 10;
          return (
            <g key={t}>
              <circle
                cx={p.x}
                cy={p.y}
                r={2}
                fill="rgba(255, 220, 150, 0.2)"
              />
              <text
                x={p.x + ox}
                y={p.y + oy + 3}
                fill="rgba(255, 220, 150, 0.35)"
                fontSize={9}
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="start"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Glow behind celestial body */}
        <circle
          cx={pos.x}
          cy={pos.y}
          r={dragging ? 16 : 12}
          fill={isDaytime
            ? 'rgba(255, 210, 80, 0.12)'
            : 'rgba(180, 200, 255, 0.08)'}
          style={{ transition: 'r 0.2s' }}
        />

        {/* Sun / Moon emoji via foreignObject */}
        <foreignObject
          x={pos.x - 12}
          y={pos.y - 12}
          width={24}
          height={24}
        >
          <div
            style={{
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: dragging ? 18 : 16,
              lineHeight: 1,
              transition: 'font-size 0.2s',
              filter: isDaytime
                ? 'drop-shadow(0 0 6px rgba(255,200,60,0.7))'
                : 'drop-shadow(0 0 6px rgba(180,200,255,0.5))',
            }}
          >
            {isDaytime ? '☀️' : '🌙'}
          </div>
        </foreignObject>

        {/* Time readout near the icon */}
        <text
          x={pos.x + 16}
          y={pos.y - 8}
          fill="rgba(255, 220, 150, 0.6)"
          fontSize={11}
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.03em"
        >
          {timeStr}
        </text>
      </svg>
    </div>
  );
}
