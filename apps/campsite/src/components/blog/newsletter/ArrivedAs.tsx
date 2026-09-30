import { Link, Text } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { sentIssues } from "../../../data/newsletters";
import { issueSlug } from "../../../newsletter/renderIssue";
import { useDocumentId } from "../../../prerender/renderTarget";
import { blogPaths } from "../../../routing/blogPaths";
import type { Post } from "../../../types/post";
import IssuePreview from "./IssuePreview";

import styles from "./newsletter.module.css";

export const ARRIVED_AS_HEADING = "How this reached subscribers";

/** The issue that announced a post, or `undefined` while none has gone out. */
export function issueThatAnnounced(post: Post) {
  return sentIssues.find((issue) => issue.posts.some((linked) => linked.title === post.title));
}

/**
 * Under a post: the issue that announced it, as it arrived. Nothing until one
 * has, so a reader is never shown an email nobody received.
 */
export default function ArrivedAs({ post }: { post: Post }) {
  const headingId = useDocumentId("arrived-as-heading");
  const issue = issueThatAnnounced(post);
  if (!issue) return null;
  return (
    <section className={styles.page} aria-labelledby={headingId}>
      <Text variant="title-3" as="h2" id={headingId}>
        {ARRIVED_AS_HEADING}
      </Text>
      <IssuePreview issue={issue} />
      <Text variant="body-sm" tone="muted">
        <Link render={<RouterLink to={blogPaths.issue(issueSlug(issue))} />}>This issue</Link>
        {" · "}
        <Link render={<RouterLink to={blogPaths.issues} />}>All issues</Link>
      </Text>
    </section>
  );
}
