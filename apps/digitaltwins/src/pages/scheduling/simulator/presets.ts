import type { SimConfig } from './simulation';
import { defaultQueueConfig } from './simulation';

export interface Preset {
  id: string;
  name: string;
  description: string;
  config: Partial<SimConfig> & { queues: Record<string, ReturnType<typeof defaultQueueConfig>> };
}

const QUEUE_IDS = ['p1', 'p2', 'p3', 'p4'];

function allQueues(patch: Partial<ReturnType<typeof defaultQueueConfig>>): Record<string, ReturnType<typeof defaultQueueConfig>> {
  const queues: Record<string, ReturnType<typeof defaultQueueConfig>> = {};
  for (const id of QUEUE_IDS) {
    queues[id] = { ...defaultQueueConfig(), ...patch };
  }
  return queues;
}

function evenAllocation(): Record<string, number> {
  const alloc: Record<string, number> = {};
  for (const id of QUEUE_IDS) alloc[id] = 0.25;
  return alloc;
}

export const PRESETS: Preset[] = [
  {
    id: 'balanced',
    name: 'Balanced day',
    description: 'Even workload, moderate interruptions, steady pace.',
    config: {
      selector: 'round-robin',
      executorPolicy: 'run-to-completion',
      timeAllocation: evenAllocation(),
      cycleLength: 60,
      interruptions: { perDay: 4, cost: { mean: 15, stdDev: 10 } },
      efficiency: 1,
      contextSwitchCost: 5,
      queues: allQueues({}),
    },
  },
  {
    id: 'open-office-chaos',
    name: 'Open office chaos',
    description: 'Constant interruptions, expensive context switches, noisy task mix.',
    config: {
      selector: 'round-robin',
      executorPolicy: 'run-to-completion',
      timeAllocation: evenAllocation(),
      cycleLength: 60,
      interruptions: { perDay: 20, cost: { mean: 25, stdDev: 15 } },
      efficiency: 1.5,
      contextSwitchCost: 15,
      queues: {
        p1: { taskSize: { mean: 20, stdDev: 15 }, priority: { mean: 2, stdDev: 1.5 } },
        p2: { taskSize: { mean: 15, stdDev: 10 }, priority: { mean: 3, stdDev: 1 } },
        p3: { taskSize: { mean: 10, stdDev: 5 }, priority: { mean: 4, stdDev: 0.5 } },
        p4: { taskSize: { mean: 25, stdDev: 20 }, priority: { mean: 3, stdDev: 1.2 } },
      },
    },
  },
  {
    id: 'deep-work',
    name: 'Deep work mode',
    description: 'Zero interruptions, low switch cost, long focused tasks.',
    config: {
      selector: 'priority',
      executorPolicy: 'run-to-completion',
      timeAllocation: evenAllocation(),
      cycleLength: 60,
      interruptions: { perDay: 0, cost: { mean: 10, stdDev: 5 } },
      efficiency: 1,
      contextSwitchCost: 2,
      queues: {
        p1: { taskSize: { mean: 90, stdDev: 40 }, priority: { mean: 2, stdDev: 1 } },
        p2: { taskSize: { mean: 45, stdDev: 20 }, priority: { mean: 4, stdDev: 0.8 } },
        p3: { taskSize: { mean: 60, stdDev: 25 }, priority: { mean: 3, stdDev: 1 } },
        p4: { taskSize: { mean: 30, stdDev: 15 }, priority: { mean: 4, stdDev: 0.5 } },
      },
    },
  },
  {
    id: 'structured-timeboxed',
    name: 'Structured time-boxing',
    description: 'Dedicated time blocks per project, moderate interruptions.',
    config: {
      selector: 'priority',
      executorPolicy: 'time-boxed',
      timeAllocation: { p1: 0.4, p2: 0.2, p3: 0.2, p4: 0.2 },
      cycleLength: 90,
      interruptions: { perDay: 3, cost: { mean: 10, stdDev: 5 } },
      efficiency: 1,
      contextSwitchCost: 8,
      queues: {
        p1: { taskSize: { mean: 40, stdDev: 25 }, priority: { mean: 2, stdDev: 1.2 } },
        p2: { taskSize: { mean: 25, stdDev: 15 }, priority: { mean: 3, stdDev: 1 } },
        p3: { taskSize: { mean: 30, stdDev: 20 }, priority: { mean: 3, stdDev: 1 } },
        p4: { taskSize: { mean: 20, stdDev: 10 }, priority: { mean: 3.5, stdDev: 0.8 } },
      },
    },
  },
  {
    id: 'fire-fighting',
    name: 'Fire-fighting day',
    description: 'Everything is urgent, tasks are tiny, interruptions are brutal.',
    config: {
      selector: 'priority',
      executorPolicy: 'run-to-completion',
      timeAllocation: evenAllocation(),
      cycleLength: 60,
      interruptions: { perDay: 16, cost: { mean: 20, stdDev: 15 } },
      efficiency: 2,
      contextSwitchCost: 10,
      queues: {
        p1: { taskSize: { mean: 10, stdDev: 5 }, priority: { mean: 1.5, stdDev: 0.8 } },
        p2: { taskSize: { mean: 8, stdDev: 4 }, priority: { mean: 2, stdDev: 1 } },
        p3: { taskSize: { mean: 5, stdDev: 3 }, priority: { mean: 2.5, stdDev: 1 } },
        p4: { taskSize: { mean: 12, stdDev: 8 }, priority: { mean: 1.8, stdDev: 1 } },
      },
    },
  },
  {
    id: 'one-big-project',
    name: 'One big project',
    description: 'Dominated by a single heavy-hitting project, others are small.',
    config: {
      selector: 'round-robin',
      executorPolicy: 'time-boxed',
      timeAllocation: { p1: 0.6, p2: 0.15, p3: 0.15, p4: 0.1 },
      cycleLength: 120,
      interruptions: { perDay: 5, cost: { mean: 12, stdDev: 8 } },
      efficiency: 1,
      contextSwitchCost: 5,
      queues: {
        p1: { taskSize: { mean: 60, stdDev: 30 }, priority: { mean: 1.5, stdDev: 0.5 } },
        p2: { taskSize: { mean: 15, stdDev: 8 }, priority: { mean: 3.5, stdDev: 1 } },
        p3: { taskSize: { mean: 20, stdDev: 10 }, priority: { mean: 3, stdDev: 1 } },
        p4: { taskSize: { mean: 10, stdDev: 5 }, priority: { mean: 4, stdDev: 0.5 } },
      },
    },
  },
  {
    id: 'slow-and-steady',
    name: 'Slow & steady',
    description: 'Big tasks, few interruptions. Marathon pace.',
    config: {
      selector: 'round-robin',
      executorPolicy: 'run-to-completion',
      timeAllocation: evenAllocation(),
      cycleLength: 60,
      interruptions: { perDay: 1, cost: { mean: 8, stdDev: 4 } },
      efficiency: 1,
      contextSwitchCost: 3,
      queues: {
        p1: { taskSize: { mean: 120, stdDev: 40 }, priority: { mean: 3, stdDev: 1 } },
        p2: { taskSize: { mean: 90, stdDev: 30 }, priority: { mean: 3, stdDev: 1.2 } },
        p3: { taskSize: { mean: 60, stdDev: 25 }, priority: { mean: 3, stdDev: 1 } },
        p4: { taskSize: { mean: 45, stdDev: 20 }, priority: { mean: 3, stdDev: 0.8 } },
      },
    },
  },
];
