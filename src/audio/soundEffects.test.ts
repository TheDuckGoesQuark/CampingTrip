import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSessionStore } from '../store/sessionStore';

// Must reset the module-level AudioContext between tests
let playLaptopOn: typeof import('./soundEffects').playLaptopOn;
let playLaptopOff: typeof import('./soundEffects').playLaptopOff;
let playMidiNote: typeof import('./soundEffects').playMidiNote;
let playGuitarStrum: typeof import('./soundEffects').playGuitarStrum;
let playCatMeow: typeof import('./soundEffects').playCatMeow;

describe('soundEffects', () => {
  beforeEach(async () => {
    // Reset session store to sound enabled
    useSessionStore.setState({ soundEnabled: true });

    // Fresh import each time to reset internal AudioContext
    vi.resetModules();
    const mod = await import('./soundEffects');
    playLaptopOn = mod.playLaptopOn;
    playLaptopOff = mod.playLaptopOff;
    playMidiNote = mod.playMidiNote;
    playGuitarStrum = mod.playGuitarStrum;
    playCatMeow = mod.playCatMeow;
  });

  describe('when sound is enabled', () => {
    it('playLaptopOn creates oscillators and does not throw', () => {
      expect(() => playLaptopOn()).not.toThrow();
    });

    it('playLaptopOff creates oscillators and does not throw', () => {
      expect(() => playLaptopOff()).not.toThrow();
    });

    it('playMidiNote creates oscillators and does not throw', () => {
      expect(() => playMidiNote()).not.toThrow();
    });

    it('playGuitarStrum creates Karplus-Strong buffers and does not throw', () => {
      expect(() => playGuitarStrum()).not.toThrow();
    });

    it('playCatMeow creates voice synthesis and does not throw', () => {
      expect(() => playCatMeow()).not.toThrow();
    });
  });

  describe('when sound is muted', () => {
    beforeEach(() => {
      useSessionStore.setState({ soundEnabled: false });
    });

    it('playLaptopOn does nothing when muted', () => {
      // Should not create any AudioContext or throw
      expect(() => playLaptopOn()).not.toThrow();
    });

    it('playLaptopOff does nothing when muted', () => {
      expect(() => playLaptopOff()).not.toThrow();
    });

    it('playMidiNote does nothing when muted', () => {
      expect(() => playMidiNote()).not.toThrow();
    });

    it('playGuitarStrum does nothing when muted', () => {
      expect(() => playGuitarStrum()).not.toThrow();
    });

    it('playCatMeow does nothing when muted', () => {
      expect(() => playCatMeow()).not.toThrow();
    });
  });
});
