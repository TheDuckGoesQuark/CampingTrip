/**
 * Synthesised rain-on-tent ambience using Web Audio API.
 * Multiple noise layers with different filter profiles + LFO modulation
 * for natural fluctuation (gusts of heavier rain, lulls, drip patterns).
 */

import { getAudioContext } from './audioContext';

let masterGain: GainNode | null = null;
let sources: AudioBufferSourceNode[] = [];
let playing = false;
let lfoInterval: ReturnType<typeof setInterval> | null = null;
let dripInterval: ReturnType<typeof setTimeout> | null = null;

function createNoiseBuffer(context: AudioContext, seconds = 6): AudioBuffer {
  const sr = context.sampleRate;
  const length = sr * seconds;
  const buffer = context.createBuffer(2, length, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    // Brownian noise (deeper, more natural than white noise)
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Mix: 60% brownian (deep), 40% white (crispness/detail)
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5 * 0.6 + white * 0.4;
    }
  }
  return buffer;
}

function createWhiteBuffer(context: AudioContext, seconds = 4): AudioBuffer {
  const sr = context.sampleRate;
  const length = sr * seconds;
  const buffer = context.createBuffer(2, length, sr);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return buffer;
}

export function startRain(volume = 0.15) {
  if (playing) return;
  const context = getAudioContext();
  sources = [];

  masterGain = context.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(context.destination);

  // ── Layer 1: Deep rumble (rain body, heavy drops on fabric) ──
  const deepNoise = context.createBufferSource();
  deepNoise.buffer = createNoiseBuffer(context);
  deepNoise.loop = true;
  sources.push(deepNoise);

  const deepLP = context.createBiquadFilter();
  deepLP.type = 'lowpass';
  deepLP.frequency.value = 600;
  deepLP.Q.value = 0.7;

  const deepGain = context.createGain();
  deepGain.gain.value = 0.5;

  deepNoise.connect(deepLP);
  deepLP.connect(deepGain);
  deepGain.connect(masterGain);

  // ── Layer 2: Mid patter (individual drops on tent canvas) ──
  const midNoise = context.createBufferSource();
  midNoise.buffer = createWhiteBuffer(context);
  midNoise.loop = true;
  sources.push(midNoise);

  const midBP = context.createBiquadFilter();
  midBP.type = 'bandpass';
  midBP.frequency.value = 2200;
  midBP.Q.value = 0.8;

  const midGain = context.createGain();
  midGain.gain.value = 0.3;

  midNoise.connect(midBP);
  midBP.connect(midGain);
  midGain.connect(masterGain);

  // ── Layer 3: High shimmer (rain mist / splatter detail) ──
  const highNoise = context.createBufferSource();
  highNoise.buffer = createWhiteBuffer(context, 3);
  highNoise.loop = true;
  sources.push(highNoise);

  const highBP = context.createBiquadFilter();
  highBP.type = 'bandpass';
  highBP.frequency.value = 5500;
  highBP.Q.value = 0.5;

  const highGain = context.createGain();
  highGain.gain.value = 0.12;

  highNoise.connect(highBP);
  highBP.connect(highGain);
  highGain.connect(masterGain);

  // ── Layer 4: Staccato drips (heavy drops hitting tent canvas) ──
  // Random short bursts of low-frequency filtered noise — each is a
  // distinct "thud" like a fat raindrop smacking taut fabric.
  function scheduleDrip() {
    if (!playing || !masterGain) return;
    const t = context.currentTime;

    // Create a short noise burst
    const burstLen = 0.02 + Math.random() * 0.03; // 20–50ms
    const burstSamples = Math.round(context.sampleRate * burstLen);
    const dripBuf = context.createBuffer(1, burstSamples, context.sampleRate);
    const dripData = dripBuf.getChannelData(0);
    for (let i = 0; i < burstSamples; i++) {
      dripData[i] = Math.random() * 2 - 1;
    }

    const dripSource = context.createBufferSource();
    dripSource.buffer = dripBuf;

    // Low-pass filter for deep thud character
    const dripLP = context.createBiquadFilter();
    dripLP.type = 'lowpass';
    dripLP.frequency.value = 250 + Math.random() * 350; // 250–600 Hz
    dripLP.Q.value = 2 + Math.random() * 4; // resonant thump

    // Sharp attack, quick decay envelope
    const dripEnv = context.createGain();
    const vol = 0.15 + Math.random() * 0.25; // varying intensity
    dripEnv.gain.setValueAtTime(vol, t);
    dripEnv.gain.exponentialRampToValueAtTime(0.001, t + burstLen + 0.06);

    // Slight stereo panning for spatial interest
    const panner = context.createStereoPanner();
    panner.pan.value = (Math.random() - 0.5) * 1.4; // spread across stereo field

    dripSource.connect(dripLP).connect(dripEnv).connect(panner).connect(masterGain);
    dripSource.start(t);
    dripSource.stop(t + burstLen + 0.08);

    // Schedule next drip at random interval (80–350ms for a heavy shower)
    const nextDelay = 80 + Math.random() * 270;
    dripInterval = setTimeout(scheduleDrip, nextDelay);
  }
  // Kick off the drip loop
  scheduleDrip();

  // ── Slow LFO modulation for natural fluctuation (gusts) ──
  // Modulate the mid layer gain with a slow random walk
  let lfoValue = 0.3;
  lfoInterval = setInterval(() => {
    // Random walk: drift up or down, clamped
    lfoValue += (Math.random() - 0.48) * 0.06; // slight bias toward louder
    lfoValue = Math.max(0.15, Math.min(0.55, lfoValue));
    midGain.gain.linearRampToValueAtTime(lfoValue, context.currentTime + 2);

    // Also subtly shift the deep layer
    const deepVal = 0.35 + (Math.random() - 0.5) * 0.2;
    deepGain.gain.linearRampToValueAtTime(deepVal, context.currentTime + 3);
  }, 2500);

  // Fade in
  masterGain.gain.linearRampToValueAtTime(volume, context.currentTime + 2);

  // Start all layers
  deepNoise.start();
  midNoise.start();
  highNoise.start();
  playing = true;
}

export function setRainVolume(volume: number, fadeTime = 0.8) {
  if (!masterGain || !playing) return;
  const ctx = getAudioContext();
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + fadeTime);
}

export function stopRain(fadeTime = 1.5) {
  if (!masterGain || !playing) return;
  const ctx = getAudioContext();
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeTime);

  if (lfoInterval) {
    clearInterval(lfoInterval);
    lfoInterval = null;
  }
  if (dripInterval) {
    clearTimeout(dripInterval);
    dripInterval = null;
  }

  setTimeout(() => {
    sources.forEach((s) => { try { s.stop(); } catch (_) { /* */ } });
    sources = [];
    masterGain = null;
    playing = false;
  }, fadeTime * 1000 + 200);
}

export function isRainPlaying() {
  return playing;
}
