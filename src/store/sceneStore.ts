import { create } from 'zustand';
import type { TentDoorState, LaptopState, SceneName, FocusTarget } from '../types/scene';

interface SceneState {
  wakeUpDone: boolean;
  tentDoorState: TentDoorState;
  lanternOn: boolean;
  laptopState: LaptopState;
  laptopFocused: boolean;
  currentScene: SceneName;
  focusTarget: FocusTarget;
  setWakeUpDone: () => void;
  setTentDoorState: (s: TentDoorState) => void;
  toggleLantern: () => void;
  setLaptopState: (s: LaptopState) => void;
  setLaptopFocused: (f: boolean) => void;
  setCurrentScene: (s: SceneName) => void;
  setFocusTarget: (t: FocusTarget) => void;
}

export const useSceneStore = create<SceneState>()((set) => ({
  wakeUpDone: false,
  tentDoorState: 'open',
  lanternOn: true,
  laptopState: 'in-bag',
  laptopFocused: false,
  currentScene: 'tent',
  focusTarget: 'default',
  setWakeUpDone: () => set({ wakeUpDone: true }),
  setTentDoorState: (s) => set({ tentDoorState: s }),
  toggleLantern: () => set((state) => ({ lanternOn: !state.lanternOn })),
  setLaptopState: (s) => set({ laptopState: s }),
  setLaptopFocused: (f) => set({ laptopFocused: f }),
  setCurrentScene: (s) => set({ currentScene: s }),
  setFocusTarget: (t) => set({ focusTarget: t }),
}));

// Exported for audioManager subscriptions (no hook required)
export { useSceneStore as sceneStore };
