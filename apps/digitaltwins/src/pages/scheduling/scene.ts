/**
 * Scene state — a pure-data snapshot of the visualization at a point in time.
 * No React, no DOM — just numbers that the renderer reads.
 */

export interface TaskPosition {
  from: string;   // anchor ID (e.g. "queue-p1", "selector", "executor")
  to: string;     // anchor ID
  t: number;      // 0..1 interpolation between from→to
  opacity: number;
  scale: number;
}

export interface SceneState {
  /** Animated task tokens. Key = task ID. */
  tasks: Record<string, TaskPosition>;
  /** Highlight intensities. Key = element ID (e.g. "selector", "executor", "queue-p1"). 0 = normal, 1 = full glow. */
  highlights: Record<string, number>;
  /** Dim levels. Key = element ID. 0 = normal, 1 = fully dimmed. */
  dims: Record<string, number>;
}

/** Linearly interpolate between two numbers. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Merge two Record<string, number> maps, lerping shared keys and fading in/out missing keys. */
function lerpRecord(
  a: Record<string, number>,
  b: Record<string, number>,
  t: number,
): Record<string, number> {
  const result: Record<string, number> = {};
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of allKeys) {
    const va = a[key] ?? 0;
    const vb = b[key] ?? 0;
    const v = lerp(va, vb, t);
    if (Math.abs(v) > 0.001) {
      result[key] = v;
    }
  }
  return result;
}

/** Merge two task position maps, lerping shared tasks and fading in/out others. */
function lerpTasks(
  a: Record<string, TaskPosition>,
  b: Record<string, TaskPosition>,
  t: number,
): Record<string, TaskPosition> {
  const result: Record<string, TaskPosition> = {};
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of allKeys) {
    const ta = a[key];
    const tb = b[key];

    if (ta && tb) {
      // Both exist — lerp all numeric properties
      result[key] = {
        from: t < 0.5 ? ta.from : tb.from,
        to: t < 0.5 ? ta.to : tb.to,
        t: lerp(ta.t, tb.t, t),
        opacity: lerp(ta.opacity, tb.opacity, t),
        scale: lerp(ta.scale, tb.scale, t),
      };
    } else if (ta) {
      // Fading out — only in scene A
      result[key] = { ...ta, opacity: lerp(ta.opacity, 0, t) };
    } else if (tb) {
      // Fading in — only in scene B
      result[key] = { ...tb, opacity: lerp(0, tb.opacity, t) };
    }
  }
  return result;
}

/** Interpolate between two scene states. */
function lerpScene(a: SceneState, b: SceneState, t: number): SceneState {
  return {
    tasks: lerpTasks(a.tasks, b.tasks, t),
    highlights: lerpRecord(a.highlights, b.highlights, t),
    dims: lerpRecord(a.dims, b.dims, t),
  };
}

/**
 * Given an array of keyframe scenes and a continuous scroll progress,
 * returns the interpolated scene state.
 *
 * progress=0 → steps[0]
 * progress=0.5 → halfway between steps[0] and steps[1]
 * progress=1 → steps[1]
 */
export function interpolateScene(
  steps: SceneState[],
  progress: number,
): SceneState {
  if (steps.length === 0) {
    return { tasks: {}, highlights: {}, dims: {} };
  }
  if (steps.length === 1 || progress <= 0) {
    return steps[0]!;
  }
  if (progress >= steps.length - 1) {
    return steps[steps.length - 1]!;
  }

  const i = Math.floor(progress);
  const t = progress - i;
  return lerpScene(steps[i]!, steps[i + 1]!, t);
}
