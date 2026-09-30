import { Text } from "@jordanscamp/ds";

import { PRIVACY_TITLE, PRIVACY_UPDATED, privacyBody } from "../../data/privacy";

import "../../styles/blogProse.css";
import { formatDate } from "./formatDate";

import styles from "./NoticePage.module.css";

export default function PrivacyPage() {
  return (
    <article className={styles.page}>
      <header>
        <Text variant="title-1">{PRIVACY_TITLE}</Text>
        <Text variant="label" tone="muted" as="span">
          Updated <time dateTime={PRIVACY_UPDATED}>{formatDate(PRIVACY_UPDATED)}</time>
        </Text>
      </header>
      <div className="blog-prose">{privacyBody}</div>
    </article>
  );
}
