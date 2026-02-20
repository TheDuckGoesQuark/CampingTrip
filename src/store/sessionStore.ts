import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
  soundEnabled: boolean;
  effectsEnabled: boolean;
  hasCompletedWelcome: boolean;
  setSoundEnabled: (v: boolean) => void;
  setEffectsEnabled: (v: boolean) => void;
  completeWelcome: () => void;
  resetWelcome: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      effectsEnabled: true,
      hasCompletedWelcome: false,
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setEffectsEnabled: (v) => set({ effectsEnabled: v }),
      completeWelcome: () => set({ hasCompletedWelcome: true }),
      resetWelcome: () => set({ hasCompletedWelcome: false }),
    }),
    { name: 'campingtrip-session' }
  )
);
