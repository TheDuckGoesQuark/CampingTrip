import { useState } from 'react';
import { Button, Flex, Group, Menu, SegmentedControl, Slider, Stack, Text } from '@mantine/core';
import { RoughBox } from '../RoughBox';
import { RoughArrow } from '../RoughArrow';
import { RoughExclamation } from '../RoughExclamation';
import { useSimulation, type SimControls } from './useSimulation';
import { MetricsPanel } from './MetricsPanel';
import { DistributionEditor } from './DistributionEditor';
import { AllocationBar } from './AllocationBar';
import { TASK_SIZE_MIN, TASK_SIZE_MAX, type SimConfig, type QueueConfig } from './simulation';
import { PRESETS } from './presets';
import '../notebook.css';

const INK = '#2c3e6b';
const INK_LIGHT = '#8a9bba';

// ── Task chip ────────────────────────────────────────────────────

/** Map duration (1–180 min) to chip width (44–120 px). */
function durationToWidth(duration: number): number {
  const t = Math.max(0, Math.min(1, (duration - 1) / 179));
  return 44 + t * 76;
}

/** Priority 1 (urgent) → 5 stars, priority 5 (low) → 1 star. */
function priorityToStars(priority: number): number {
  return Math.max(1, Math.min(5, 6 - Math.round(priority)));
}

const CHIP_HEIGHT = 34;

function TaskChip({ name, color, duration, priority, progress = 0, glow = false }: {
  name: string;
  color: string;
  duration: number;
  priority: number;
  progress?: number;
  glow?: boolean;
}) {
  const w = durationToWidth(duration);
  const stars = priorityToStars(priority);
  const fillPct = duration > 0 ? Math.min(100, Math.round((progress / duration) * 100)) : 0;

  return (
    <div style={{
      width: w,
      height: CHIP_HEIGHT,
      flexShrink: 0,
      position: 'relative',
      border: `1.5px solid ${color}`,
      borderRadius: 3,
      background: '#fefcf6',
      overflow: 'hidden',
      boxShadow: glow ? `0 0 8px 2px ${color}88` : undefined,
      transition: 'box-shadow 300ms ease-out',
    }}>
      {/* Progress fill from left to right */}
      {fillPct > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${fillPct}%`,
          background: color + '25',
          transition: 'width 80ms ease-out',
        }} />
      )}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '1px 3px', overflow: 'hidden' }}>
        <Text className="notebook-text" ta="center" style={{ color, fontSize: w > 60 ? 9 : 7, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
          {name}
        </Text>
        <span style={{ fontSize: 7, lineHeight: 1, letterSpacing: -1, color: color + 'bb' }}>
          {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
        </span>
      </div>
    </div>
  );
}

// ── Executor display ─────────────────────────────────────────────

const RED = '#c0392b';

function ExecutorDisplay({ state, config, queueDefs }: {
  state: SimControls['state'];
  config: SimConfig;
  queueDefs: import('./simulation').QueueDef[];
}) {
  const { executor, interruptionCooldown, interruptionCooldownTotal, contextSwitchRemaining } = state;

  const getColor = (projectId: string) =>
    queueDefs.find((d) => d.id === projectId)?.color ?? INK;

  // ── Interrupted: red countdown bar ──
  if (interruptionCooldown > 0) {
    const pct = interruptionCooldownTotal > 0
      ? Math.round((interruptionCooldown / interruptionCooldownTotal) * 100)
      : 0;
    return (
      <RoughBox stroke={RED} style={{ padding: 8, minHeight: 48, position: 'relative' }}>
        <div style={{ position: 'absolute', top: -14, right: -6, zIndex: 3 }}>
          <RoughExclamation opacity={1} />
        </div>
        <Text className="notebook-text" ta="center" fw={600} style={{ fontSize: 14, color: RED }}>
          Interrupted!
        </Text>
        <div style={{ margin: '3px 0', background: '#f5e6e4', borderRadius: 4, height: 5, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: RED, borderRadius: 4, transition: 'width 80ms ease-out' }} />
        </div>
        <Text className="notebook-text" ta="center" style={{ fontSize: 12, color: RED }}>
          {interruptionCooldown}m remaining
        </Text>
      </RoughBox>
    );
  }

  // ── No task: idle ──
  if (!executor) {
    return (
      <RoughBox stroke={INK_LIGHT} style={{ padding: 8, minHeight: 48 }}>
        <Text className="notebook-text" ta="center" c={INK_LIGHT} style={{ fontSize: 14 }}>
          Idle
        </Text>
      </RoughBox>
    );
  }

  const color = getColor(executor.task.project);

  // ── Context switching: warm-up bar ──
  if (contextSwitchRemaining > 0) {
    const total = config.contextSwitchCost;
    const elapsed = total - contextSwitchRemaining;
    const pct = total > 0 ? Math.round((elapsed / total) * 100) : 100;
    return (
      <RoughBox stroke="#e67e22" style={{ padding: 8, minHeight: 48 }}>
        <Flex justify="center" mb={4}>
          <TaskChip name={executor.task.name} color={color} duration={executor.task.duration} priority={executor.task.priority} progress={executor.progress} />
        </Flex>
        <div style={{ margin: '3px 0', background: '#fdebd0', borderRadius: 4, height: 4, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#e67e22', borderRadius: 4, transition: 'width 80ms ease-out' }} />
        </div>
        <Text className="notebook-text" ta="center" style={{ fontSize: 12, color: '#e67e22' }}>
          {contextSwitchRemaining}m switching
        </Text>
      </RoughBox>
    );
  }

  // ── Working on task — show chip filling up ──
  return (
    <RoughBox stroke={color} style={{ padding: 8, minHeight: 48 }}>
      <Flex justify="center" mb={4}>
        <TaskChip name={executor.task.name} color={color} duration={executor.task.duration} priority={executor.task.priority} progress={executor.progress} />
      </Flex>
      <Text className="notebook-text" ta="center" c={INK_LIGHT} style={{ fontSize: 12 }}>
        {Math.round(executor.progress)}/{executor.task.duration} min
        {config.efficiency > 1 ? ` · ${config.efficiency}× slower` : ''}
      </Text>
    </RoughBox>
  );
}

// ── Queue config helpers ─────────────────────────────────────────

function updateQueueConfig(sim: SimControls, queueId: string, patch: Partial<QueueConfig>) {
  const prev = sim.config.queues[queueId]!;
  sim.setConfig({
    ...sim.config,
    queues: { ...sim.config.queues, [queueId]: { ...prev, ...patch } },
  });
}

// ── Queue row with inline distributions ──────────────────────────

function QueueRow({ sim, queueId }: { sim: SimControls; queueId: string }) {
  const def = sim.state.queueDefs.find((d) => d.id === queueId)!;
  const tasks = sim.state.queues.get(queueId) ?? [];
  const qc = sim.config.queues[queueId]!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Queue label + task chips */}
      <Flex align="center" gap={4}>
        <Text className="notebook-text" fw={700} style={{ color: def.color, fontSize: 18, minWidth: 24, textAlign: 'right' }}>
          {def.label}
        </Text>
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <RoughBox openLeft stroke={def.color} fill={def.color} fillStyle="dots" fillWeight={0.4} style={{ height: 42 }}>
            <Flex align="center" gap={2} px={2} h="100%" style={{ overflow: 'hidden' }}>
              {/* Overflow count pinned left */}
              {tasks.length > 4 && (
                <Text className="notebook-text" c={def.color} fw={600} style={{ fontSize: 12, flexShrink: 0 }}>
                  +{tasks.length - 4}
                </Text>
              )}
              {/* Spacer pushes chips right */}
              <div style={{ flex: 1 }} />
              {/* Show only the front of the queue (rightmost = next to be picked) */}
              {tasks.slice(0, 4).map((task) => (
                <TaskChip key={task.id} name={task.name} color={def.color} duration={task.duration} priority={task.priority} progress={task.progress} />
              ))}
            </Flex>
          </RoughBox>
        </div>
      </Flex>

      {/* Inline distribution editors */}
      <Flex gap={4} pl={28}>
        <div style={{ flex: 1 }}>
          <DistributionEditor
            mean={qc.taskSize.mean}
            stdDev={qc.taskSize.stdDev}
            min={TASK_SIZE_MIN}
            max={TASK_SIZE_MAX}
            color={def.color}
            label="task size"
            unit="m"
            height={44}
            onChange={(mean, stdDev) => updateQueueConfig(sim, queueId, { taskSize: { mean, stdDev } })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <DistributionEditor
            mean={qc.priority.mean}
            stdDev={qc.priority.stdDev}
            min={1}
            max={5}
            color={def.color}
            label="value"
            height={44}
            onChange={(mean, stdDev) => updateQueueConfig(sim, queueId, { priority: { mean, stdDev } })}
          />
        </div>
      </Flex>
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────────

export function SimulatorPanel() {
  const sim = useSimulation();
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    sim.setConfig(preset.config as SimConfig);
    sim.reset();
    setActivePreset(presetId);
  };

  const formatTime = (tick: number) => {
    const h = Math.floor(tick / 60);
    const m = tick % 60;
    return `${h}h${String(m).padStart(2, '0')}`;
  };

  return (
    <Stack gap={6} style={{ height: '100%', padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)' }}>
      {/* ── Controls row ── */}
      <Flex gap="xs" align="center" wrap="wrap" style={{ flexShrink: 0 }}>
        <Group gap={4}>
          <Button
            size="compact-xs"
            variant={sim.playing ? 'filled' : 'outline'}
            color="dark"
            onClick={sim.playing ? sim.pause : sim.play}
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            {sim.playing ? 'Pause' : 'Play'}
          </Button>
          <Button size="compact-xs" variant="outline" color="dark" onClick={sim.step} style={{ fontFamily: "'Caveat', cursive" }}>
            Step
          </Button>
          <Button size="compact-xs" variant="outline" color="red" onClick={sim.reset} style={{ fontFamily: "'Caveat', cursive" }}>
            Reset
          </Button>
          <Menu shadow="md" width={260} position="bottom-start">
            <Menu.Target>
              <Button size="compact-xs" variant="light" color="grape" style={{ fontFamily: "'Caveat', cursive" }}>
                {activePreset ? PRESETS.find((p) => p.id === activePreset)?.name ?? 'Presets' : 'Presets'}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {PRESETS.map((p) => (
                <Menu.Item
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  <Text fw={600} style={{ fontSize: 15, fontFamily: "'Caveat', cursive" }}>{p.name}</Text>
                  <Text c="dimmed" style={{ fontSize: 13, fontFamily: "'Caveat', cursive" }}>{p.description}</Text>
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Group gap={4} style={{ minWidth: 100 }}>
          <Text className="notebook-text" style={{ fontSize: 14 }}>Speed</Text>
          <Slider value={sim.speed} onChange={sim.setSpeed} min={1} max={30} step={1} style={{ flex: 1, minWidth: 60 }} size="xs" color="dark" />
        </Group>

        <SegmentedControl
          size="xs"
          value={sim.config.selector}
          onChange={(v) => sim.setConfig({ ...sim.config, selector: v as SimConfig['selector'] })}
          data={[
            { label: 'Round Robin', value: 'round-robin' },
            { label: 'Priority', value: 'priority' },
          ]}
        />

        <SegmentedControl
          size="xs"
          value={sim.config.executorPolicy}
          onChange={(v) => sim.setConfig({ ...sim.config, executorPolicy: v as SimConfig['executorPolicy'] })}
          data={[
            { label: 'Run to finish', value: 'run-to-completion' },
            { label: 'Time-boxed', value: 'time-boxed' },
          ]}
        />

        <Text className="notebook-text" c={INK_LIGHT} style={{ fontSize: 14 }}>
          {formatTime(sim.state.tick)} &middot; Done {sim.state.done.length}
        </Text>
      </Flex>

      {/* ── Main body: pipeline + metrics ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          minHeight: 0,
        }}
      >
        {/* Left: queues → scheduler pipeline */}
        <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', minWidth: 0, gap: 8 }}>
          {/* Pipeline grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: sim.config.executorPolicy === 'time-boxed'
              ? '1fr 32px auto 160px'
              : '1fr auto 160px',
            gap: 0,
            flex: 1,
            minHeight: 0,
            alignContent: 'center',
          }}>
            {/* Queues with inline distributions */}
            <Stack gap={6} justify="center" style={{ gridColumn: 1, overflow: 'hidden', padding: '0 4px' }}>
              {sim.state.queueDefs.map((def) => (
                <QueueRow key={def.id} sim={sim} queueId={def.id} />
              ))}
            </Stack>

            {/* Allocation bar — only in time-boxed mode */}
            {sim.config.executorPolicy === 'time-boxed' && (
              <div style={{ gridColumn: 2, alignSelf: 'stretch', padding: '8px 4px' }}>
                <AllocationBar
                  queueDefs={sim.state.queueDefs}
                  allocation={sim.config.timeAllocation}
                  onChange={(timeAllocation) => sim.setConfig({ ...sim.config, timeAllocation })}
                />
              </div>
            )}

            {/* Arrow */}
            <div style={{
              gridColumn: sim.config.executorPolicy === 'time-boxed' ? 3 : 2,
              alignSelf: 'center',
              padding: '0 6px',
            }}>
              <RoughArrow />
            </div>

            {/* Selector + Executor + Interruptions */}
            <Stack gap={6} justify="center" style={{
              gridColumn: sim.config.executorPolicy === 'time-boxed' ? 4 : 3,
            }}>
              {/* Interruption config — red distribution + perDay slider */}
              <div style={{ border: '1.5px dashed #c0392b44', borderRadius: 6, padding: '4px 6px' }}>
                <DistributionEditor
                  mean={sim.config.interruptions.cost.mean}
                  stdDev={sim.config.interruptions.cost.stdDev}
                  min={1}
                  max={60}
                  color="#c0392b"
                  label="interruption cost"
                  unit="m"
                  height={40}
                  onChange={(mean, stdDev) => sim.setConfig({
                    ...sim.config,
                    interruptions: { ...sim.config.interruptions, cost: { mean, stdDev } },
                  })}
                />
                <Group gap={4} mt={2}>
                  <Text className="notebook-text" style={{ fontSize: 12, color: '#c0392b', minWidth: 36 }}>
                    {sim.config.interruptions.perDay}/day
                  </Text>
                  <Slider
                    value={sim.config.interruptions.perDay}
                    onChange={(v) => sim.setConfig({
                      ...sim.config,
                      interruptions: { ...sim.config.interruptions, perDay: v },
                    })}
                    min={0}
                    max={24}
                    step={1}
                    style={{ flex: 1 }}
                    size="xs"
                    color="red"
                  />
                </Group>
              </div>

              <RoughBox stroke={INK} style={{ padding: 6 }}>
                <Text className="notebook-text" ta="center" fw={600} style={{ fontSize: 14 }}>
                  {sim.config.selector === 'round-robin' ? 'Round Robin' : 'Priority'}
                </Text>
                <Text className="notebook-text" ta="center" c={INK_LIGHT} style={{ fontSize: 12 }}>
                  {sim.config.selector === 'round-robin'
                    ? `Next: ${sim.state.queueDefs[sim.state.roundRobinIndex]?.label ?? '—'}`
                    : 'Highest priority'}
                </Text>
              </RoughBox>
              <ExecutorDisplay state={sim.state} config={sim.config} queueDefs={sim.state.queueDefs} />

              {/* Efficiency + context switch controls */}
              <Flex direction="column" gap={4}>
                <Group gap={4}>
                  <Text className="notebook-text" style={{ fontSize: 12, color: INK_LIGHT, minWidth: 58 }}>Efficiency</Text>
                  <Slider
                    value={sim.config.efficiency}
                    onChange={(v) => sim.setConfig({ ...sim.config, efficiency: v })}
                    min={1}
                    max={4}
                    step={0.5}
                    style={{ flex: 1 }}
                    size="xs"
                    color="dark"
                    label={(v) => `${v}× per min`}
                  />
                </Group>
                <Group gap={4}>
                  <Text className="notebook-text" style={{ fontSize: 12, color: INK_LIGHT, minWidth: 58 }}>Switch cost</Text>
                  <Slider
                    value={sim.config.contextSwitchCost}
                    onChange={(v) => sim.setConfig({ ...sim.config, contextSwitchCost: v })}
                    min={0}
                    max={30}
                    step={1}
                    style={{ flex: 1 }}
                    size="xs"
                    color="dark"
                    label={(v) => `${v}m`}
                  />
                </Group>
              </Flex>
            </Stack>

          </div>
        </div>

        {/* Right: metrics charts */}
        <div style={{
          flex: '1 1 320px',
          minWidth: 0,
          minHeight: 200,
          maxHeight: '100%',
          overflowY: 'auto',
        }}>
          <MetricsPanel history={sim.history} queueDefs={sim.state.queueDefs} config={sim.config} done={sim.state.done} />
        </div>
      </div>
    </Stack>
  );
}
