import { create } from 'zustand';
import type { TentDoorState, SceneName, FocusTarget } from '../types/scene';

interface SceneState {
  wakeUpDone: boolean;
  tentDoorState: TentDoorState;
  lanternOn: boolean;
  laptopFocused: boolean;
  notepadFocused: boolean;
  currentScene: SceneName;
  focusTarget: FocusTarget;
  setWakeUpDone: () => void;
  setTentDoorState: (s: TentDoorState) => void;
  toggleLantern: () => void;
  setLaptopFocused: (f: boolean) => void;
  setNotepadFocused: (f: boolean) => void;
  setCurrentScene: (s: SceneName) => void;
  setFocusTarget: (t: FocusTarget) => void;
}

export const useSceneStore = create<SceneState>()((set) => ({
  wakeUpDone: false,
  tentDoorState: 'open',
  lanternOn: true,
  laptopFocused: false,
  notepadFocused: false,
  currentScene: 'tent',
  focusTarget: 'default',
  setWakeUpDone: () => set({ wakeUpDone: true }),
  setTentDoorState: (s) => set({ tentDoorState: s }),
  toggleLantern: () => set((state) => ({ lanternOn: !state.lanternOn })),
  setLaptopFocused: (f) => set({ laptopFocused: f }),
  setNotepadFocused: (f) => set({ notepadFocused: f }),
  setCurrentScene: (s) => set({ currentScene: s }),
  setFocusTarget: (t) => set({ focusTarget: t }),
}));
