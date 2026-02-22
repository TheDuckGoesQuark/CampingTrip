/**
 * Synthesised campfire crackling using Web Audio API.
 * Low rumble base + random crackle/pop bursts for a cozy fire sound.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let baseSource: AudioBufferSourceNode | null = null;
let playing = false;
let crackleTimeout: ReturnType<typeof setTimeout> | null = null;

function getContext() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

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

export function startCampfire(volume = 0.18) {
  if (playing) return;
  const context = getContext();

  masterGain = context.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(context.destination);

  // Base rumble — low-passed noise for the body of the fire
  baseSource = context.createBufferSource();
  baseSource.buffer = createNoiseBuffer(context, 6);
  baseSource.loop = true;

  const baseLp = context.createBiquadFilter();
  baseLp.type = 'lowpass';
  baseLp.frequency.value = 400;
  baseLp.Q.value = 0.5;

  const baseGain = context.createGain();
  baseGain.gain.value = 0.35;

  baseSource.connect(baseLp).connect(baseGain).connect(masterGain);
  baseSource.start();

  // Crackle loop — random short noise bursts
  function scheduleCrackle() {
    if (!playing || !masterGain || !ctx) return;
    const ac = ctx;
    const t = ac.currentTime;

    const burstLen = 0.01 + Math.random() * 0.03;
    const samples = Math.round(ac.sampleRate * burstLen);
    const buf = ac.createBuffer(1, samples, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ac.createBufferSource();
    src.buffer = buf;

    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 800 + Math.random() * 2500;
    bp.Q.value = 1 + Math.random() * 3;

    const env = ac.createGain();
    const vol = 0.08 + Math.random() * 0.2;
    env.gain.setValueAtTime(vol, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + burstLen + 0.04);

    const pan = ac.createStereoPanner();
    pan.pan.value = (Math.random() - 0.5) * 0.8;

    src.connect(bp).connect(env).connect(pan).connect(masterGain);
    src.start(t);
    src.stop(t + burstLen + 0.06);

    crackleTimeout = setTimeout(scheduleCrackle, 40 + Math.random() * 180);
  }
  scheduleCrackle();

  // Fade in
  masterGain.gain.linearRampToValueAtTime(volume, context.currentTime + 1);
  playing = true;
}

export function stopCampfire(fadeTime = 1.0) {
  if (!masterGain || !ctx) return;
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeTime);

  if (crackleTimeout) {
    clearTimeout(crackleTimeout);
    crackleTimeout = null;
  }

  setTimeout(() => {
    try { baseSource?.stop(); } catch (_) { /* */ }
    baseSource = null;
    masterGain = null;
    playing = false;
  }, fadeTime * 1000 + 200);
}
