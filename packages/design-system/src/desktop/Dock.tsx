import { useState, type ReactNode } from "react";

import { Box } from "../primitives";

export interface DockProps {
  children: ReactNode;
}

/** A floating macOS-style dock, pinned to the bottom-centre of its parent. */
export function Dock({ children }: DockProps) {
  return (
    <Box
      style={{
        position: "absolute",
        bottom: 8,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "6px 16px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {children}
    </Box>
  );
}

export interface DockItemProps {
  /** Tooltip label shown on hover. */
  label: string;
  /** The icon (usually an emoji). */
  children: ReactNode;
}

/** A single dock icon that magnifies and shows a tooltip on hover. */
export function DockItem({ label, children }: DockItemProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Box
      title={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        fontSize: 28,
        cursor: "default",
        transform: hovered ? "scale(1.25) translateY(-4px)" : "scale(1)",
        transition: "transform 0.15s ease",
      }}
    >
      {children}
      {hovered && (
        <Box
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: 6,
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 11,
            whiteSpace: "nowrap",
            color: "#fff",
            background: "rgba(0,0,0,0.75)",
          }}
        >
          {label}
        </Box>
      )}
    </Box>
  );
}

/** A thin vertical separator for grouping dock items. */
export function DockDivider() {
  return <Box style={{ width: 1, height: 28, background: "rgba(255,255,255,0.15)" }} />;
}
