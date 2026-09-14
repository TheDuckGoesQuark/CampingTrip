import type { ColorScheme } from "@jordanscamp/ds";
import { useEffect, useState } from "react";

import { useSessionStore } from "../store/sessionStore";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function usePrefersDark(): boolean {
  const [dark, setDark] = useState(() => window.matchMedia(DARK_QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return dark;
}

/** The scheme CatOS wears: the visitor's pick, or the OS's while they have not picked. */
export function useColorScheme(): ColorScheme {
  const appearance = useSessionStore((s) => s.appearance);
  const prefersDark = usePrefersDark();
  if (appearance === "system") return prefersDark ? "dark" : "light";
  return appearance;
}
