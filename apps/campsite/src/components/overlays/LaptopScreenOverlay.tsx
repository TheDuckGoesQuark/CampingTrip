import { Button, DesktopIcon, Icon, MenuBar, Modal, Window } from "@jordanscamp/ds";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { playSoftClick, playWindowOpen } from "../../audio/soundEffects";
import {
  iconOfBlogPage,
  resolveBlogPage,
  titleOfBlogPage,
  type BlogPage,
} from "../../data/blogPages";
import { blogPaths, parseBlogPath } from "../../routing/blogPaths";
import { routes } from "../../routing/navigation";
import { useSceneStore } from "../../store/sceneStore";
import { useSessionStore } from "../../store/sessionStore";
import BlogPageView from "../blog/BlogPageView";

/** Not `location.origin`: a `localhost:5173` address would break the illusion. */
const SITE_ORIGIN = "https://jordanscamp.site";

/** The desktop rail's width, matching the icon width plus its gutters. */
const RAIL_WIDTH = 148;

function pageAt(path: string | null): BlogPage | null {
  if (!path) return null;
  const ref = parseBlogPath(path);
  return ref ? resolveBlogPage(ref) : null;
}

/**
 * CatOS — the laptop's desktop, a full-screen Base UI takeover (so it traps
 * focus, returns focus on close, and handles Escape). Composes the DS
 * faux-desktop chrome (MenuBar, DesktopIcon, Window) with the campsite's content.
 *
 * The split: the browser owns everything worth reading, and the desktop owns
 * everything else. So the rail launches CatNav rather than listing content, and
 * CatNav opens a homepage instead of treating the desktop as its new-tab page.
 *
 * The open page is URL-driven (the path → `activeBlogPath`); the *set* of open
 * tabs is session state in the scene store.
 */
export default function LaptopScreenOverlay() {
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();
  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const activeBlogPath = useSceneStore((s) => s.activeBlogPath);
  const openBlogPaths = useSceneStore((s) => s.openBlogPaths);
  const [clock, setClock] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const prevFocused = useRef(false);

  const openTabs = useMemo(
    () =>
      openBlogPaths
        .map((path) => ({ path, page: pageAt(path) }))
        .filter((tab): tab is { path: string; page: BlogPage } => tab.page !== null),
    [openBlogPaths],
  );
  const activePage = useMemo(() => pageAt(activeBlogPath), [activeBlogPath]);

  // Update lastVisitedAt when leaving CatOS.
  useEffect(() => {
    if (prevFocused.current && !laptopFocused) {
      useSessionStore.getState().updateLastVisited();
    }
    prevFocused.current = laptopFocused;
  }, [laptopFocused]);

  // Live clock while open.
  useEffect(() => {
    if (!laptopFocused) return;
    const update = () =>
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [laptopFocused]);

  const closeWindow = useCallback(() => {
    useSceneStore.getState().closeAllBlogPaths();
    navigate(routes.blog);
  }, [navigate]);

  const open = useCallback(
    (path: string) => {
      navigate(path);
      playWindowOpen();
    },
    [navigate],
  );

  /** A new tab lands on the homepage — the desktop holds nothing to pick from. */
  const newTab = useCallback(() => {
    playSoftClick();
    navigate(blogPaths.home);
  }, [navigate]);

  // Base UI reports close intent (Escape). Close the open window first, else the
  // whole takeover — mirrors the layered Escape behaviour, no manual keydown.
  const onOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) return;
      playSoftClick();
      navigate(activePage ? routes.blog : routes.tent);
    },
    [activePage, navigate],
  );

  /** Only navigates if the closed tab was on screen; focus falls right, else left. */
  const closeTab = useCallback(
    (path: string) => {
      const scene = useSceneStore.getState();
      const index = scene.openBlogPaths.indexOf(path);
      const remaining = scene.openBlogPaths.filter((p) => p !== path);
      playSoftClick();
      scene.closeBlogPath(path);
      if (path !== scene.activeBlogPath) return;
      const next = remaining[index] ?? remaining[index - 1];
      navigate(next ?? routes.blog);
    },
    [navigate],
  );

  /**
   * A visitor who deep-linked straight to a page has nothing behind them, and a
   * Back that left the site would break the illusion worse than a greyed-out one.
   * Read from the history entry, so it needs re-reading per navigation.
   */
  const [canGoBack, setCanGoBack] = useState(false);
  useEffect(() => {
    setCanGoBack(((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0);
  }, [locationKey]);

  return (
    <Modal
      variant="takeover"
      open={laptopFocused}
      onOpenChange={onOpenChange}
      ariaLabel="CatOS — the laptop blog"
    >
      <div style={{ position: "absolute", inset: 0, userSelect: "none" }}>
        {/* Wallpaper — soft green → ivory */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, var(--brand-bg), var(--brand-surface))",
          }}
        />

        <MenuBar
          left={
            <>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="cat" size="md" />
                <span style={{ fontWeight: 700 }}>CatOS</span>
              </span>
              <span style={{ opacity: 0.7 }}>CatNav</span>
            </>
          }
          right={<span style={{ opacity: 0.7 }}>{clock}</span>}
        />

        <div
          style={{
            position: "absolute",
            top: 36,
            left: 0,
            width: RAIL_WIDTH,
            bottom: 0,
            overflowY: "auto",
            padding: "8px 12px",
          }}
        >
          <DesktopIcon label="CatNav" onClick={() => open(blogPaths.home)} />
        </div>

        {activePage && activeBlogPath && (
          <Window>
            <Window.TitleBar
              title={`${titleOfBlogPage(activePage)} — CatNav`}
              onClose={closeWindow}
            />
            <Window.Tabs>
              {openTabs.map(({ path, page }) => (
                <Window.Tab
                  key={path}
                  label={titleOfBlogPage(page)}
                  icon={<Icon name={iconOfBlogPage(page)} size="sm" />}
                  active={path === activeBlogPath}
                  onSelect={() => navigate(path)}
                  onClose={() => closeTab(path)}
                />
              ))}
              <Window.NewTab onClick={newTab} />
            </Window.Tabs>
            <Window.AddressBar
              url={`${SITE_ORIGIN}${activeBlogPath}`}
              onBack={canGoBack ? () => navigate(-1) : undefined}
              onReload={() => setReloadCount((n) => n + 1)}
            />
            <Window.Body>
              {/* Re-keyed so the reload control actually remounts the page. */}
              <div key={`${activeBlogPath}:${reloadCount}`} style={{ userSelect: "text" }}>
                <BlogPageView page={activePage} />
              </div>
            </Window.Body>
          </Window>
        )}

        {!activePage && (
          <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 5 }}>
            <Button variant="ghost" size="sm" onClick={() => navigate(routes.tent)}>
              Back to tent
              <span style={{ opacity: 0.5, marginLeft: 6 }}>Esc</span>
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
