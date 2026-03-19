import { Box, Flex, Stack, Text } from '@mantine/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RoughBox } from './RoughBox';
import { RoughArrow } from './RoughArrow';
import { PROJECTS } from './demo-data';
import { interpolateScene } from './scene';
import { STEPS } from './steps';
import './notebook.css';

const INK = '#2c3e6b';
const INK_LIGHT = '#8a9bba';

// ── Spotlight overlay with SVG cutout mask ──────────────────────

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function SpotlightOverlay({
  intensity,
  cutouts,
}: {
  intensity: number;
  cutouts: Rect[];
}) {
  if (intensity <= 0.01) return null;

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <filter id="spotlight-blur">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <mask id="spotlight-mask">
          {/* White = show overlay (dark). Black = hide overlay (transparent hole). */}
          <rect width="100%" height="100%" fill="white" />
          <g filter="url(#spotlight-blur)">
            {cutouts.map((c, i) => (
              <rect
                key={i}
                x={c.x - 16}
                y={c.y - 16}
                width={c.w + 32}
                height={c.h + 32}
                rx={12}
                fill="black"
              />
            ))}
          </g>
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill={`rgba(10, 6, 18, ${intensity * 0.45})`}
        mask="url(#spotlight-mask)"
      />
    </svg>
  );
}

// ── Machine box ─────────────────────────────────────────────────

function MachineBox({
  strategies,
}: {
  strategies: { label: string; name: string }[];
}) {
  return (
    <RoughBox stroke={INK} style={{ width: '100%', padding: 8 }}>
      <Stack gap={6}>
        {strategies.map((s) => (
          <RoughBox
            key={s.label}
            stroke={INK_LIGHT}
            strokeWidth={1}
            roughness={0.9}
            style={{ padding: '4px 8px' }}
          >
            <Text className="notebook-text" ta="center" fw={600} style={{ fontSize: 22 }}>
              {s.label}
            </Text>
            <Text className="notebook-text" ta="center" c={INK_LIGHT} style={{ fontSize: 12 }}>
              {s.name}
            </Text>
          </RoughBox>
        ))}
      </Stack>
    </RoughBox>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

const STRATEGIES = {
  selector: [
    { label: 'S\u2081', name: 'Round Robin' },
    { label: 'S\u2082', name: 'Priority' },
    { label: 'S\u2083', name: 'Shortest Q' },
  ],
  executor: [
    { label: 'E\u2081', name: 'Run to finish' },
    { label: 'E\u2082', name: 'Time-boxed' },
    { label: 'E\u2083', name: 'Preemptive' },
  ],
};

function dimStyle(level: number): React.CSSProperties {
  if (level <= 0) return {};
  return { opacity: 1 - level * 0.6 };
}

/** Measure a group of elements and return a bounding box covering all of them. */
function boundingBox(elements: (HTMLElement | null)[]): Rect | null {
  const rects = elements.filter(Boolean).map((el) => el!.getBoundingClientRect());
  if (rects.length === 0) return null;
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return { x, y, w: right - x, h: bottom - y };
}

// ── Main component ──────────────────────────────────────────────

interface Props {
  scrollProgress: number;
}

export function SchedulingSimulation({ scrollProgress }: Props) {
  const scene = useMemo(() => interpolateScene(STEPS, scrollProgress), [scrollProgress]);
  const maxHighlight = Math.max(0, ...Object.values(scene.highlights));

  // Refs for spotlight cutout measurement
  const selectorHeaderRef = useRef<HTMLDivElement>(null);
  const selectorBoxRef = useRef<HTMLDivElement>(null);
  const selectorFooterRef = useRef<HTMLDivElement>(null);
  const executorHeaderRef = useRef<HTMLDivElement>(null);
  const executorBoxRef = useRef<HTMLDivElement>(null);
  const executorFooterRef = useRef<HTMLDivElement>(null);

  const [cutouts, setCutouts] = useState<Rect[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  // Measure cutout positions whenever highlights change or layout resizes
  useEffect(() => {
    function measure() {
      const rects: Rect[] = [];

      if ((scene.highlights['selector'] ?? 0) > 0.01) {
        const box = boundingBox([selectorHeaderRef.current, selectorBoxRef.current, selectorFooterRef.current]);
        if (box) rects.push(box);
      }
      if ((scene.highlights['executor'] ?? 0) > 0.01) {
        const box = boundingBox([executorHeaderRef.current, executorBoxRef.current, executorFooterRef.current]);
        if (box) rects.push(box);
      }

      setCutouts(rects);
    }

    measure();

    // Remeasure on resize
    const grid = gridRef.current;
    if (!grid) return;
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [scene.highlights]);

  return (
    <div style={{ width: '100%', height: '100%', padding: 'var(--mantine-spacing-md)', position: 'relative' }}>
      {/* SVG spotlight overlay with cutout holes */}
      <SpotlightOverlay intensity={maxHighlight} cutouts={cutouts} />

      <div
        ref={gridRef}
        style={{
          display: 'grid',
          position: 'relative',
          gridTemplateColumns: '1fr auto minmax(60px, 190px) auto minmax(60px, 190px) auto 60px',
          gridTemplateRows: 'auto auto auto',
          maxWidth: 1100,
          margin: '0 auto',
          gap: '4px 0',
        }}
      >
        {/* ── Row 1: Headers ── */}
        <Text
          className="notebook-text"
          fw={600}
          ta="center"
          style={{ fontSize: 22, gridColumn: 1, gridRow: 1, alignSelf: 'end' }}
        >
          Projects
        </Text>
        <div style={{ gridColumn: 2, gridRow: 1 }} />
        <div ref={selectorHeaderRef} style={{ gridColumn: 3, gridRow: 1, alignSelf: 'end' }}>
          <Text className="notebook-text" fw={600} ta="center" style={{ fontSize: 22 }}>
            Selector
          </Text>
        </div>
        <div style={{ gridColumn: 4, gridRow: 1 }} />
        <div ref={executorHeaderRef} style={{ gridColumn: 5, gridRow: 1, alignSelf: 'end' }}>
          <Text className="notebook-text" fw={600} ta="center" style={{ fontSize: 22 }}>
            Executor
          </Text>
        </div>
        <div style={{ gridColumn: 6, gridRow: 1 }} />
        <Text
          className="notebook-text"
          fw={600}
          ta="center"
          style={{ fontSize: 22, gridColumn: 7, gridRow: 1, alignSelf: 'end' }}
        >
          Done
        </Text>

        {/* ── Row 2: Content ── */}

        {/* Projects (dimmable) */}
        <Stack
          gap={14}
          justify="center"
          data-anchor="projects"
          style={{
            gridColumn: 1,
            gridRow: 2,
            alignSelf: 'center',
            maxWidth: 420,
            transition: 'opacity 150ms ease-out',
            ...dimStyle(scene.dims['projects'] ?? 0),
          }}
        >
          {PROJECTS.map((project) => (
            <Flex key={project.id} align="center" gap={6}>
              <Text
                className="notebook-text"
                fw={700}
                style={{ color: project.color, fontSize: 26, minWidth: 34, textAlign: 'right' }}
              >
                {project.label}
              </Text>
              <Box flex={1} style={{ position: 'relative' }} data-anchor={`queue-${project.id}`}>
                <RoughBox
                  openLeft
                  stroke={project.color}
                  fill={project.color}
                  fillStyle="dots"
                  fillWeight={0.4}
                  style={{ height: 44 }}
                >
                  <Flex justify="flex-end" align="center" gap={3} px={4} h="100%" style={{ overflow: 'hidden' }}>
                    {project.tasks.map((task) => {
                      const maxDur = 120;
                      const minW = 40;
                      const maxW = 90;
                      const w = minW + (task.duration / maxDur) * (maxW - minW);
                      return (
                        <RoughBox
                          key={task.id}
                          stroke={project.color}
                          strokeWidth={1}
                          roughness={0.7}
                          fill="#fefcf6"
                          fillStyle="solid"
                          style={{ width: w, height: 30, flexShrink: 1, minWidth: 0 }}
                        >
                          <Text
                            className="notebook-text"
                            ta="center"
                            style={{ color: project.color, fontSize: w > 55 ? 12 : 10, lineHeight: '30px' }}
                          >
                            {task.name}
                          </Text>
                        </RoughBox>
                      );
                    })}
                  </Flex>
                </RoughBox>
                <div className="queue-fade" />
              </Box>
            </Flex>
          ))}
        </Stack>

        {/* Arrow: Projects → Selector */}
        <div style={{ gridColumn: 2, gridRow: 2, alignSelf: 'center', padding: '0 4px' }}>
          <RoughArrow />
        </div>

        {/* Selector */}
        <div ref={selectorBoxRef} data-anchor="selector" style={{ gridColumn: 3, gridRow: 2, alignSelf: 'center', maxWidth: 190 }}>
          <MachineBox strategies={STRATEGIES.selector} />
        </div>

        {/* Arrow: Selector → Executor */}
        <div style={{ gridColumn: 4, gridRow: 2, alignSelf: 'center', padding: '0 4px' }}>
          <RoughArrow />
        </div>

        {/* Executor */}
        <div ref={executorBoxRef} data-anchor="executor" style={{ gridColumn: 5, gridRow: 2, alignSelf: 'center', maxWidth: 190 }}>
          <MachineBox strategies={STRATEGIES.executor} />
        </div>

        {/* Arrow: Executor → Done */}
        <div style={{ gridColumn: 6, gridRow: 2, alignSelf: 'center', padding: '0 4px' }}>
          <RoughArrow />
        </div>

        {/* Done */}
        <div data-anchor="done" style={{ gridColumn: 7, gridRow: 2, alignSelf: 'center', textAlign: 'center', minWidth: 50 }}>
          <Text className="notebook-text" fw={700} style={{ fontSize: 40, color: '#2d6a4f' }}>
            &#x2713;
          </Text>
        </div>

        {/* ── Row 3: Footers ── */}
        <div style={{ gridColumn: 1, gridRow: 3 }} />
        <div style={{ gridColumn: 2, gridRow: 3 }} />
        <div ref={selectorFooterRef} style={{ gridColumn: 3, gridRow: 3, alignSelf: 'start' }}>
          <Text className="notebook-text" c={INK_LIGHT} ta="center" style={{ fontSize: 15 }}>
            &ldquo;Which queue?&rdquo;
          </Text>
        </div>
        <div style={{ gridColumn: 4, gridRow: 3 }} />
        <div ref={executorFooterRef} style={{ gridColumn: 5, gridRow: 3, alignSelf: 'start' }}>
          <Text className="notebook-text" c={INK_LIGHT} ta="center" style={{ fontSize: 15 }}>
            &ldquo;How long?&rdquo;
          </Text>
        </div>
      </div>
    </div>
  );
}
