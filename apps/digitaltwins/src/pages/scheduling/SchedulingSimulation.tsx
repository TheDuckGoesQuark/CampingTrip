import { Box, Flex, Stack, Text } from '@mantine/core';
import { RoughBox } from './RoughBox';
import { RoughArrow } from './RoughArrow';
import { PROJECTS } from './demo-data';
import './notebook.css';

const INK = '#2c3e6b';
const INK_LIGHT = '#8a9bba';

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

function MachineBox({ strategies }: { strategies: { label: string; name: string }[] }) {
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

export function SchedulingSimulation() {
  return (
    <div style={{ width: '100%', height: '100%', padding: 'var(--mantine-spacing-md)' }}>
      <div
        style={{
          display: 'grid',
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
        {/* empty arrow columns */}
        <div style={{ gridColumn: 2, gridRow: 1 }} />
        <Text
          className="notebook-text"
          fw={600}
          ta="center"
          style={{ fontSize: 22, gridColumn: 3, gridRow: 1, alignSelf: 'end' }}
        >
          Selector
        </Text>
        <div style={{ gridColumn: 4, gridRow: 1 }} />
        <Text
          className="notebook-text"
          fw={600}
          ta="center"
          style={{ fontSize: 22, gridColumn: 5, gridRow: 1, alignSelf: 'end' }}
        >
          Executor
        </Text>
        <div style={{ gridColumn: 6, gridRow: 1 }} />
        <Text
          className="notebook-text"
          fw={600}
          ta="center"
          style={{ fontSize: 22, gridColumn: 7, gridRow: 1, alignSelf: 'end' }}
        >
          Done
        </Text>

        {/* ── Row 2: Content (vertically centred to tallest item) ── */}

        {/* Projects */}
        <Stack
          gap={14}
          justify="center"
          style={{ gridColumn: 1, gridRow: 2, alignSelf: 'center', maxWidth: 420 }}
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
              <Box flex={1} style={{ position: 'relative' }}>
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
        <div style={{ gridColumn: 3, gridRow: 2, alignSelf: 'center', maxWidth: 190 }}>
          <MachineBox strategies={STRATEGIES.selector} />
        </div>

        {/* Arrow: Selector → Executor */}
        <div style={{ gridColumn: 4, gridRow: 2, alignSelf: 'center', padding: '0 4px' }}>
          <RoughArrow />
        </div>

        {/* Executor */}
        <div style={{ gridColumn: 5, gridRow: 2, alignSelf: 'center', maxWidth: 190 }}>
          <MachineBox strategies={STRATEGIES.executor} />
        </div>

        {/* Arrow: Executor → Done */}
        <div style={{ gridColumn: 6, gridRow: 2, alignSelf: 'center', padding: '0 4px' }}>
          <RoughArrow />
        </div>

        {/* Done */}
        <div style={{ gridColumn: 7, gridRow: 2, alignSelf: 'center', textAlign: 'center', minWidth: 50 }}>
          <Text className="notebook-text" fw={700} style={{ fontSize: 40, color: '#2d6a4f' }}>
            &#x2713;
          </Text>
        </div>

        {/* ── Row 3: Footers ── */}
        <div style={{ gridColumn: 1, gridRow: 3 }} />
        <div style={{ gridColumn: 2, gridRow: 3 }} />
        <Text
          className="notebook-text"
          c={INK_LIGHT}
          ta="center"
          style={{ fontSize: 15, gridColumn: 3, gridRow: 3, alignSelf: 'start' }}
        >
          &ldquo;Which queue?&rdquo;
        </Text>
        <div style={{ gridColumn: 4, gridRow: 3 }} />
        <Text
          className="notebook-text"
          c={INK_LIGHT}
          ta="center"
          style={{ fontSize: 15, gridColumn: 5, gridRow: 3, alignSelf: 'start' }}
        >
          &ldquo;How long?&rdquo;
        </Text>
      </div>
    </div>
  );
}
