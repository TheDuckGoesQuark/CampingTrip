/**
 * Pure, headless task-scheduling simulator.
 *
 * No React, no DOM — just a tick function that advances a state machine.
 * The visual layer reads snapshots of this state to render.
 *
 * Time model: 1 tick = 1 minute.  A full day = 1440 ticks.
 *
 * Core loop per tick:
 *   1. If executor busy → progress (with efficiency roll) / complete / preempt / interrupt
 *   2. If executor free → pick next task (policy-dependent)
 *   3. Roll for new task arrivals per queue
 *   4. Snapshot metrics
 */

// ── Distribution helpers ─────────────────────────────────────────

export interface Distribution {
  mean: number;
  stdDev: number;
}

/** Box-Muller, clamped to [min, max], rounded to integer. */
function sampleNormal(
  dist: Distribution,
  min: number,
  max: number,
  random: () => number,
): number {
  const u1 = Math.max(1e-10, random());
  const u2 = random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const raw = dist.mean + z * dist.stdDev;
  return Math.max(min, Math.min(max, Math.round(raw)));
}


/**
 * Rescale a single value from an old distribution to a new one.
 * Computes the z-score in the old distribution and maps it to the new one,
 * clamping to [min, max]. This preserves each task's relative position:
 * a task 1σ above the old mean stays 1σ above the new mean.
 */
function rescaleValue(
  value: number,
  oldDist: Distribution,
  newDist: Distribution,
  min: number,
  max: number,
): number {
  const oldStdDev = Math.max(0.01, oldDist.stdDev);
  const z = (value - oldDist.mean) / oldStdDev;
  const raw = newDist.mean + z * newDist.stdDev;
  return Math.max(min, Math.min(max, Math.round(raw)));
}

/**
 * Rescale queued tasks to match updated per-queue distributions.
 * Preserves task identity and relative proportions within the distribution.
 * Only remaps the properties whose distributions actually changed.
 * Does NOT touch the task currently in the executor.
 */
export function resampleQueues(
  state: SimState,
  oldConfig: SimConfig,
  newConfig: SimConfig,
): SimState {
  const queues = new Map<string, SimTask[]>();
  for (const [id, tasks] of state.queues) {
    const oldQc = oldConfig.queues[id];
    const newQc = newConfig.queues[id];
    if (!oldQc || !newQc) {
      queues.set(id, [...tasks]);
      continue;
    }

    const sizeChanged =
      oldQc.taskSize.mean !== newQc.taskSize.mean ||
      oldQc.taskSize.stdDev !== newQc.taskSize.stdDev;
    const priorityChanged =
      oldQc.priority.mean !== newQc.priority.mean ||
      oldQc.priority.stdDev !== newQc.priority.stdDev;

    queues.set(
      id,
      tasks.map((t) => ({
        ...t,
        duration: sizeChanged
          ? rescaleValue(t.duration, oldQc.taskSize, newQc.taskSize, TASK_SIZE_MIN, TASK_SIZE_MAX)
          : t.duration,
        priority: priorityChanged
          ? rescaleValue(t.priority, oldQc.priority, newQc.priority, 1, 5)
          : t.priority,
      })),
    );
  }
  return { ...state, queues };
}

// ── Types ────────────────────────────────────────────────────────

export const TASK_SIZE_MIN = 1;
export const TASK_SIZE_MAX = 180;

export interface SimTask {
  id: string;
  name: string;
  project: string;
  duration: number;           // minutes of work needed
  progress: number;           // minutes of work done so far
  priority: number;           // 1 = highest, 5 = lowest
  arrivedAt: number;          // tick when entered queue
  startedAt: number | null;   // tick when first picked up
}

export interface QueueDef {
  id: string;
  label: string;
  name: string;
  color: string;
}

export interface ExecutorSlot {
  task: SimTask;
  progress: number;           // minutes of work done
  runStart: number;           // tick this execution run began
}

export interface SimState {
  tick: number;
  queues: Map<string, SimTask[]>;
  queueDefs: QueueDef[];
  executor: ExecutorSlot | null;
  done: SimTask[];
  roundRobinIndex: number;
  nextTaskId: number;
  // Time-boxed cycle tracking
  cycleProjectIndex: number;  // which project in the current cycle
  cycleTicksUsed: number;     // ticks spent on the current project's window
  // Interruption cooldown — executor is locked out for this many ticks
  interruptionCooldown: number;
  interruptionCooldownTotal: number;  // original duration (for countdown display)
  // Context switch — ticks remaining before executor starts real work
  contextSwitchRemaining: number;
}

// ── Config ───────────────────────────────────────────────────────

export interface QueueConfig {
  taskSize: Distribution;     // minutes (clamped TASK_SIZE_MIN..MAX)
  priority: Distribution;     // 1–5
}

export interface SimConfig {
  selector: 'round-robin' | 'priority';
  executorPolicy: 'run-to-completion' | 'time-boxed';
  timeAllocation: Record<string, number>;   // queue id → fraction (sum ≈ 1)
  cycleLength: number;                      // minutes per time-box cycle
  interruptions: {
    perDay: number;                         // expected interruptions per day (0–24)
    cost: Distribution;                     // minutes each interruption burns (1–60)
  };
  efficiency: number;                        // ticks of real time per tick of work (1 = full speed, 2 = half speed)
  contextSwitchCost: number;                 // minutes lost each time a new task is picked up
  queueCapacity: number;                      // max tasks per queue — refilled automatically
  queues: Record<string, QueueConfig>;
}

export function defaultQueueConfig(): QueueConfig {
  return {
    taskSize: { mean: 30, stdDev: 20 },
    priority: { mean: 3, stdDev: 1.2 },
  };
}

export function defaultSimConfig(queueIds: string[]): SimConfig {
  const queues: Record<string, QueueConfig> = {};
  const timeAllocation: Record<string, number> = {};
  const frac = 1 / queueIds.length;
  for (const id of queueIds) {
    queues[id] = defaultQueueConfig();
    timeAllocation[id] = frac;
  }
  return {
    selector: 'round-robin',
    executorPolicy: 'run-to-completion',
    timeAllocation,
    cycleLength: 60,
    interruptions: { perDay: 4, cost: { mean: 15, stdDev: 10 } },
    efficiency: 1,
    contextSwitchCost: 5,
    queueCapacity: 5,
    queues,
  };
}

// ── Events ───────────────────────────────────────────────────────

export type SimEvent =
  | { type: 'TASK_ARRIVED'; task: SimTask; queue: string }
  | { type: 'TASK_SELECTED'; task: SimTask; from: string }
  | { type: 'TASK_PROGRESS'; taskId: string; progress: number; duration: number }
  | { type: 'TASK_COMPLETED'; task: SimTask }
  | { type: 'TASK_PREEMPTED'; task: SimTask; reason: 'time-box' | 'interruption' }
  | { type: 'INTERRUPTION_COST'; ticks: number }
  | { type: 'IDLE' };

export interface MetricsSnapshot {
  tick: number;
  queueDepths: Record<string, number>;
  totalCompleted: number;
  executorBusy: boolean;
  interrupted: boolean;
  // Extended metrics for richer charts
  executorProject: string | null;       // which project being worked on right now
  contextSwitching: boolean;            // in context-switch warmup
  interruptedThisTick: boolean;         // spending this tick in interruption cooldown
  completedThisTick: number;            // 0 or 1 — did a task finish this tick?
  completedProject: string | null;      // which project's task completed (or null)
  oldestTaskAge: Record<string, number>;// max (currentTick - arrivedAt) per queue
}

export interface TickResult {
  state: SimState;
  events: SimEvent[];
  metrics: MetricsSnapshot;
}

// ── Task generation ──────────────────────────────────────────────

const TASK_NAMES: Record<string, string[]> = {
  p1: ['Code review', 'Write tests', 'Reply emails', 'Deploy fix', 'Design doc', 'Bug triage', 'Sprint plan', 'PR review'],
  p2: ['Groceries', 'Cook dinner', 'Call mum', 'Laundry', 'Clean house', 'Walk dog', 'Pick up kids', 'Fix shelf'],
  p3: ['Gym', 'Meal prep', 'Yoga', 'Run 5k', 'Stretch', 'Meditation', 'Sleep early', 'Vitamins'],
  p4: ['Pay bills', 'Tax return', 'Insurance', 'Dentist', 'Car MOT', 'Renew passport', 'File receipts', 'Bank call'],
};

function generateTask(
  queueId: string,
  id: number,
  tick: number,
  queueConfig: QueueConfig,
  random: () => number,
): SimTask {
  const names = TASK_NAMES[queueId] ?? ['Task'];
  const name = names[Math.floor(random() * names.length)]!;
  const duration = sampleNormal(queueConfig.taskSize, TASK_SIZE_MIN, TASK_SIZE_MAX, random);
  const priority = sampleNormal(queueConfig.priority, 1, 5, random);

  return {
    id: `t${id}`,
    name,
    project: queueId,
    duration,
    progress: 0,
    priority,
    arrivedAt: tick,
    startedAt: null,
  };
}

// ── Initial state ────────────────────────────────────────────────

const DEFAULT_QUEUE_DEFS: QueueDef[] = [
  { id: 'p1', label: 'P\u2081', name: 'Work', color: '#2c3e6b' },
  { id: 'p2', label: 'P\u2082', name: 'Personal', color: '#8b4513' },
  { id: 'p3', label: 'P\u2083', name: 'Health', color: '#2d6a4f' },
  { id: 'p4', label: 'P\u2084', name: 'Admin', color: '#7b2d8b' },
];

export function createSimulation(
  config: SimConfig,
  random: () => number = Math.random,
  queueDefs: QueueDef[] = DEFAULT_QUEUE_DEFS,
): SimState {
  let nextId = 1;
  const queues = new Map<string, SimTask[]>();
  const capacity = config.queueCapacity ?? 5;

  for (const def of queueDefs) {
    const qc = config.queues[def.id] ?? defaultQueueConfig();
    const tasks: SimTask[] = [];
    for (let i = 0; i < capacity; i++) {
      tasks.push(generateTask(def.id, nextId++, 0, qc, random));
    }
    queues.set(def.id, tasks);
  }

  return {
    tick: 0,
    queues,
    queueDefs,
    executor: null,
    done: [],
    roundRobinIndex: 0,
    nextTaskId: nextId,
    cycleProjectIndex: 0,
    cycleTicksUsed: 0,
    interruptionCooldown: 0,
    interruptionCooldownTotal: 0,
    contextSwitchRemaining: 0,
  };
}

// ── Selector algorithms (run-to-completion mode) ─────────────────

function selectRoundRobin(state: SimState): { task: SimTask; from: string; newIndex: number } | null {
  const n = state.queueDefs.length;
  for (let attempt = 0; attempt < n; attempt++) {
    const idx = (state.roundRobinIndex + attempt) % n;
    const queueId = state.queueDefs[idx]!.id;
    const queue = state.queues.get(queueId)!;
    if (queue.length > 0) {
      return { task: queue[0]!, from: queueId, newIndex: (idx + 1) % n };
    }
  }
  return null;
}

function selectPriority(state: SimState): { task: SimTask; from: string; newIndex: number } | null {
  let best: { task: SimTask; from: string } | null = null;
  for (const def of state.queueDefs) {
    const queue = state.queues.get(def.id)!;
    if (queue.length === 0) continue;
    const front = queue[0]!;
    if (!best || front.priority < best.task.priority) {
      best = { task: front, from: def.id };
    }
  }
  if (!best) return null;
  return { ...best, newIndex: state.roundRobinIndex };
}

function selectForRunToCompletion(state: SimState, config: SimConfig): { task: SimTask; from: string; newIndex: number } | null {
  return config.selector === 'round-robin'
    ? selectRoundRobin(state)
    : selectPriority(state);
}

// ── Time-boxed: figure out which project the executor should serve ──

function getAllocationTicks(projectId: string, config: SimConfig): number {
  const frac = config.timeAllocation[projectId] ?? 0;
  return Math.max(1, Math.round(frac * config.cycleLength));
}

function selectForTimeBoxed(
  state: SimState,
): { task: SimTask; from: string; cycleProjectIndex: number; cycleTicksUsed: number } | null {
  const defs = state.queueDefs;
  const n = defs.length;

  // Try current project first, then advance through the cycle
  for (let attempt = 0; attempt < n; attempt++) {
    const idx = (state.cycleProjectIndex + attempt) % n;
    const projectId = defs[idx]!.id;
    const queue = state.queues.get(projectId)!;
    if (queue.length > 0) {
      return {
        task: queue[0]!,
        from: projectId,
        cycleProjectIndex: idx,
        cycleTicksUsed: attempt === 0 ? state.cycleTicksUsed : 0,
      };
    }
    // No tasks in this project — skip its window
  }
  return null;
}

// ── Tick ─────────────────────────────────────────────────────────

export function tick(
  prev: SimState,
  config: SimConfig,
  random: () => number = Math.random,
): TickResult {
  // Clone mutable parts
  const queues = new Map<string, SimTask[]>();
  for (const [id, tasks] of prev.queues) {
    queues.set(id, [...tasks]);
  }
  const done = [...prev.done];
  let executor = prev.executor ? { ...prev.executor } : null;
  let roundRobinIndex = prev.roundRobinIndex;
  let nextTaskId = prev.nextTaskId;
  let cycleProjectIndex = prev.cycleProjectIndex;
  let cycleTicksUsed = prev.cycleTicksUsed;
  let interruptionCooldown = prev.interruptionCooldown;
  let interruptionCooldownTotal = prev.interruptionCooldownTotal;
  let contextSwitchRemaining = prev.contextSwitchRemaining;
  const currentTick = prev.tick + 1;
  const events: SimEvent[] = [];
  let interrupted = false;
  let completedThisTick = 0;
  let completedProject: string | null = null;

  // ── Step 0: Interruption cooldown — executor locked out ──

  if (interruptionCooldown > 0) {
    interruptionCooldown -= 1;
    interrupted = true;
    events.push({ type: 'IDLE' });
  }

  // ── Step 0b: Context switch — burning time before real work ──

  else if (contextSwitchRemaining > 0) {
    contextSwitchRemaining -= 1;
    // No work happens, just waiting for context switch to finish
  }

  // ── Step 1: Executor busy? Advance or preempt ──

  else if (executor) {
    // Check for interruption: convert perDay to per-minute probability
    const interruptChancePerTick = config.interruptions.perDay / 1440;
    if (random() < interruptChancePerTick) {
      executor.task.progress = executor.progress;
      const q = queues.get(executor.task.project)!;
      q.unshift(executor.task);
      events.push({ type: 'TASK_PREEMPTED', task: executor.task, reason: 'interruption' });
      interrupted = true;

      const cost = sampleNormal(config.interruptions.cost, 1, 60, random);
      interruptionCooldown = cost;
      interruptionCooldownTotal = cost;
      events.push({ type: 'INTERRUPTION_COST', ticks: cost });

      executor = null;
    } else {
      // Efficiency: 1 tick of real time yields (1/efficiency) ticks of work
      const workDone = 1 / Math.max(0.5, config.efficiency);
      executor.progress += workDone;
      executor.task.progress = executor.progress;

      events.push({
        type: 'TASK_PROGRESS',
        taskId: executor.task.id,
        progress: executor.progress,
        duration: executor.task.duration,
      });

      // Check completion
      if (executor.progress >= executor.task.duration) {
        executor.task.progress = executor.task.duration;
        completedThisTick = 1;
        completedProject = executor.task.project;
        events.push({ type: 'TASK_COMPLETED', task: executor.task });
        done.push(executor.task);
        executor = null;
      }
      // Check time-box window expiry
      else if (config.executorPolicy === 'time-boxed') {
        cycleTicksUsed += 1;
        const projectId = prev.queueDefs[cycleProjectIndex]?.id ?? '';
        const windowTicks = getAllocationTicks(projectId, config);

        if (cycleTicksUsed >= windowTicks) {
          // Window expired — preempt task, advance to next project
          executor.task.progress = executor.progress;
          const q = queues.get(executor.task.project)!;
          q.push(executor.task);
          events.push({ type: 'TASK_PREEMPTED', task: executor.task, reason: 'time-box' });
          executor = null;
          cycleProjectIndex = (cycleProjectIndex + 1) % prev.queueDefs.length;
          cycleTicksUsed = 0;
        }
      }
    }
  }

  // ── Step 2: Executor free? Select next task (skip if cooling down) ──

  if (!executor && interruptionCooldown <= 0 && contextSwitchRemaining <= 0) {
    const lookupState: SimState = {
      ...prev,
      tick: currentTick,
      queues,
      roundRobinIndex,
      cycleProjectIndex,
      cycleTicksUsed,
      interruptionCooldown,
      interruptionCooldownTotal,
      contextSwitchRemaining,
    };

    if (config.executorPolicy === 'run-to-completion') {
      const selection = selectForRunToCompletion(lookupState, config);
      if (selection) {
        const q = queues.get(selection.from)!;
        const task = q.shift()!;
        if (task.startedAt === null) task.startedAt = currentTick;
        executor = { task, progress: task.progress, runStart: currentTick };
        contextSwitchRemaining = config.contextSwitchCost;
        roundRobinIndex = selection.newIndex;
        events.push({ type: 'TASK_SELECTED', task, from: selection.from });
      } else {
        events.push({ type: 'IDLE' });
      }
    } else {
      // Time-boxed: pick from the current cycle project
      const selection = selectForTimeBoxed(lookupState);
      if (selection) {
        const q = queues.get(selection.from)!;
        const task = q.shift()!;
        if (task.startedAt === null) task.startedAt = currentTick;
        executor = { task, progress: task.progress, runStart: currentTick };
        contextSwitchRemaining = config.contextSwitchCost;
        cycleProjectIndex = selection.cycleProjectIndex;
        cycleTicksUsed = selection.cycleTicksUsed;
        events.push({ type: 'TASK_SELECTED', task, from: selection.from });
      } else {
        events.push({ type: 'IDLE' });
      }
    }
  }

  // ── Step 3: Refill queues to capacity ──

  const capacity = config.queueCapacity ?? 5;
  for (const def of prev.queueDefs) {
    const q = queues.get(def.id)!;
    const qc = config.queues[def.id] ?? defaultQueueConfig();
    while (q.length < capacity) {
      const task = generateTask(def.id, nextTaskId++, currentTick, qc, random);
      q.push(task);
      events.push({ type: 'TASK_ARRIVED', task, queue: def.id });
    }
  }

  // ── Step 4: Metrics snapshot ──

  const queueDepths: Record<string, number> = {};
  for (const [id, tasks] of queues) {
    queueDepths[id] = tasks.length;
  }

  // Compute oldest task age per queue
  const oldestTaskAge: Record<string, number> = {};
  for (const [id, tasks] of queues) {
    if (tasks.length === 0) {
      oldestTaskAge[id] = 0;
    } else {
      oldestTaskAge[id] = Math.max(...tasks.map((t) => currentTick - t.arrivedAt));
    }
  }

  const metrics: MetricsSnapshot = {
    tick: currentTick,
    queueDepths,
    totalCompleted: done.length,
    executorBusy: executor !== null,
    interrupted,
    executorProject: executor?.task.project ?? null,
    contextSwitching: contextSwitchRemaining > 0,
    interruptedThisTick: interruptionCooldown > 0,
    completedThisTick,
    completedProject,
    oldestTaskAge,
  };

  return {
    state: {
      tick: currentTick,
      queues,
      queueDefs: prev.queueDefs,
      executor,
      done,
      roundRobinIndex,
      nextTaskId,
      cycleProjectIndex,
      cycleTicksUsed,
      interruptionCooldown,
      interruptionCooldownTotal,
      contextSwitchRemaining,
    },
    events,
    metrics,
  };
}
