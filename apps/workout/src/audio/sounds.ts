import { getAudioContext } from './audioContext';

/** Short beep for countdown ticks (3, 2, 1) */
export function playCountdownBeep() {
  const ac = getAudioContext();
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 880;

  const env = ac.createGain();
  env.gain.setValueAtTime(0.3, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

  osc.connect(env).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.15);
  setTimeout(() => env.disconnect(), 200);
}

/** Higher pitch "Go!" sound */
export function playGoSound() {
  const ac = getAudioContext();
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.linearRampToValueAtTime(1320, t + 0.1);

  const env = ac.createGain();
  env.gain.setValueAtTime(0.35, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

  osc.connect(env).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.3);
  setTimeout(() => env.disconnect(), 400);
}

/** Gentle beep for timer warning (last 5 seconds) */
export function playTimerWarning() {
  const ac = getAudioContext();
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 660;

  const env = ac.createGain();
  env.gain.setValueAtTime(0.15, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

  osc.connect(env).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.1);
  setTimeout(() => env.disconnect(), 150);
}

/** Completion chime — two ascending tones */
export function playCompleteSound() {
  const ac = getAudioContext();
  const t = ac.currentTime;

  [523, 784].forEach((freq, i) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const env = ac.createGain();
    const start = t + i * 0.15;
    env.gain.setValueAtTime(0.25, start);
    env.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

    osc.connect(env).connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.3);
    setTimeout(() => env.disconnect(), (i * 150) + 400);
  });
}
