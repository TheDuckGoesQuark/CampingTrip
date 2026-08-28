import { create } from "zustand";

import { frontWindow } from "../routing/windows";
import type { TentDoorState, SceneName, FocusTarget } from "../types/scene";

interface SceneState {
  wakeUpDone: boolean;
  /** True once the loading screen has finished — i.e. the user is on the tent view. */
  sceneReady: boolean;
  /** 0–100, pushed by the scene chunk — see TentScene/loadProgress.ts. */
  loadProgress: number;
  tentDoorState: TentDoorState;
  lanternOn: boolean;
  laptopFocused: boolean;
  notepadFocused: boolean;
  /**
   * Open windows on the CatOS desktop, back to front — the last is in front, and
   * the URL names it. Ids are `WINDOW_BROWSER` or a desktop item's own path.
   *
   * Session state, not URL state, for the same reason the tab strip is: one URL
   * can only name one window, and a shared link should not resurrect a
   * stranger's desktop.
   */
  openWindows: string[];
  /** Page shown in the browser window, or null when it holds nothing yet. */
  browserPath: string | null;
  /**
   * Open tabs in the browser window, in tab order. Paths rather than slugs,
   * because a tab can be a post, a tag, a project or a tool, and a path already
   * says which.
   */
  openBlogPaths: string[];
  currentScene: SceneName;
  focusTarget: FocusTarget;
  setWakeUpDone: () => void;
  setSceneReady: (v: boolean) => void;
  setLoadProgress: (p: number) => void;
  setTentDoorState: (s: TentDoorState) => void;
  toggleLantern: () => void;
  setLaptopFocused: (f: boolean) => void;
  setNotepadFocused: (f: boolean) => void;
  setBrowserPath: (p: string | null) => void;
  /** Opens a window if absent, and raises it either way. Idempotent. */
  raiseWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  closeAllWindows: () => void;
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
  loadProgress: 0,
  tentDoorState: "open",
  lanternOn: true,
  laptopFocused: false,
  notepadFocused: false,
  openWindows: [],
  browserPath: null,
  openBlogPaths: [],
  currentScene: "tent",
  focusTarget: "default",
  setWakeUpDone: () => set({ wakeUpDone: true }),
  setSceneReady: (v) => set({ sceneReady: v }),
  setLoadProgress: (p) => set({ loadProgress: p }),
  setTentDoorState: (s) => set({ tentDoorState: s }),
  toggleLantern: () => set((state) => ({ lanternOn: !state.lanternOn })),
  setLaptopFocused: (f) => set({ laptopFocused: f }),
  setNotepadFocused: (f) => set({ notepadFocused: f }),
  setBrowserPath: (p) => set({ browserPath: p }),
  raiseWindow: (id) =>
    set((state) =>
      frontWindow(state.openWindows) === id
        ? state
        : { openWindows: [...state.openWindows.filter((w) => w !== id), id] },
    ),
  closeWindow: (id) => set((state) => ({ openWindows: state.openWindows.filter((w) => w !== id) })),
  closeAllWindows: () => set({ openWindows: [] }),
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
