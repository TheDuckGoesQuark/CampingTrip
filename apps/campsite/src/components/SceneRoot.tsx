import { lazy, Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { OVERLAY_LINKS } from "../routing/overlays";
import { useSceneNavigate } from "../routing/useSceneNavigate";
import { useSessionStore } from "../store/sessionStore";
import CampfireLoadingScreen from "./CampfireLoadingScreen";
import ErrorBoundary from "./ErrorBoundary";
import OverlayTabBar from "./overlays/OverlayTabBar";

// Lazy-load the heavy 3D scene so the welcome screen renders instantly.
const TentScene = lazy(() => import("./TentScene/TentScene"));

/**
 * Layout route ("/"): the always-present tent, the loading screen and the tab
 * bar, with an <Outlet/> for the overlay routes. The URL is the single source of
 * truth — child routes declare which overlay is open; nothing here mirrors state
 * back to the URL.
 */
export default function SceneRoot() {
  const hasCompletedWelcome = useSessionStore((s) => s.hasCompletedWelcome);
  const location = useLocation();
  const navigateWithFocus = useSceneNavigate();

  // Deep link straight to an overlay: skip the welcome intro for this visit.
  useEffect(() => {
    if (location.pathname !== "/" && !useSessionStore.getState().hasCompletedWelcome) {
      useSessionStore.getState().completeWelcome();
    }
    // Runs once on mount — deep-link detection only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3D objects render inside the R3F Canvas and can't reach the router, so they
  // request navigation via a window event that we turn into a real route change.
  useEffect(() => {
    const onNavigate = (e: Event) => {
      const path = (e as CustomEvent<{ path: string }>).detail?.path;
      const link = OVERLAY_LINKS.find((l) => l.path === path);
      if (link) navigateWithFocus(link);
    };
    window.addEventListener("overlay-navigate", onNavigate);
    return () => window.removeEventListener("overlay-navigate", onNavigate);
  }, [navigateWithFocus]);

  const showTent = hasCompletedWelcome || location.pathname !== "/";

  return (
    <>
      {/* Campfire loading — always mounted, manages its own visibility/audio/fade */}
      <CampfireLoadingScreen />

      {showTent && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <TentScene visible={showTent} />
          </Suspense>
        </ErrorBoundary>
      )}

      {hasCompletedWelcome && <OverlayTabBar />}

      {/* Landing / Blog / Music / Notes */}
      <Outlet />
    </>
  );
}
