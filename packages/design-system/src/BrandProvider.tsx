import { useEffect, type ReactNode } from "react";

export type ColorScheme = "light" | "dark";

export interface BrandProviderProps {
  children: ReactNode;
  /** Colour scheme. Defaults to light (the green + ivory brand). */
  colorScheme?: ColorScheme;
}

/**
 * Applies the brand: a `.jc-brand` wrapper (brand font + base ink) and the
 * colour scheme. The scheme is written as `data-theme` on <html> — not just the
 * wrapper — so Base UI dialogs, which portal to <body> outside this subtree,
 * still re-theme through the token cascade. Tokens themselves come from
 * `@jordanscamp/ds/tokens.css`, which the app imports once.
 */
export function BrandProvider({ children, colorScheme = "light" }: BrandProviderProps) {
  useEffect(() => {
    const root = document.documentElement;
    if (colorScheme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    return () => root.removeAttribute("data-theme");
  }, [colorScheme]);

  return <div className="jc-brand">{children}</div>;
}
