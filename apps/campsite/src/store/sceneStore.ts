import { create } from "zustand";

import type { TentDoorState, SceneName, FocusTarget } from "../types/scene";

interface SceneState {
  wakeUpDone: boolean;
  /** True once the loading screen has finished — i.e. the user is on the tent view. */
  sceneReady: boolean;
  tentDoorState: TentDoorState;
  lanternOn: boolean;
  laptopFocused: boolean;
  notepadFocused: boolean;
  /** Slug of the open blog post/window, or null. Mirrors /blog/:slug. */
  activePostSlug: string | null;
  currentScene: SceneName;
  focusTarget: FocusTarget;
  setWakeUpDone: () => void;
  setSceneReady: (v: boolean) => void;
  setTentDoorState: (s: TentDoorState) => void;
  toggleLantern: () => void;
  setLaptopFocused: (f: boolean) => void;
  setNotepadFocused: (f: boolean) => void;
  setActivePostSlug: (s: string | null) => void;
  setCurrentScene: (s: SceneName) => void;
  setFocusTarget: (t: FocusTarget) => void;
}

export const useSceneStore = create<SceneState>()((set) => ({
  wakeUpDone: false,
  sceneReady: false,
  tentDoorState: "open",
  lanternOn: true,
  laptopFocused: false,
  notepadFocused: false,
  activePostSlug: null,
  currentScene: "tent",
  focusTarget: "default",
  setWakeUpDone: () => set({ wakeUpDone: true }),
  setSceneReady: (v) => set({ sceneReady: v }),
  setTentDoorState: (s) => set({ tentDoorState: s }),
  toggleLantern: () => set((state) => ({ lanternOn: !state.lanternOn })),
  setLaptopFocused: (f) => set({ laptopFocused: f }),
  setNotepadFocused: (f) => set({ notepadFocused: f }),
  setActivePostSlug: (s) => set({ activePostSlug: s }),
  setCurrentScene: (s) => set({ currentScene: s }),
  setFocusTarget: (t) => set({ focusTarget: t }),
}));
