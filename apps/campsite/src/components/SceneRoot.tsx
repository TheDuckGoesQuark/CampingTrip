import { lazy, Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { overlayNavigation } from "../routing/navigation";
import { useSceneNavigate } from "../routing/useSceneNavigate";
import { useSceneStore } from "../store/sceneStore";
import { useSessionStore } from "../store/sessionStore";
import CampfireLoadingScreen from "./CampfireLoadingScreen";
import ErrorBoundary from "./ErrorBoundary";
import LaptopScreenOverlay from "./overlays/LaptopScreenOverlay";
import MusicPlayerOverlay from "./overlays/MusicPlayerOverlay";
import NotepadOverlay from "./overlays/NotepadOverlay";
import OverlayTabBar from "./overlays/OverlayTabBar";
import SettingsMenu from "./overlays/SettingsMenu";
import TimeOfDayArc from "./overlays/TimeOfDayArc";

// The heavy 3D scene (Three.js/R3F) is a lazy chunk — kept off the critical path
// so the blog/notes overlays can render without it.
const TentScene = lazy(() => import("./TentScene/TentScene"));

/** Routes whose overlay fully covers the viewport — the tent isn't visible, so a
 *  cold deep link to them shouldn't pay for the 3D scene at all. */
function isCoveringRoute(pathname: string): boolean {
  return pathname.startsWith("/blog") || pathname.startsWith("/notes");
}

/**
 * Layout route. Renders the overlays (HTML, no Canvas) as a top-level layer and
 * lazily mounts the 3D tent only when it's actually the backdrop. A cold deep
 * link to `/blog` / `/notes` paints instantly from CSS tokens; the tent chunk
 * prefetches in the background so returning to it stays smooth.
 */
export default function SceneRoot() {
  const hasCompletedWelcome = useSessionStore((s) => s.hasCompletedWelcome);
  const sceneReady = useSceneStore((s) => s.sceneReady);
  const location = useLocation();
  const navigateWithFocus = useSceneNavigate();

  const covering = isCoveringRoute(location.pathname);

  // Latch: the tent mounts once it's first needed (tent view, music, or any
  // in-session nav off a covering route) and stays mounted thereafter — so
  // opening the blog from the tent keeps the scene behind it, and closing is
  // instant. A cold load into a covering route starts it off.
  const [sceneActivated, setSceneActivated] = useState(!covering);
  useEffect(() => {
    if (!covering) setSceneActivated(true);
  }, [covering]);

  // Deep link straight to an overlay: skip the welcome intro for this visit.
  useEffect(() => {
    if (location.pathname !== "/" && !useSessionStore.getState().hasCompletedWelcome) {
      useSessionStore.getState().completeWelcome();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3D objects can't reach the router (they're inside the Canvas), so they ask
  // the overlayNavigation emitter to open something; we turn that into a route change.
  useEffect(() => overlayNavigation.subscribe(navigateWithFocus), [navigateWithFocus]);

  // Importing the chunk starts the models too — the `useGLTF.preload` calls sit
  // at its module scope — so a metered connection opts out.
  useEffect(() => {
    if (sceneActivated) return;
    const link = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    if (link?.saveData || /^(slow-)?2g$/.test(link?.effectiveType ?? "")) return;
    const prefetch = () => void import("./TentScene/TentScene");
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(prefetch);
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(prefetch, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showTent = sceneActivated && hasCompletedWelcome;
  const showChrome = hasCompletedWelcome && sceneReady;

  return (
    <>
      {/* Campfire loading — only on the tent-loading path, never for a blog deep link */}
      {showTent && <CampfireLoadingScreen />}

      {showTent && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <TentScene visible={showTent} />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Tent chrome. DOM order = keyboard tab order: blog → music → notes, settings, day/night. */}
      {showChrome && (
        <>
          <OverlayTabBar />
          <SettingsMenu />
          <TimeOfDayArc />
        </>
      )}

      {/* Overlay layer — HTML, renders independent of the 3D scene. Each self-gates
          on its store flag / Modal open, so this is the fast path for deep links. */}
      <LaptopScreenOverlay />
      <NotepadOverlay />
      <MusicPlayerOverlay />

      {/* Landing / Blog / Music / Notes route components (set the scene state) */}
      <Outlet />
    </>
  );
}
