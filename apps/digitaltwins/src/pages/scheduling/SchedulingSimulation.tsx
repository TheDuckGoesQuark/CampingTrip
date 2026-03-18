import { Box, Flex, Stack, Text } from '@mantine/core';
import { RoughBox } from './RoughBox';
import { RoughArrow } from './RoughArrow';
import { PROJECTS } from './demo-data';
import './notebook.css';

const INK = '#2c3e6b';
const INK_LIGHT = '#8a9bba';

interface Props {
  activeStep: number;
}

export function SchedulingSimulation({ activeStep: _activeStep }: Props) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Flex direction="column" h="100%" p="md" pt="xs">
        {/* Main layout: Queues → Selector → Executor → Done */}
        <Flex flex={1} align="stretch" justify="space-around" gap={0} maw={1100} mx="auto" w="100%">
          {/* Project queues column */}
          <Stack gap={14} justify="center" style={{ flex: '1 1 0', maxWidth: 420 }}>
            <Text className="notebook-text" fw={600} style={{ fontSize: 22 }} ta="center">
              Projects
            </Text>
            {PROJECTS.map((project) => (
              <Flex key={project.id} align="center" gap={6}>
                {/* Project label */}
                <Text
                  className="notebook-text"
                  fw={700}
                  style={{
                    color: project.color,
                    fontSize: 26,
                    minWidth: 34,
                    textAlign: 'right',
                  }}
                >
                  {project.label}
                </Text>

                {/* Queue row */}
                <Box flex={1} style={{ position: 'relative' }}>
                  <RoughBox
                    openLeft
                    stroke={project.color}
                    fill={project.color}
                    fillStyle="dots"
                    fillWeight={0.4}
                    style={{ height: 44 }}
                  >
                    <Flex
                      justify="flex-end"
                      align="center"
                      gap={3}
                      px={4}
                      h="100%"
                      style={{ overflow: 'hidden' }}
                    >
                      {project.tasks.map((task) => {
                        // Width proportional to duration
                        const maxDur = 120;
                        const minW = 40;
                        const maxW = 90;
                        const w =
                          minW + (task.duration / maxDur) * (maxW - minW);
                        return (
                          <RoughBox
                            key={task.id}
                            stroke={project.color}
                            strokeWidth={1}
                            roughness={0.7}
                            fill="#fefcf6"
                            fillStyle="solid"
                            style={{
                              width: w,
                              height: 30,
                              flexShrink: 1,
                              minWidth: 0,
                            }}
                          >
                            <Text
                              className="notebook-text"
                              ta="center"
                              style={{
                                color: project.color,
                                fontSize: w > 55 ? 12 : 10,
                                lineHeight: '30px',
                              }}
                            >
                              {task.name}
                            </Text>
                          </RoughBox>
                        );
                      })}
                    </Flex>
                  </RoughBox>

                  {/* Left fade overlay */}
                  <div className="queue-fade" />
                </Box>
              </Flex>
            ))}
          </Stack>

          {/* Arrow */}
          <RoughArrow />

          {/* Selector */}
          <Stack gap={8} align="center" justify="center" style={{ flex: '1 1 0', maxWidth: 190 }}>
            <Text className="notebook-text" fw={600} style={{ fontSize: 22 }}>
              Selector
            </Text>
            <RoughBox stroke={INK} style={{ width: '100%', padding: 8 }}>
              <Stack gap={6}>
                {['S\u2081', 'S\u2082', 'S\u2083'].map((label, i) => (
                  <RoughBox
                    key={label}
                    stroke={INK_LIGHT}
                    strokeWidth={1}
                    roughness={0.9}
                    style={{ padding: '4px 8px' }}
                  >
                    <Text
                      className="notebook-text"
                      ta="center"
                      fw={600}
                      style={{ fontSize: 22 }}
                    >
                      {label}
                    </Text>
                    <Text
                      className="notebook-text"
                      ta="center"
                      c={INK_LIGHT}
                      style={{ fontSize: 12 }}
                    >
                      {['Round Robin', 'Priority', 'Shortest Q'][i]}
                    </Text>
                  </RoughBox>
                ))}
              </Stack>
            </RoughBox>
            <Text
              className="notebook-text"
              c={INK_LIGHT}
              style={{ fontSize: 15 }}
            >
              &ldquo;Which queue?&rdquo;
            </Text>
          </Stack>

          {/* Arrow */}
          <RoughArrow />

          {/* Executor */}
          <Stack gap={8} align="center" justify="center" style={{ flex: '1 1 0', maxWidth: 190 }}>
            <Text className="notebook-text" fw={600} style={{ fontSize: 22 }}>
              Executor
            </Text>
            <RoughBox stroke={INK} style={{ width: '100%', padding: 8 }}>
              <Stack gap={6}>
                {['E\u2081', 'E\u2082', 'E\u2083'].map((label, i) => (
                  <RoughBox
                    key={label}
                    stroke={INK_LIGHT}
                    strokeWidth={1}
                    roughness={0.9}
                    style={{ padding: '4px 8px' }}
                  >
                    <Text
                      className="notebook-text"
                      ta="center"
                      fw={600}
                      style={{ fontSize: 22 }}
                    >
                      {label}
                    </Text>
                    <Text
                      className="notebook-text"
                      ta="center"
                      c={INK_LIGHT}
                      style={{ fontSize: 12 }}
                    >
                      {['Run to finish', 'Time-boxed', 'Preemptive'][i]}
                    </Text>
                  </RoughBox>
                ))}
              </Stack>
            </RoughBox>
            <Text
              className="notebook-text"
              c={INK_LIGHT}
              style={{ fontSize: 15 }}
            >
              &ldquo;How long?&rdquo;
            </Text>
          </Stack>

          {/* Arrow */}
          <RoughArrow />

          {/* Done */}
          <Stack
            flex={0}
            miw={50}
            gap={4}
            align="center"
            justify="center"
          >
            <Text className="notebook-text" fw={600} style={{ fontSize: 22 }}>
              Done
            </Text>
            <Text
              className="notebook-text"
              fw={700}
              style={{ fontSize: 40, color: '#2d6a4f' }}
            >
              &#x2713;
            </Text>
          </Stack>
        </Flex>
      </Flex>
    </div>
  );
}
