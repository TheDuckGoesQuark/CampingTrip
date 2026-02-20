import { create } from 'zustand';

interface InteractionState {
  hoveredId: string | null;
  focusedId: string | null;
  setHovered: (id: string | null) => void;
  setFocused: (id: string | null) => void;
}

export const useInteractionStore = create<InteractionState>()((set) => ({
  hoveredId: null,
  focusedId: null,
  setHovered: (id) => set({ hoveredId: id }),
  setFocused: (id) => set({ focusedId: id }),
}));
