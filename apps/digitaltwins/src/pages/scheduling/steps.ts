import type { SceneState } from './scene';

/**
 * Keyframe scenes for each scroll step.
 * Index matches the card index in SchedulingPost.
 */
export const STEPS: SceneState[] = [
  // 0: "You have a pile of tasks..." — everything normal
  { tasks: {}, highlights: {}, dims: {} },

  // 1: "You can't do everything" — highlight the projects, they're the focus
  { tasks: {}, highlights: { projects: 1 }, dims: { selector: 0.5, executor: 0.5 } },

  // 2: "Choosing what's next" — highlight the selector machine
  { tasks: {}, highlights: { selector: 1 }, dims: { projects: 0.4, executor: 0.5 } },

  // 3: "Round Robin" — spotlight S1 within the selector
  { tasks: {}, highlights: { selector: 1, s1: 1 }, dims: { projects: 0.4, executor: 0.5 } },

  // 4: "Priority" — spotlight S2 within the selector
  { tasks: {}, highlights: { selector: 1, s2: 1 }, dims: { projects: 0.4, executor: 0.5 } },

  // 5: "How long do you give it?" — highlight the executor machine
  { tasks: {}, highlights: { executor: 1 }, dims: { projects: 0.4, selector: 0.5 } },

  // 6: "Run to completion" — spotlight E1 within the executor
  { tasks: {}, highlights: { executor: 1, e1: 1 }, dims: { projects: 0.4, selector: 0.5 } },

  // 7: "Time-boxing" — spotlight E2 within the executor
  { tasks: {}, highlights: { executor: 1, e2: 1 }, dims: { projects: 0.4, selector: 0.5 } },
];
