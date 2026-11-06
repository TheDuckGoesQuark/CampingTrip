import type { Syllable } from "./cues";

/**
 * Synthesised stand-ins, in the oscillator style of `src/audio/soundEffects.ts`.
 * Each takes the context and the node to play into, and schedules itself.
 */

function blip(
  ac: AudioContext,
  out: AudioNode,
  {
    at,
    from,
    to,
    length,
    type,
    level,
  }: {
    at: number;
    from: number;
    to: number;
    length: number;
    type: OscillatorType;
    level: number;
  },
) {
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + length);
  const env = ac.createGain();
  env.gain.setValueAtTime(level, at);
  env.gain.exponentialRampToValueAtTime(0.001, at + length);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

/**
 * A voice saying half a word: a buzz through a band-pass set where an "a"
 * vowel sits, with a hard consonant onset. "Mac" opens lower and nasal; "ka"
 * starts on a click of noise.
 */
export function synthBite(ac: AudioContext, out: AudioNode, syllable: Syllable) {
  const t = ac.currentTime;
  const length = 0.11;
  const voice = ac.createOscillator();
  voice.type = "sawtooth";
  const pitch = syllable === "mac" ? 210 : 190;
  voice.frequency.setValueAtTime(pitch, t);
  voice.frequency.exponentialRampToValueAtTime(pitch * 0.8, t + length);

  const vowel = ac.createBiquadFilter();
  vowel.type = "bandpass";
  vowel.Q.value = 4;
  vowel.frequency.setValueAtTime(syllable === "mac" ? 500 : 900, t);
  vowel.frequency.linearRampToValueAtTime(780, t + length / 2);

  const env = ac.createGain();
  env.gain.setValueAtTime(0.001, t);
  env.gain.exponentialRampToValueAtTime(0.9, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.001, t + length);

  voice.connect(vowel).connect(env).connect(out);
  voice.start(t);
  voice.stop(t + length + 0.02);

  if (syllable === "ka") {
    const clickLength = Math.round(ac.sampleRate * 0.015);
    const buffer = ac.createBuffer(1, clickLength, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < clickLength; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / clickLength);
    const click = ac.createBufferSource();
    click.buffer = buffer;
    const gain = ac.createGain();
    gain.gain.value = 0.5;
    click.connect(gain).connect(out);
    click.start(t);
  }
}

/** An original rising fanfare, square-wave like the arcade's, about as long as READY!. */
export function synthJingle(ac: AudioContext, out: AudioNode) {
  const t = ac.currentTime;
  const notes = [262, 330, 392, 523, 392, 523, 659, 784, 659, 784, 1047];
  const beat = 0.18;
  notes.forEach((frequency, i) => {
    const at = t + i * beat * (i >= notes.length - 1 ? 1.3 : 1);
    const length = i === notes.length - 1 ? beat * 4 : beat * 0.9;
    blip(ac, out, {
      at,
      from: frequency,
      to: frequency * 0.999,
      length,
      type: "square",
      level: 0.25,
    });
    blip(ac, out, {
      at,
      from: frequency / 2,
      to: frequency / 2,
      length,
      type: "triangle",
      level: 0.3,
    });
  });
}

/** A wobbling fall to nothing, then two plops. */
export function synthDeath(ac: AudioContext, out: AudioNode) {
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = "square";
  const wobble = ac.createOscillator();
  wobble.frequency.value = 9;
  const depth = ac.createGain();
  depth.gain.value = 40;
  wobble.connect(depth).connect(osc.frequency);
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(110, t + 1.2);
  const env = ac.createGain();
  env.gain.setValueAtTime(0.2, t);
  env.gain.linearRampToValueAtTime(0.001, t + 1.25);
  osc.connect(env).connect(out);
  for (const node of [osc, wobble]) {
    node.start(t);
    node.stop(t + 1.3);
  }
  for (const at of [1.32, 1.48]) {
    blip(ac, out, { at: t + at, from: 600, to: 120, length: 0.12, type: "square", level: 0.2 });
  }
}

export function synthFruit(ac: AudioContext, out: AudioNode) {
  const t = ac.currentTime;
  blip(ac, out, { at: t, from: 300, to: 1200, length: 0.18, type: "triangle", level: 0.4 });
  blip(ac, out, { at: t + 0.12, from: 600, to: 1800, length: 0.16, type: "triangle", level: 0.3 });
}

export function synthGhostEaten(ac: AudioContext, out: AudioNode) {
  const t = ac.currentTime;
  blip(ac, out, { at: t, from: 120, to: 1600, length: 0.4, type: "sawtooth", level: 0.18 });
}

/** The continuous siren under play: a wailing tone whose pitch is set from outside. */
export interface Siren {
  setLevel(level: number): void;
  stop(): void;
}

const SIREN_LOW = 380;
const SIREN_HIGH = 760;

export function startSiren(ac: AudioContext, out: AudioNode, level: number): Siren {
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = "triangle";
  const wail = ac.createOscillator();
  wail.frequency.value = 3;
  const depth = ac.createGain();
  depth.gain.value = 60;
  wail.connect(depth).connect(osc.frequency);
  const pitchFor = (l: number) => SIREN_LOW + (SIREN_HIGH - SIREN_LOW) * l;
  osc.frequency.setValueAtTime(pitchFor(level), t);
  const env = ac.createGain();
  env.gain.setValueAtTime(0.001, t);
  env.gain.linearRampToValueAtTime(0.06, t + 0.2);
  osc.connect(env).connect(out);
  osc.start(t);
  wail.start(t);
  return {
    setLevel(next) {
      osc.frequency.linearRampToValueAtTime(pitchFor(next), ac.currentTime + 0.5);
    },
    stop() {
      const now = ac.currentTime;
      env.gain.cancelScheduledValues(now);
      env.gain.setValueAtTime(env.gain.value, now);
      env.gain.linearRampToValueAtTime(0.001, now + 0.1);
      osc.stop(now + 0.12);
      wail.stop(now + 0.12);
    },
  };
}
