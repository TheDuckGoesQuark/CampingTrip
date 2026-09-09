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

/**
 * One entry in the sidebar feed: a stacked date, title, standfirst and tags.
 */
export function CompactPostSummary({ post }: PostSummaryProps) {
  const lastVisitedAt = useSessionStore((s) => s.lastVisitedAt);

  return (
    <li>
      <article className={styles.summary}>
        <div className={styles.titleLine}>
          <Text variant="label" tone="muted" as="span">
            <time dateTime={post.date}>{formatDate(post.date, "short")}</time>
          </Text>
          {isNewSince(lastVisitedAt, post.date) && (
            <Badge tone="accent" variant="solid">
              New
            </Badge>
          )}
        </div>
        <Text variant="body" as="h3">
          <Link render={<RouterLink to={blogPaths.post(slugify(post.title))} />}>
            <strong>{post.title}</strong>
          </Link>
        </Text>
        <Text variant="body-sm" tone="muted">
          {post.standfirst}
        </Text>
        <ul className={styles.tagList}>
          {post.tags.map((tag) => (
            <li key={tag}>
              <Tag>{tag}</Tag>
            </li>
          ))}
        </ul>
      </article>
    </li>
  );
}

/**
 * A full-width feed entry: the whole card is the link, with the date pulled out
 * into a gutter so a run of them scans by date without reading the titles. The
 * heading lives inside the link because the link's whole job is to name the post
 * — an anchor wrapping the heading would leave the card unnamed.
 */
export function PostSummaryCard({ post }: PostSummaryProps) {
  return (
    <li>
      <Card render={<RouterLink to={blogPaths.post(slugify(post.title))} />}>
        <div className={styles.cardInner}>
          <time className={styles.dateGutter} dateTime={post.date}>
            <Text variant="title-2" tone="link" as="span">
              {dayOfMonth(post.date)}
            </Text>
            <Text variant="label" tone="muted" as="span">
              {monthAndYear(post.date)}
            </Text>
          </time>
          <div className={styles.cardBody}>
            <Text variant="title-3" as="h2">
              {post.title}
            </Text>
            <Text tone="muted">{post.standfirst}</Text>
            <ul className={styles.tagList}>
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Tag>{tag}</Tag>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </li>
  );
}
