import type { ReactNode } from "react";

import { Box } from "../primitives";

export interface MenuBarProps {
  /** Left-aligned items (app name, menus). */
  left?: ReactNode;
  /** Right-aligned items (clock, status). */
  right?: ReactNode;
}

/**
 * A translucent desktop menu bar pinned to the top of its positioned parent.
 * Pure chrome: pass whatever belongs on the left and right.
 */
export function MenuBar({ left, right }: MenuBarProps) {
  return (
    <Box
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 28,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 12px",
        fontSize: 13,
        background: "color-mix(in oklab, var(--mantine-color-body), transparent 12%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--mantine-color-default-border)",
      }}
    >
      <Box style={{ display: "flex", alignItems: "center", gap: 20 }}>{left}</Box>
      <Box style={{ marginLeft: "auto", opacity: 0.7 }}>{right}</Box>
    </Box>
  );
}
