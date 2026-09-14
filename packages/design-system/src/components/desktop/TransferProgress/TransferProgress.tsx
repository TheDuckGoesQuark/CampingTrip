import { DesktopTower, EnvelopeSimple, Globe } from "@phosphor-icons/react";

import { Text } from "../../Text";

import styles from "./TransferProgress.module.css";

const ENDPOINT_PX = 26;
const PARCEL_PX = 18;

export interface TransferProgressProps {
  /** The announced line, and the only part of this a screen reader gets. */
  caption: string;
  from?: string;
  to?: string;
  /** Match it to how long the caller holds the wait open, or the bar sits full. */
  durationMs?: number;
}

/**
 * A file-copy dialog of that era, drawn. The diagram says nothing the caption
 * doesn't, so it is hidden rather than described.
 */
export function TransferProgress({
  caption,
  from = "This PC",
  to = "Internet",
  durationMs = 1600,
}: TransferProgressProps) {
  return (
    <div
      className={styles.transfer}
      role="status"
      style={{ "--transfer-duration": `${durationMs}ms` } as React.CSSProperties}
    >
      <div className={styles.wire} aria-hidden>
        <DesktopTower size={ENDPOINT_PX} weight="fill" />
        <div className={styles.span}>
          <EnvelopeSimple className={styles.parcel} size={PARCEL_PX} weight="fill" />
        </div>
        <Globe size={ENDPOINT_PX} weight="fill" />
      </div>

      <div className={styles.ends} aria-hidden>
        <Text variant="label" tone="muted" as="span">
          {from}
        </Text>
        <Text variant="label" tone="muted" as="span">
          {to}
        </Text>
      </div>

      <div className={styles.track} aria-hidden>
        <div className={styles.blocks} />
      </div>

      <Text variant="label" tone="muted" as="p">
        {caption}
      </Text>
    </div>
  );
}
