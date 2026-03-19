import type { SceneState } from './scene';

/**
 * Keyframe scenes for each scroll step.
 * Index matches the card index in SchedulingPost.
 */
export const STEPS: SceneState[] = [
  // Step 0: "You have a pile of tasks..."
  // Everything normal — projects visible, machines present but not emphasised
  {
    tasks: {},
    highlights: {},
    dims: {},
  },

  // Step 1: "Two machines, two decisions"
  // Dim the project queues, highlight the selector and executor machines
  {
    tasks: {},
    highlights: {
      selector: 1,
      executor: 1,
    },
    dims: {
      projects: 0.6,
    },
  },
];
