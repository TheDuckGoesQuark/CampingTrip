/**
 * Synthesised campfire crackling: low-passed noise for the body of the fire,
 * plus random short bursts for the crackles.
 *
 * Web Audio stays mute until the page has seen a user gesture, so `startCampfire`
 * declines to build a graph that would play to nobody and reports the failure
 * through `isCampfirePlaying`, leaving the caller to retry on one.
 */

import { getAudioContext } from "./audioContext";

let masterGain: GainNode | null = null;
let baseSource: AudioBufferSourceNode | null = null;
let playing = false;
let crackleTimeout: ReturnType<typeof setTimeout> | null = null;

function createNoiseBuffer(context: AudioContext, seconds: number): AudioBuffer {
  const sr = context.sampleRate;
  const length = sr * seconds;
  const buffer = context.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5 * 0.5 + white * 0.5;
  }
  return buffer;
}

/** Random short bursts, each reading as one crackle. Reschedules itself. */
function scheduleCrackle(context: AudioContext, into: GainNode) {
  const t = context.currentTime;

  const burstLen = 0.01 + Math.random() * 0.03;
  const samples = Math.round(context.sampleRate * burstLen);
  const buf = context.createBuffer(1, samples, context.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = context.createBufferSource();
  src.buffer = buf;

  const bp = context.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 800 + Math.random() * 2500;
  bp.Q.value = 1 + Math.random() * 3;

  const env = context.createGain();
  const vol = 0.08 + Math.random() * 0.2;
  env.gain.setValueAtTime(vol, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + burstLen + 0.04);

  const pan = context.createStereoPanner();
  pan.pan.value = (Math.random() - 0.5) * 0.8;

  src.connect(bp).connect(env).connect(pan).connect(into);
  src.start(t);
  src.stop(t + burstLen + 0.06);

  crackleTimeout = setTimeout(() => scheduleCrackle(context, into), 40 + Math.random() * 180);
}

export function startCampfire(volume = 0.18) {
  if (playing) return;
  const context = getAudioContext();
  if (context.state !== "running") return;

  masterGain = context.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(context.destination);

  baseSource = context.createBufferSource();
  baseSource.buffer = createNoiseBuffer(context, 6);
  baseSource.loop = true;

  const baseLp = context.createBiquadFilter();
  baseLp.type = "lowpass";
  baseLp.frequency.value = 400;
  baseLp.Q.value = 0.5;

  const baseGain = context.createGain();
  baseGain.gain.value = 0.35;

  baseSource.connect(baseLp).connect(baseGain).connect(masterGain);
  baseSource.start();

  scheduleCrackle(context, masterGain);

  masterGain.gain.linearRampToValueAtTime(volume, context.currentTime + 1);
  playing = true;
}

export function stopCampfire(fadeTime = 1.0) {
  if (!playing || !masterGain) return;
  const context = getAudioContext();

  // Detached before the fade so a relight during it builds a fresh graph
  // rather than racing the teardown timer for this one.
  const stopping = { gain: masterGain, base: baseSource };
  masterGain = null;
  baseSource = null;
  playing = false;

  if (crackleTimeout) {
    clearTimeout(crackleTimeout);
    crackleTimeout = null;
  }

  stopping.gain.gain.cancelScheduledValues(context.currentTime);
  stopping.gain.gain.setValueAtTime(stopping.gain.gain.value, context.currentTime);
  stopping.gain.gain.linearRampToValueAtTime(0, context.currentTime + fadeTime);

  setTimeout(
    () => {
      try {
        stopping.base?.stop();
      } catch {
        /* already stopped */
      }
      stopping.gain.disconnect();
    },
    fadeTime * 1000 + 200,
  );
}

export function isCampfirePlaying() {
  return playing;
}
