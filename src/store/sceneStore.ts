import { create } from 'zustand';
import type { TentDoorState, CatLocation, LaptopState, SceneName, FocusTarget } from '../types/scene';

interface SceneState {
  wakeUpDone: boolean;
  tentDoorState: TentDoorState;
  catLocation: CatLocation;
  lanternOn: boolean;
  laptopState: LaptopState;
  currentScene: SceneName;
  focusTarget: FocusTarget;
  setWakeUpDone: () => void;
  setTentDoorState: (s: TentDoorState) => void;
  setCatLocation: (l: CatLocation) => void;
  toggleLantern: () => void;
  setLaptopState: (s: LaptopState) => void;
  setCurrentScene: (s: SceneName) => void;
  setFocusTarget: (t: FocusTarget) => void;
}

export const useSceneStore = create<SceneState>()((set) => ({
  wakeUpDone: false,
  tentDoorState: 'closed',
  catLocation: 'sleeping',
  lanternOn: true,
  laptopState: 'in-bag',
  currentScene: 'tent',
  focusTarget: 'default',
  setWakeUpDone: () => set({ wakeUpDone: true }),
  setTentDoorState: (s) => set({ tentDoorState: s }),
  setCatLocation: (l) => set({ catLocation: l }),
  toggleLantern: () => set((state) => ({ lanternOn: !state.lanternOn })),
  setLaptopState: (s) => set({ laptopState: s }),
  setCurrentScene: (s) => set({ currentScene: s }),
  setFocusTarget: (t) => set({ focusTarget: t }),
}));

// Exported for audioManager subscriptions (no hook required)
export { useSceneStore as sceneStore };
