import { useState } from "react";

import { Badge } from "../../Badge";
import { Tile } from "../../Tile";

import styles from "./DesktopIcon.module.css";

export interface DesktopIconProps {
  /** Label shown under the icon. */
  label: string;
  /** Image URL. Falls back to a generated letter tile if it fails / is absent. */
  icon?: string;
  /** Tile/fallback accent colour. */
  color?: string;
  /** Show a "New" badge. */
  isNew?: boolean;
  onClick?: () => void;
}

/**
 * A launcher icon: image (or a `Tile` letter fallback), a label, and an optional
 * "New" badge. Pure chrome — the caller decides what it opens.
 */
export function DesktopIcon({ label, icon, color, isNew, onClick }: DesktopIconProps) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !icon || imgError;

  return (
    <button type="button" className={styles.button} onClick={onClick}>
      {showFallback ? (
        <Tile label={label} color={color} size="lg" />
      ) : (
        <img
          className={styles.icon}
          src={icon}
          alt={label}
          width={72}
          height={72}
          onError={() => setImgError(true)}
        />
      )}

      {isNew && (
        <span className={styles.badge}>
          <Badge tone="danger" variant="solid">
            New
          </Badge>
        </span>
      )}

      <span className={styles.label}>{label}</span>
    </button>
  );
}
