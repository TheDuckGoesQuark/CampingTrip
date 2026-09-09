import type { IconName } from "@jordanscamp/ds";

/**
 * Something on the CatOS desktop. Each kind opens a different kind of window —
 * which, in the design system, means a different set of `Window` subparts. The
 * browser is the only one of these with tabs and an address bar.
 */
export type DesktopItem =
  /**
   * Launches its target; never a window of its own. Alone among the kinds it
   * names its glyph, because what an app launches is not a fact about apps.
   */
  | { kind: "app"; label: string; opens: string; glyph: IconName }
  | { kind: "image"; label: string; caption: string; dimensions: string; size: string }
  | { kind: "text"; label: string; mode: string; body: string }
  | { kind: "video"; label: string; videoId: string; caption: string; duration: string }
  | { kind: "bin"; label: string; contents: string[] };

/** The desktop label a URL is built from. */
export type DesktopItemKind = DesktopItem["kind"];
