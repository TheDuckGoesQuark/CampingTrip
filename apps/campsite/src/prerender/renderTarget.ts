import { createContext, useContext } from "react";

export type RenderTarget = "live" | "static";

export const RenderTargetContext = createContext<RenderTarget>("live");

export function useRenderTarget(): RenderTarget {
  return useContext(RenderTargetContext);
}
