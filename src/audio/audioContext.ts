/**
 * Shared AudioContext singleton.
 *
 * Web Audio API contexts are expensive (each spawns an OS audio thread) and
 * mobile Safari caps the number you can have alive. All audio modules should
 * import from here rather than creating their own.
 */

let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
