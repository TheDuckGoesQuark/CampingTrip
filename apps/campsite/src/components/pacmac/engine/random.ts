/**
 * Mulberry32: a seed in, a number in [0, 1) and the next seed out. Carried in
 * the state, so a game with the same inputs plays the same way, as the
 * arcade's patterns famously did.
 */
export function nextRandom(seed: number): [number, number] {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(next ^ (next >>> 15), 1 | next);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}
