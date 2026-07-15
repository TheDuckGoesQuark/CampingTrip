import { useState } from "react";

import { Badge } from "../../Badge";

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
 * A launcher icon: image (or a generated letter tile fallback), a label, and an
 * optional "New" badge. Pure chrome — the caller decides what it opens. The
 * fallback tile colour is genuinely dynamic, so it's set via inline style (not a
 * consumer-facing escape hatch).
 */
export function DesktopIcon({ label, icon, color, isNew, onClick }: DesktopIconProps) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !icon || imgError;
  const bg = color ?? "#4a9eff";

  return (
    <button type="button" className={styles.button} onClick={onClick}>
      {showFallback ? (
        <span
          className={styles.fallback}
          style={{ background: `linear-gradient(135deg, ${bg}, ${bg}88)` }}
        >
          {label.charAt(0).toUpperCase()}
        </span>
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
