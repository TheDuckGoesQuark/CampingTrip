import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { pathToState, stateToPath } from "../routing/paths";
import { useMusicStore } from "../store/musicStore";
import { useSceneStore } from "../store/sceneStore";
import { useSessionStore } from "../store/sessionStore";

/**
 * The single bridge between the URL and the existing zustand overlay flags.
 * There is no separate "route store" — routes drive the flags the scene already
 * uses (`sceneStore.laptopFocused` / `notepadFocused` / `activePostSlug`,
 * `musicStore.isOpen`). Sync is bidirectional and loop-guarded: each effect only
 * acts when the URL and the derived state genuinely diverge.
 *
 * Mounted once in <App>, above the welcome gate, so a deep link takes effect
 * before the scene mounts.
 */
export default function RouteSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const didInit = useRef(false);

  // URL → store. Runs on every pathname change.
  useEffect(() => {
    const next = pathToState(location.pathname);
    const scene = useSceneStore.getState();
    const music = useMusicStore.getState();

    if (scene.laptopFocused !== next.laptop) scene.setLaptopFocused(next.laptop);
    if (scene.notepadFocused !== next.notepad) scene.setNotepadFocused(next.notepad);
    if (scene.activePostSlug !== next.postSlug) scene.setActivePostSlug(next.postSlug);
    if (music.isOpen !== next.music) (next.music ? music.open : music.close)();

    // Deep link to a non-root route: skip the welcome intro for this visit so
    // the requested overlay shows over the loaded scene.
    if (!didInit.current) {
      didInit.current = true;
      if (location.pathname !== "/" && !useSessionStore.getState().hasCompletedWelcome) {
        useSessionStore.getState().completeWelcome();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Store → URL. When the scene opens/closes an overlay, reflect it in the URL.
  useEffect(() => {
    const sync = () => {
      const scene = useSceneStore.getState();
      const music = useMusicStore.getState();
      const path = stateToPath({
        laptop: scene.laptopFocused,
        notepad: scene.notepadFocused,
        music: music.isOpen,
        postSlug: scene.activePostSlug,
      });
      // window.location.pathname is the live value (avoids a stale closure).
      if (path !== window.location.pathname) navigate(path);
    };
    const unsubScene = useSceneStore.subscribe(sync);
    const unsubMusic = useMusicStore.subscribe(sync);
    return () => {
      unsubScene();
      unsubMusic();
    };
  }, [navigate]);

  return null;
}
