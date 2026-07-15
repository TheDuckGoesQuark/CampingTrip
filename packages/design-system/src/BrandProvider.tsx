import { MantineProvider, type MantineColorScheme } from "@mantine/core";
import type { ReactNode } from "react";

import { theme } from "./theme";

export interface BrandProviderProps {
  children: ReactNode;
  /** Colour scheme. Defaults to light (the green + ivory brand). */
  defaultColorScheme?: MantineColorScheme;
}

/**
 * Wraps the app in the brand theme. The brand's green + ivory palette is exposed
 * as static `--brand-*` tokens (see tokens/brand.css) for the few surfaces that
 * want them; everything else uses Mantine component props.
 */
export function BrandProvider({ children, defaultColorScheme = "light" }: BrandProviderProps) {
  return (
    <MantineProvider theme={theme} defaultColorScheme={defaultColorScheme}>
      <div className="jc-brand">{children}</div>
    </MantineProvider>
  );
}
