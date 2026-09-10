import { createContext, useContext } from "react";

export type RenderTarget = "live" | "static";

export const RenderTargetContext = createContext<RenderTarget>("live");

export function useRenderTarget(): RenderTarget {
  return useContext(RenderTargetContext);
}

/**
 * The namespace the prerendered reader's ids live in. The built page keeps both
 * copies of a blog page in the DOM at once — the static `#reader` (hidden, but
 * still what printing renders) and the live app — so an id written once in the
 * source exists twice at runtime, and `#foo` resolves to whichever comes first
 * in document order. That is the reader's, every time.
 */
const READER_PREFIX = "reader-";

/**
 * Namespaces a hand-written id to the render it belongs to, so an
 * `aria-labelledby`, `aria-controls`, `for` or `href="#…"` can only ever reach
 * the half of the document it was written in.
 *
 * Both the reference and its target go through this, so each copy stays
 * internally consistent: the reader's link points at the reader's target, and
 * printing — which shows the reader and hides everything else — still works.
 *
 * Ids from React's `useId` need no equivalent: React mints them `_R_…` when a
 * server render produces them and `_r_…` when a client root does, and these two
 * renders are separate roots rather than a hydration pair, so the two spaces
 * cannot meet. `semantics.test.ts` holds that assumption to account.
 */
export function useDocumentId(id: string): string {
  return useRenderTarget() === "static" ? `${READER_PREFIX}${id}` : id;
}
