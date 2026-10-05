import type { Issue } from "../../../types/newsletter";
import IssueEmail from "./IssueEmail";

import styles from "./newsletter.module.css";

/** One issue's page: the email as it was sent, and nothing else. Its own heading is inside it. */
export default function IssuePage({ issue }: { issue: Issue }) {
  return (
    <article className={styles.page}>
      <h1 className={styles.visuallyHidden}>{issue.subject}</h1>
      <IssueEmail issue={issue} />
    </article>
  );
}
