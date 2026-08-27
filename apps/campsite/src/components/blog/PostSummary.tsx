import { Badge, Card, Link, Tag, Text } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { slugify } from "../../data/slug";
import { blogPaths } from "../../routing/blogPaths";
import { useSessionStore } from "../../store/sessionStore";
import type { Post } from "../../types/post";
import { dayOfMonth, formatDate, monthAndYear } from "./formatDate";
import { isNewSince } from "./isNewSince";

import styles from "./blog.module.css";

export interface PostSummaryProps {
  post: Post;
}

/** One entry in the sidebar feed: a stacked date, title, standfirst and tags. */
export function CompactPostSummary({ post }: PostSummaryProps) {
  const lastVisitedAt = useSessionStore((s) => s.lastVisitedAt);

  return (
    <div className={styles.summary}>
      <div className={styles.titleLine}>
        <Text variant="label" tone="muted" as="span">
          {formatDate(post.date, "short")}
        </Text>
        {isNewSince(lastVisitedAt, post.date) && (
          <Badge tone="accent" variant="solid">
            New
          </Badge>
        )}
      </div>
      <Link render={<RouterLink to={blogPaths.post(slugify(post.title))} />}>
        <Text variant="body" as="span">
          <strong>{post.title}</strong>
        </Text>
      </Link>
      <Text variant="body-sm" tone="muted">
        {post.standfirst}
      </Text>
      <div className={styles.tagRow}>
        {post.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
    </div>
  );
}

/**
 * A full-width feed entry: the whole card is the link, with the date pulled out
 * into a gutter so a run of them scans by date without reading the titles.
 */
export function PostSummaryCard({ post }: PostSummaryProps) {
  return (
    <Card render={<RouterLink to={blogPaths.post(slugify(post.title))} />}>
      <div className={styles.cardInner}>
        <div className={styles.dateGutter}>
          <Text variant="title-2" tone="link" as="span">
            {dayOfMonth(post.date)}
          </Text>
          <Text variant="label" tone="muted" as="span">
            {monthAndYear(post.date)}
          </Text>
        </div>
        <div className={styles.cardBody}>
          <Text variant="title-3" as="span">
            {post.title}
          </Text>
          <Text tone="muted">{post.standfirst}</Text>
          <div className={styles.tagRow}>
            {post.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
