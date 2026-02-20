import { create } from 'zustand';
import type { ActiveOverlay } from '../types/scene';

interface UIState {
  hoveredObject: string | null;
  activeOverlay: ActiveOverlay;
  setHoveredObject: (id: string | null) => void;
  setActiveOverlay: (o: ActiveOverlay) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  hoveredObject: null,
  activeOverlay: 'none',
  setHoveredObject: (id) => set({ hoveredObject: id }),
  setActiveOverlay: (o) => set({ activeOverlay: o }),
}));
