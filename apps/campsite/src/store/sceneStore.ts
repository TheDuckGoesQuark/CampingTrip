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
  /** Path of the page in the blog's browser window, or null. Mirrors the URL. */
  activeBlogPath: string | null;
  /**
   * Open tabs in the blog's browser window, in tab order. Paths rather than
   * slugs, because a tab can be a post, a tag, a project or a tool, and a path
   * already says which. Deliberately absent from the URL, which names only the
   * *active* tab — otherwise a shared link would resurrect a stranger's tabs.
   */
  openBlogPaths: string[];
  currentScene: SceneName;
  focusTarget: FocusTarget;
  setWakeUpDone: () => void;
  setSceneReady: (v: boolean) => void;
  setTentDoorState: (s: TentDoorState) => void;
  toggleLantern: () => void;
  setLaptopFocused: (f: boolean) => void;
  setNotepadFocused: (f: boolean) => void;
  setActiveBlogPath: (p: string | null) => void;
  /** Idempotent — `applyOverlayState` calls it on every route change. */
  openBlogPath: (path: string) => void;
  closeBlogPath: (path: string) => void;
  closeAllBlogPaths: () => void;
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
  activeBlogPath: null,
  openBlogPaths: [],
  currentScene: "tent",
  focusTarget: "default",
  setWakeUpDone: () => set({ wakeUpDone: true }),
  setSceneReady: (v) => set({ sceneReady: v }),
  setTentDoorState: (s) => set({ tentDoorState: s }),
  toggleLantern: () => set((state) => ({ lanternOn: !state.lanternOn })),
  setLaptopFocused: (f) => set({ laptopFocused: f }),
  setNotepadFocused: (f) => set({ notepadFocused: f }),
  setActiveBlogPath: (p) => set({ activeBlogPath: p }),
  openBlogPath: (path) =>
    set((state) =>
      state.openBlogPaths.includes(path)
        ? state
        : { openBlogPaths: [...state.openBlogPaths, path] },
    ),
  closeBlogPath: (path) =>
    set((state) => ({ openBlogPaths: state.openBlogPaths.filter((p) => p !== path) })),
  closeAllBlogPaths: () => set({ openBlogPaths: [] }),
  setCurrentScene: (s) => set({ currentScene: s }),
  setFocusTarget: (t) => set({ focusTarget: t }),
}));
