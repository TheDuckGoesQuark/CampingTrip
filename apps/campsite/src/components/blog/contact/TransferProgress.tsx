import { Text } from "@jordanscamp/ds";
import { DesktopTower, EnvelopeSimple, Globe } from "@jordanscamp/ds/icons";

import styles from "./contact.module.css";

const ENDPOINT_PX = 26;
const PARCEL_PX = 18;

/**
 * The sending phase, drawn the way a file-copy dialog of that era drew it. The
 * diagram says nothing the caption doesn't, so it is hidden rather than
 * described and the caption alone is what gets announced.
 */
export default function TransferProgress() {
  return (
    <div className={styles.transfer} role="status">
      <div className={styles.wire} aria-hidden>
        <DesktopTower size={ENDPOINT_PX} weight="fill" />
        <div className={styles.span}>
          <EnvelopeSimple className={styles.parcel} size={PARCEL_PX} weight="fill" />
        </div>
        <Globe size={ENDPOINT_PX} weight="fill" />
      </div>

      <div className={styles.ends} aria-hidden>
        <Text variant="label" tone="muted" as="span">
          This PC
        </Text>
        <Text variant="label" tone="muted" as="span">
          Internet
        </Text>
      </div>

      <div className={styles.track} aria-hidden>
        <div className={styles.blocks} />
      </div>

      <Text variant="label" tone="muted" as="p">
        Transferring… 1 of 1 message
      </Text>
    </div>
  );
}
