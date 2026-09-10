import { createContext, useContext } from "react";

export type RenderTarget = "live" | "static";

export const RenderTargetContext = createContext<RenderTarget>("live");

export function useRenderTarget(): RenderTarget {
  return useContext(RenderTargetContext);
}

/**
 * A hand-written `id`, namespaced so the two copies of a page in a built
 * document cannot collide. See "Both copies of a page are in the document at
 * once" in `docs/architecture.md` — the failure it prevents does not reproduce
 * against the dev server.
 */
export function useDocumentId(id: string): string {
  return useRenderTarget() === "static" ? `reader-${id}` : id;
}
