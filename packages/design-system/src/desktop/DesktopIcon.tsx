import { useState } from "react";

import { Badge, Box, Text } from "../primitives";

export interface DesktopIconProps {
  /** Label shown under the icon. */
  label: string;
  /** Image URL for the icon. Falls back to a generated tile if it fails to load. */
  icon?: string;
  /** Tile/fallback accent colour. */
  color?: string;
  /** Show a "New" badge. */
  isNew?: boolean;
  onClick?: () => void;
}

/**
 * A launcher icon: image (or a generated letter tile as fallback), a label, and
 * an optional "New" badge. Pure chrome — the caller decides what it opens.
 */
export function DesktopIcon({ label, icon, color, isNew, onClick }: DesktopIconProps) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const showFallback = !icon || imgError;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        width: 120,
        padding: "12px 8px",
        border: "none",
        borderRadius: 12,
        cursor: "pointer",
        background: hovered ? "rgba(255,255,255,0.08)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      {showFallback ? (
        <FallbackTile label={label} color={color} />
      ) : (
        <img
          src={icon}
          alt={label}
          width={72}
          height={72}
          onError={() => setImgError(true)}
          style={{ borderRadius: 14, objectFit: "cover" }}
        />
      )}

      {isNew && (
        <Badge color="red" size="xs" style={{ position: "absolute", top: 6, right: 14 }}>
          New
        </Badge>
      )}

      <Text
        size="sm"
        ta="center"
        lineClamp={2}
        style={{ maxWidth: 110, color: "var(--mantine-color-text)" }}
      >
        {label}
      </Text>
    </button>
  );
}

function FallbackTile({ label, color }: { label: string; color?: string }) {
  const bg = color ?? "#4a9eff";
  return (
    <Box
      style={{
        width: 72,
        height: 72,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        fontWeight: 700,
        color: "#fff",
        background: `linear-gradient(135deg, ${bg}, ${bg}88)`,
        boxShadow: `0 2px 8px ${bg}44`,
      }}
    >
      {label.charAt(0).toUpperCase()}
    </Box>
  );
}
