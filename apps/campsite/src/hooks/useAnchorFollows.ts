import { useEffect, useState } from "react";

/**
 * Not `hashchange`: following the same hash a second time changes nothing about
 * the URL, so it never reports. Delegated from the document because the links
 * live in other pages' prose, and a page may grow more than one.
 */
export function useAnchorFollows(hash: string): number {
  const [follows, setFollows] = useState(0);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("a")?.getAttribute("href") === hash) setFollows((n) => n + 1);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [hash]);

  return follows;
}
