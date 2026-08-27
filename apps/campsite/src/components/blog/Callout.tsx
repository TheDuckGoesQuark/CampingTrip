import { Card, Icon, Text, type IconName } from "@jordanscamp/ds";
import type { ReactNode } from "react";

import styles from "./blog.module.css";

export interface CalloutProps {
  icon: IconName;
  title: string;
  body: string;
  /** The one action the callout exists to offer. */
  action: ReactNode;
}

/**
 * An aside pointing somewhere else on the site. Local to the blog rather than in
 * the design system: one consumer so far, and the DS asks for three before a
 * composition graduates.
 */
export default function Callout({ icon, title, body, action }: CalloutProps) {
  return (
    <Card tone="subtle" elevation="floating">
      <div className={styles.callout}>
        <Icon name={icon} size="lg" />
        <div className={styles.calloutBody}>
          <Text variant="title-4" as="p">
            {title}
          </Text>
          <Text variant="body-sm" tone="muted">
            {body}
          </Text>
        </div>
        <div className={styles.calloutAction}>{action}</div>
      </div>
    </Card>
  );
}
