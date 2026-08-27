import { useState } from "react";

import { Badge } from "../../Badge";
import { Icon, type IconName } from "../../Icon";
import { Tile } from "../../Tile";

import styles from "./DesktopIcon.module.css";

export interface DesktopIconProps {
  /** Label shown under the icon. */
  label: string;
  /** Image URL. Preferred when it loads. */
  icon?: string;
  /** Drawn glyph, used when there is no image to show. */
  glyph?: IconName;
  /** Tile/fallback accent colour. */
  color?: string;
  /** Show a "New" badge. */
  isNew?: boolean;
  onClick?: () => void;
}

/**
 * A launcher icon, a label, and an optional "New" badge. Pure chrome — the
 * caller decides what it opens.
 *
 * What it draws, in order of preference: the `icon` image, a `glyph`, or a
 * `Tile` carrying the label's initial. An initial is legible but says nothing,
 * so it is the last resort rather than the default.
 */
export function DesktopIcon({ label, icon, glyph, color, isNew, onClick }: DesktopIconProps) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !icon || imgError;

  return (
    <button type="button" className={styles.button} onClick={onClick}>
      {showFallback ? (
        glyph ? (
          <span className={styles.glyph}>
            <Icon name={glyph} size="lg" />
          </span>
        ) : (
          <Tile label={label} color={color} size="lg" />
        )
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
