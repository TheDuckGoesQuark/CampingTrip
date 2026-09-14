import { BrandProvider } from "@jordanscamp/ds";
import type { ReactNode } from "react";

import { useColorScheme } from "../hooks/useColorScheme";
import { useSceneStore } from "../store/sceneStore";

/**
 * The brand, wearing CatOS's colour scheme only while CatOS is up. The
 * preference is the laptop's, not the tent's, so the scheme flips with the
 * takeover — which covers everything else while it does.
 */
export default function Brand({ children }: { children: ReactNode }) {
  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const scheme = useColorScheme();
  return <BrandProvider colorScheme={laptopFocused ? scheme : "light"}>{children}</BrandProvider>;
}
