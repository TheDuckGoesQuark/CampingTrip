/**
 * Synthesised one-shot sound effects using Web Audio API.
 * No audio files needed — everything is generated from oscillators and noise.
 */

import { useSessionStore } from '../store/sessionStore';

let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Check if sound is enabled before playing */
function isMuted(): boolean {
  return !useSessionStore.getState().soundEnabled;
}

// ─── Laptop bleep on ────────────────────────────────────────────
// Two quick ascending sine tones — friendly power-on chirp
export function playLaptopOn() {
  if (isMuted()) return;
  const ac = getContext();
  const t = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.15;
  master.connect(ac.destination);

  // First tone: C5
  const osc1 = ac.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 523;
  const g1 = ac.createGain();
  g1.gain.setValueAtTime(0.3, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc1.connect(g1).connect(master);
  osc1.start(t);
  osc1.stop(t + 0.15);

  // Second tone: E5 (slightly delayed)
  const osc2 = ac.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 659;
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.001, t);
  g2.gain.setValueAtTime(0.3, t + 0.08);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc2.connect(g2).connect(master);
  osc2.start(t + 0.08);
  osc2.stop(t + 0.25);

  // Cleanup
  setTimeout(() => master.disconnect(), 400);
}

// ─── Laptop bleep off ───────────────────────────────────────────
// Descending two-tone — gentle power-down
export function playLaptopOff() {
  if (isMuted()) return;
  const ac = getContext();
  const t = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.12;
  master.connect(ac.destination);

  const osc1 = ac.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 659; // E5
  const g1 = ac.createGain();
  g1.gain.setValueAtTime(0.25, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc1.connect(g1).connect(master);
  osc1.start(t);
  osc1.stop(t + 0.12);

  const osc2 = ac.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 440; // A4
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.001, t);
  g2.gain.setValueAtTime(0.25, t + 0.06);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc2.connect(g2).connect(master);
  osc2.start(t + 0.06);
  osc2.stop(t + 0.22);

  setTimeout(() => master.disconnect(), 400);
}

// ─── MIDI keyboard note ─────────────────────────────────────────
// Sawtooth through a low-pass filter with a snappy envelope — classic synth stab
export function playMidiNote() {
  if (isMuted()) return;
  const ac = getContext();
  const t = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.12;
  master.connect(ac.destination);

  // Pick a random note from a pentatonic scale for variety
  const notes = [262, 294, 330, 392, 440, 523, 587, 659];
  const freq = notes[Math.floor(Math.random() * notes.length)];

  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;

  // Low-pass filter with envelope for that classic synth "pluck"
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 5;
  filter.frequency.setValueAtTime(3000, t);
  filter.frequency.exponentialRampToValueAtTime(300, t + 0.3);

  const env = ac.createGain();
  env.gain.setValueAtTime(0.4, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

  osc.connect(filter).connect(env).connect(master);
  osc.start(t);
  osc.stop(t + 0.45);

  setTimeout(() => master.disconnect(), 600);
}

// ─── Guitar strum ───────────────────────────────────────────────
// Karplus-Strong plucked string synthesis — multiple strings with staggered timing
export function playGuitarStrum() {
  if (isMuted()) return;
  const ac = getContext();
  const t = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.1;
  master.connect(ac.destination);

  // Open G chord frequencies
  const strings = [196, 247, 294, 392, 494, 587];

  strings.forEach((freq, i) => {
    const delay = i * 0.025; // strum timing
    pluckString(ac, master, freq, t + delay, 1.5);
  });

  setTimeout(() => master.disconnect(), 2500);
}

/** Single Karplus-Strong plucked string */
function pluckString(
  ac: AudioContext,
  destination: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
) {
  const sr = ac.sampleRate;
  const periodSamples = Math.round(sr / freq);
  const totalSamples = Math.round(sr * duration);
  const buffer = ac.createBuffer(1, totalSamples, sr);
  const data = buffer.getChannelData(0);

  // Initialize the delay line with noise burst
  for (let i = 0; i < periodSamples; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  // Feedback with averaging filter (Karplus-Strong)
  const decay = 0.996;
  for (let i = periodSamples; i < totalSamples; i++) {
    data[i] = decay * 0.5 * (data[i - periodSamples] + data[i - periodSamples + 1]);
  }

  const source = ac.createBufferSource();
  source.buffer = buffer;

  // Gentle envelope to avoid clicks
  const env = ac.createGain();
  env.gain.setValueAtTime(0.5, startTime);
  env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  source.connect(env).connect(destination);
  source.start(startTime);
  source.stop(startTime + duration);
}

// ─── Cat meow ───────────────────────────────────────────────────
// Frequency-swept oscillator through formant filters — charmingly retro
export function playCatMeow() {
  if (isMuted()) return;
  const ac = getContext();
  const t = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.13;
  master.connect(ac.destination);

  // Main "voice" — sine wave with frequency sweep
  const voice = ac.createOscillator();
  voice.type = 'sine';
  // Meow: rise then fall in pitch
  voice.frequency.setValueAtTime(500, t);
  voice.frequency.linearRampToValueAtTime(750, t + 0.12);
  voice.frequency.linearRampToValueAtTime(650, t + 0.25);
  voice.frequency.linearRampToValueAtTime(400, t + 0.5);
  voice.frequency.linearRampToValueAtTime(300, t + 0.65);

  // Add a subtle harmonic for richness
  const harmonic = ac.createOscillator();
  harmonic.type = 'triangle';
  harmonic.frequency.setValueAtTime(1000, t);
  harmonic.frequency.linearRampToValueAtTime(1500, t + 0.12);
  harmonic.frequency.linearRampToValueAtTime(1300, t + 0.25);
  harmonic.frequency.linearRampToValueAtTime(800, t + 0.5);
  harmonic.frequency.linearRampToValueAtTime(600, t + 0.65);

  const harmonicGain = ac.createGain();
  harmonicGain.gain.value = 0.15;

  // "Mouth" formant filter — bandpass that sweeps for the "ee-ow" shape
  const formant = ac.createBiquadFilter();
  formant.type = 'bandpass';
  formant.Q.value = 3;
  formant.frequency.setValueAtTime(800, t);
  formant.frequency.linearRampToValueAtTime(1200, t + 0.15);
  formant.frequency.linearRampToValueAtTime(600, t + 0.5);

  // Amplitude envelope: short attack, sustain, gentle release
  const env = ac.createGain();
  env.gain.setValueAtTime(0.001, t);
  env.gain.linearRampToValueAtTime(0.5, t + 0.05);
  env.gain.setValueAtTime(0.5, t + 0.15);
  env.gain.linearRampToValueAtTime(0.35, t + 0.35);
  env.gain.linearRampToValueAtTime(0.001, t + 0.65);

  // A tiny bit of noise for breathiness
  const noiseLen = Math.round(ac.sampleRate * 0.7);
  const noiseBuf = ac.createBuffer(1, noiseLen, ac.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.03;
  }
  const noise = ac.createBufferSource();
  noise.buffer = noiseBuf;
  const noiseFilter = ac.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 1000;
  noiseFilter.Q.value = 1;

  // Wire it all up
  voice.connect(formant);
  harmonic.connect(harmonicGain).connect(formant);
  formant.connect(env).connect(master);
  noise.connect(noiseFilter).connect(env);

  voice.start(t);
  voice.stop(t + 0.7);
  harmonic.start(t);
  harmonic.stop(t + 0.7);
  noise.start(t);
  noise.stop(t + 0.7);

  setTimeout(() => master.disconnect(), 1000);
}
