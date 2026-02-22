import { create } from 'zustand';

interface MusicState {
  isOpen: boolean;
  currentTrackIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  open: () => void;
  close: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  setProgress: (p: number) => void;
  setDuration: (d: number) => void;
  setTrack: (index: number) => void;
}

export const useMusicStore = create<MusicState>()((set) => ({
  isOpen: false,
  currentTrackIndex: 0,
  isPlaying: false,
  progress: 0,
  duration: 0,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, isPlaying: false }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  next: () =>
    set((s) => ({ currentTrackIndex: s.currentTrackIndex + 1, progress: 0 })),
  prev: () =>
    set((s) => ({
      currentTrackIndex: Math.max(0, s.currentTrackIndex - 1),
      progress: 0,
    })),
  setProgress: (p) => set({ progress: p }),
  setDuration: (d) => set({ duration: d }),
  setTrack: (index) => set({ currentTrackIndex: index, progress: 0 }),
}));
