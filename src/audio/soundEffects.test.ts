import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must reset modules between tests to get fresh AudioContext per module load.
// We also re-import useSessionStore each time since resetModules creates a new module graph.
let playLaptopOn: typeof import('./soundEffects').playLaptopOn;
let playLaptopOff: typeof import('./soundEffects').playLaptopOff;
let playMidiNote: typeof import('./soundEffects').playMidiNote;
let playGuitarStrum: typeof import('./soundEffects').playGuitarStrum;
let playCatMeow: typeof import('./soundEffects').playCatMeow;
let sessionStore: typeof import('../store/sessionStore').useSessionStore;

// Track the mock AudioContext instance created during each test
let mockCtx: AudioContext;

describe('soundEffects', () => {
  beforeEach(async () => {
    vi.resetModules();

    // Create a fresh mock AudioContext we can inspect
    mockCtx = new AudioContext();

    // Mock the audioContext module so getAudioContext returns our tracked instance
    vi.doMock('./audioContext', () => ({
      getAudioContext: () => mockCtx,
    }));

    // Re-import both the store and the module under test from the fresh module graph
    const storeMod = await import('../store/sessionStore');
    sessionStore = storeMod.useSessionStore;
    sessionStore.setState({ soundEnabled: true });

    const mod = await import('./soundEffects');
    playLaptopOn = mod.playLaptopOn;
    playLaptopOff = mod.playLaptopOff;
    playMidiNote = mod.playMidiNote;
    playGuitarStrum = mod.playGuitarStrum;
    playCatMeow = mod.playCatMeow;
  });

  describe('when sound is enabled', () => {
    it('playLaptopOn creates two oscillators for ascending C5→E5 chirp', () => {
      playLaptopOn();
      // Two sine oscillators (C5=523Hz, E5=659Hz) + master gain + 2 envelope gains
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
      expect(mockCtx.createGain).toHaveBeenCalledTimes(3); // master + 2 envelopes
    });

    it('playLaptopOff creates two oscillators for descending E5→A4 chirp', () => {
      playLaptopOff();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
      expect(mockCtx.createGain).toHaveBeenCalledTimes(3);
    });

    it('playMidiNote creates a sawtooth oscillator routed through a lowpass filter', () => {
      playMidiNote();
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockCtx.createBiquadFilter).toHaveBeenCalledTimes(1);
      expect(mockCtx.createGain).toHaveBeenCalledTimes(2); // master + envelope
    });

    it('playGuitarStrum creates 6 buffer sources for Karplus-Strong string plucks', () => {
      playGuitarStrum();
      // One buffer + one gain envelope per string in open G chord (6 strings)
      expect(mockCtx.createBufferSource).toHaveBeenCalledTimes(6);
      expect(mockCtx.createBuffer).toHaveBeenCalledTimes(6);
    });

    it('playCatMeow creates voice + harmonic oscillators with formant bandpass filter', () => {
      playCatMeow();
      // voice oscillator + harmonic oscillator + noise buffer source
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
      // formant bandpass + noise bandpass
      expect(mockCtx.createBiquadFilter).toHaveBeenCalledTimes(2);
      // Noise buffer for breathiness
      expect(mockCtx.createBufferSource).toHaveBeenCalledTimes(1);
    });
  });

  describe('when sound is muted', () => {
    beforeEach(() => {
      sessionStore.setState({ soundEnabled: false });
    });

    it('playLaptopOn creates no audio nodes when muted', () => {
      playLaptopOn();
      expect(mockCtx.createOscillator).not.toHaveBeenCalled();
      expect(mockCtx.createGain).not.toHaveBeenCalled();
    });

    it('playLaptopOff creates no audio nodes when muted', () => {
      playLaptopOff();
      expect(mockCtx.createOscillator).not.toHaveBeenCalled();
    });

    it('playMidiNote creates no audio nodes when muted', () => {
      playMidiNote();
      expect(mockCtx.createOscillator).not.toHaveBeenCalled();
      expect(mockCtx.createBiquadFilter).not.toHaveBeenCalled();
    });

    it('playGuitarStrum creates no audio buffers when muted', () => {
      playGuitarStrum();
      expect(mockCtx.createBuffer).not.toHaveBeenCalled();
      expect(mockCtx.createBufferSource).not.toHaveBeenCalled();
    });

    it('playCatMeow creates no audio nodes when muted', () => {
      playCatMeow();
      expect(mockCtx.createOscillator).not.toHaveBeenCalled();
      expect(mockCtx.createBiquadFilter).not.toHaveBeenCalled();
    });
  });
});
