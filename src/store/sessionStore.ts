import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
  soundEnabled: boolean;
  effectsEnabled: boolean;
  hasCompletedWelcome: boolean;
  lastVisitedAt: string | null;
  setSoundEnabled: (v: boolean) => void;
  setEffectsEnabled: (v: boolean) => void;
  completeWelcome: () => void;
  resetWelcome: () => void;
  updateLastVisited: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      effectsEnabled: true,
      hasCompletedWelcome: false,
      lastVisitedAt: null,
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setEffectsEnabled: (v) => set({ effectsEnabled: v }),
      completeWelcome: () => set({ hasCompletedWelcome: true }),
      resetWelcome: () => set({ hasCompletedWelcome: false }),
      updateLastVisited: () => set({ lastVisitedAt: new Date().toISOString() }),
    }),
    { name: 'campingtrip-session' }
  )
);
