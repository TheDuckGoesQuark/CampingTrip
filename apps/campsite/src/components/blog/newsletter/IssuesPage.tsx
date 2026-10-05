import { Card, Text } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { issueSlug } from "../../../newsletter/renderIssue";
import { blogPaths } from "../../../routing/blogPaths";
import type { Issue } from "../../../types/newsletter";
import { formatDate } from "../formatDate";
import SubscribeForm from "../subscribe/SubscribeForm";

import styles from "./newsletter.module.css";

export const ISSUES_TITLE = "The newsletter";

export const NO_ISSUES_YET =
  "Nothing has gone out yet. The first issue lands when the next post does.";

/** Every issue that has been sent, newest first, each opening as it was sent; then the form. */
export default function IssuesPage({ issues }: { issues: Issue[] }) {
  return (
    <div className={styles.page}>
      <header>
        <Text variant="title-1">{ISSUES_TITLE}</Text>
      </header>

      {issues.length === 0 ? (
        <Text>{NO_ISSUES_YET}</Text>
      ) : (
        <ul className={styles.postList}>
          {issues.map((issue) => (
            <li key={issue.subject}>
              <Card tone="sunken" render={<RouterLink to={blogPaths.issue(issueSlug(issue))} />}>
                <Text variant="label" tone="muted" as="span">
                  <time dateTime={issue.date}>{formatDate(issue.date)}</time>
                </Text>
                <div className={styles.issueSubject}>
                  <Text variant="body-sm" as="span">
                    <strong>{issue.subject}</strong>
                  </Text>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <SubscribeForm />
    </div>
  );
}
