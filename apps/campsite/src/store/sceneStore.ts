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
  /**
   * Open tabs in the blog's browser window, in tab order. Deliberately absent
   * from the URL, which names only the *active* tab — otherwise a shared
   * /blog/:slug link would resurrect a stranger's open tabs.
   */
  openPostSlugs: string[];
  currentScene: SceneName;
  focusTarget: FocusTarget;
  setWakeUpDone: () => void;
  setSceneReady: (v: boolean) => void;
  setTentDoorState: (s: TentDoorState) => void;
  toggleLantern: () => void;
  setLaptopFocused: (f: boolean) => void;
  setNotepadFocused: (f: boolean) => void;
  setActivePostSlug: (s: string | null) => void;
  /** Idempotent — `applyOverlayState` calls it on every route change. */
  openPost: (slug: string) => void;
  closePost: (slug: string) => void;
  closeAllPosts: () => void;
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
  openPostSlugs: [],
  currentScene: "tent",
  focusTarget: "default",
  setWakeUpDone: () => set({ wakeUpDone: true }),
  setSceneReady: (v) => set({ sceneReady: v }),
  setTentDoorState: (s) => set({ tentDoorState: s }),
  toggleLantern: () => set((state) => ({ lanternOn: !state.lanternOn })),
  setLaptopFocused: (f) => set({ laptopFocused: f }),
  setNotepadFocused: (f) => set({ notepadFocused: f }),
  setActivePostSlug: (s) => set({ activePostSlug: s }),
  openPost: (slug) =>
    set((state) =>
      state.openPostSlugs.includes(slug)
        ? state
        : { openPostSlugs: [...state.openPostSlugs, slug] },
    ),
  closePost: (slug) =>
    set((state) => ({ openPostSlugs: state.openPostSlugs.filter((s) => s !== slug) })),
  closeAllPosts: () => set({ openPostSlugs: [] }),
  setCurrentScene: (s) => set({ currentScene: s }),
  setFocusTarget: (t) => set({ focusTarget: t }),
}));
