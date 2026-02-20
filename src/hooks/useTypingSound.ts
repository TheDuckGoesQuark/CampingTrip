import { useRef, useCallback } from 'react';

// C pentatonic frequencies
const NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

export function useTypingSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const playNote = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = NOTES[Math.floor(Math.random() * NOTES.length)];

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  return playNote;
}
