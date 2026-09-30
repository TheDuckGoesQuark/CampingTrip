import { Button, Card, Text } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { slugify } from "../../../data/slug";
import { useDocumentId } from "../../../prerender/renderTarget";
import { blogPaths } from "../../../routing/blogPaths";
import type { Issue } from "../../../types/newsletter";
import { formatDate } from "../formatDate";
import SubscribeForm from "../subscribe/SubscribeForm";
import IssuePreview from "./IssuePreview";

import styles from "./newsletter.module.css";

/** One issue's page: as it arrived, then the posts it pointed at, then the form. */
export default function IssuePage({ issue }: { issue: Issue }) {
  const postsHeadingId = useDocumentId("issue-posts-heading");
  return (
    <article className={styles.page}>
      <header>
        <Text variant="label" tone="muted" as="span">
          <time dateTime={issue.date}>{formatDate(issue.date)}</time>
        </Text>
        <Text variant="title-1">{issue.subject}</Text>
      </header>

      <IssuePreview issue={issue} />

      <section aria-labelledby={postsHeadingId}>
        <Text variant="title-3" as="h2" id={postsHeadingId}>
          In this issue
        </Text>
        <ul className={styles.postList}>
          {issue.posts.map((post) => (
            <li key={post.title}>
              <Card tone="sunken" render={<RouterLink to={blogPaths.post(slugify(post.title))} />}>
                <Text variant="body-sm" as="span">
                  <strong>{post.title}</strong>
                </Text>
                <Text variant="body-sm" tone="muted">
                  {post.standfirst}
                </Text>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <SubscribeForm />

      <div>
        <Button variant="subtle" size="sm" render={<RouterLink to={blogPaths.issues} />}>
          All issues
        </Button>
      </div>
    </article>
  );
}
