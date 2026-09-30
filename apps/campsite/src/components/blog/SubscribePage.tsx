import SubscribeForm from "./subscribe/SubscribeForm";

import styles from "./NoticePage.module.css";

/** The form on its own, for a link that is only about subscribing. */
export default function SubscribePage() {
  return (
    <div className={styles.page}>
      <SubscribeForm headingLevel="h1" />
    </div>
  );
}
