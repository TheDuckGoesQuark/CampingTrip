import { Icon, Window } from "@jordanscamp/ds";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { playSoftClick } from "../../audio/soundEffects";
import {
  iconOfBlogPage,
  resolveBlogPage,
  titleOfBlogPage,
  type BrowserPage,
} from "../../data/blogPages";
import { blogPaths, parseBlogPath } from "../../routing/blogPaths";
import { routes } from "../../routing/navigation";
import { useSceneStore } from "../../store/sceneStore";
import BlogPageView from "../blog/BlogPageView";
import type { WindowFrameProps } from "./windowFrame";

import styles from "./catos.module.css";

/** Not `location.origin`: a `localhost:5173` address would break the illusion. */
const SITE_ORIGIN = "https://jordanscamp.site";

function browserPageAt(path: string): BrowserPage | null {
  const ref = parseBlogPath(path);
  if (!ref) return null;
  const page = resolveBlogPage(ref);
  // Narrow on the resolved page, not the ref: a desktop item is not a tab.
  return page && page.kind !== "desk" ? page : null;
}

export interface BrowserWindowProps extends WindowFrameProps {
  page: BrowserPage;
  onClose: () => void;
}

/**
 * CatNav — the mock browser. Owns the tab strip and the address bar, which is
 * what distinguishes it from the desktop's other windows.
 */
export default function BrowserWindow({ page, onClose, ...frame }: BrowserWindowProps) {
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();
  const browserPath = useSceneStore((s) => s.browserPath);
  const openBlogPaths = useSceneStore((s) => s.openBlogPaths);
  const [reloadCount, setReloadCount] = useState(0);

  const openTabs = useMemo(
    () =>
      openBlogPaths
        .map((path) => ({ path, page: browserPageAt(path) }))
        .filter((tab): tab is { path: string; page: BrowserPage } => tab.page !== null),
    [openBlogPaths],
  );

  /** A new tab lands on the homepage — the desktop holds no content to pick from. */
  const newTab = useCallback(() => {
    playSoftClick();
    navigate(blogPaths.home);
  }, [navigate]);

  /** Only navigates if the closed tab was on screen; focus falls right, else left. */
  const closeTab = useCallback(
    (path: string) => {
      const scene = useSceneStore.getState();
      const index = scene.openBlogPaths.indexOf(path);
      const remaining = scene.openBlogPaths.filter((p) => p !== path);
      playSoftClick();
      scene.closeBlogPath(path);
      if (path !== scene.browserPath) return;
      const next = remaining[index] ?? remaining[index - 1];
      navigate(next ?? routes.blog);
    },
    [navigate],
  );

  /**
   * A visitor who deep-linked straight to a page has nothing behind them, and a
   * Back that left the site would break the illusion worse than a greyed-out
   * one. Read from the history entry, so it needs re-reading per navigation.
   */
  const [canGoBack, setCanGoBack] = useState(false);
  useEffect(() => {
    setCanGoBack(((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0);
  }, [locationKey]);

  return (
    <Window {...frame}>
      <Window.TitleBar title={`${titleOfBlogPage(page)} — CatNav`} onClose={onClose} />
      <Window.Tabs>
        {openTabs.map((tab) => (
          <Window.Tab
            key={tab.path}
            label={titleOfBlogPage(tab.page)}
            icon={<Icon name={iconOfBlogPage(tab.page)} size="sm" />}
            active={tab.path === browserPath}
            onSelect={() => navigate(tab.path)}
            onClose={() => closeTab(tab.path)}
          />
        ))}
        <Window.NewTab onClick={newTab} />
      </Window.Tabs>
      <Window.AddressBar
        url={`${SITE_ORIGIN}${browserPath ?? ""}`}
        onBack={canGoBack ? () => navigate(-1) : undefined}
        onReload={() => setReloadCount((n) => n + 1)}
      />
      <Window.Body>
        {/* Re-keyed so the reload control actually remounts the page. */}
        <div key={`${browserPath}:${reloadCount}`} className={styles.pageBody}>
          <BlogPageView page={page} />
        </div>
      </Window.Body>
    </Window>
  );
}
