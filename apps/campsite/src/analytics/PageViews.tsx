import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    /** Set by GoatCounter's `count.js`, loaded from the stats host in index.html. */
    goatcounter?: { count: (vars?: { path?: string }) => void };
  }
}

/** Any of these is a person. A scraper fetches the page and does none of them. */
export const ENGAGEMENT_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

/**
 * The path a view is recorded under. A directory's page is served as
 * `index.html`, and its row reads as the directory; the query string stays,
 * since that is where an issue's campaign tag lives.
 */
export const viewPath = (pathname: string, search: string) =>
  `${pathname.replace(/\/index\.html$/, "/")}${search}`;

/**
 * Counts a page view once the visitor has done something, and every route
 * change after that. Nothing on load: the site is fetched far more often by
 * things that never scroll than by people, and a count that includes them
 * would say nothing about readers. `count.js` is loaded with `no_onload`, so
 * this is the only place a view is ever recorded.
 */
export default function PageViews() {
  const { pathname, search } = useLocation();
  const engaged = useRef(false);
  const counted = useRef<string | null>(null);

  const current = viewPath(pathname, search);

  useEffect(() => {
    const count = () => {
      if (counted.current === current) return;
      counted.current = current;
      window.goatcounter?.count({ path: current });
    };
    if (engaged.current) {
      count();
      return;
    }
    const engage = () => {
      engaged.current = true;
      for (const event of ENGAGEMENT_EVENTS) window.removeEventListener(event, engage);
      count();
    };
    for (const event of ENGAGEMENT_EVENTS) {
      window.addEventListener(event, engage, { passive: true, once: true });
    }
    return () => {
      for (const event of ENGAGEMENT_EVENTS) window.removeEventListener(event, engage);
    };
  }, [current]);

  return null;
}
