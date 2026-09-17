import { Card } from "@demo/ds";

import styles from "./shared.module.css";

export function PhotoCard({ src }: { src: string }) {
  return (
    <Card>
      <div className={styles.cardBody}>
        <img src={src} alt="" />
      </div>
    </Card>
  );
}
