export interface Task {
  id: string;
  name: string;
  project: ProjectId;
  duration: number; // minutes
  priority: number; // 1 (highest) to 5
  deadline?: 'hard' | 'soft' | 'none';
  recurring?: boolean;
}

export type ProjectId = 'p1' | 'p2' | 'p3' | 'p4';

export interface Project {
  id: ProjectId;
  label: string;
  name: string;
  color: string;
  tasks: Task[];
}

export type SelectorAlgorithm =
  | 'round-robin'
  | 'priority-weighted'
  | 'shortest-queue'
  | 'random';

export type ExecutorPolicy =
  | 'run-to-completion'
  | 'time-boxed'
  | 'preemptive-priority'
  | 'deadline-driven';

export interface SimulationConfig {
  selector: SelectorAlgorithm;
  executor: ExecutorPolicy;
  timeQuantum: number; // for time-boxed
  interruptionRate: number; // 0-1
}
