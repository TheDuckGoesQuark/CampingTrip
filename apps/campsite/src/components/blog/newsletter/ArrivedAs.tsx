import { Button, Link, Text } from "@jordanscamp/ds";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { sentIssues } from "../../../data/newsletters";
import { useDocumentId } from "../../../prerender/renderTarget";
import { blogPaths } from "../../../routing/blogPaths";
import type { Post } from "../../../types/post";
import IssueEmail from "./IssueEmail";

import styles from "./newsletter.module.css";

export const ARRIVED_AS_HEADING = "Get the next blog post to your inbox";
export const ALL_ISSUES_LINK = "See all newsletters";
export const EXPAND_LABEL = "Show more";
export const COLLAPSE_LABEL = "Show less";

/** The issue that announced a post, or `undefined` while none has gone out. */
export function issueThatAnnounced(post: Post) {
  return sentIssues.find((issue) => issue.posts.some((linked) => linked.title === post.title));
}

/**
 * Under a post: the issue that announced it, folded to its top and fading into
 * the page until the reader asks for the rest. Nothing until one has gone out,
 * so a reader is never shown an email nobody received.
 */
export default function ArrivedAs({ post }: { post: Post }) {
  const headingId = useDocumentId("arrived-as-heading");
  const emailId = useDocumentId("arrived-as-email");
  const [open, setOpen] = useState(false);
  const issue = issueThatAnnounced(post);
  if (!issue) return null;
  return (
    <section className={styles.arrivedAs} aria-labelledby={headingId}>
      <Text variant="title-3" as="h2" id={headingId}>
        {ARRIVED_AS_HEADING}
      </Text>
      <div id={emailId} className={styles.fold} data-open={open || undefined}>
        <IssueEmail issue={issue} />
      </div>
      <div className={styles.foldActions}>
        <Button
          variant="subtle"
          size="sm"
          aria-expanded={open}
          aria-controls={emailId}
          onClick={() => setOpen(!open)}
        >
          {open ? COLLAPSE_LABEL : EXPAND_LABEL}
        </Button>
        <Text variant="body-sm" tone="muted">
          <Link render={<RouterLink to={blogPaths.issues} />}>{ALL_ISSUES_LINK}</Link>
        </Text>
      </div>
    </section>
  );
}
