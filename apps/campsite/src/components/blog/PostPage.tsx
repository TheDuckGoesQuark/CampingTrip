import { Button, Card, Tag, Text } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { posts } from "../../data/posts";
import { slugify } from "../../data/slug";
import { blogPaths } from "../../routing/blogPaths";

import "../../styles/blogProse.css";
import type { Post } from "../../types/post";
import { formatDate } from "./formatDate";
import ArrivedAs from "./newsletter/ArrivedAs";
import SiteLink from "./SiteLink";
import SubscribeForm from "./subscribe/SubscribeForm";

import shared from "./blog.module.css";
import styles from "./PostPage.module.css";

export interface PostPageProps {
  post: Post;
}

/** `posts` runs newest first, so the next index along is the older post. */
function neighbours(post: Post): { older?: Post; newer?: Post } {
  const index = posts.indexOf(post);
  return { older: posts[index + 1], newer: posts[index - 1] };
}

export default function PostPage({ post }: PostPageProps) {
  const { older, newer } = neighbours(post);

  return (
    <article className={styles.post}>
      <header>
        <div className={styles.postMeta}>
          <Text variant="label" tone="muted" as="span">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </Text>
          <ul className={shared.tagList}>
            {post.tags.map((tag) => (
              <li key={tag}>
                <Tag render={<RouterLink to={blogPaths.tag(tag)} />}>{tag}</Tag>
              </li>
            ))}
          </ul>
        </div>

        <Text variant="title-1">{post.title}</Text>
        <div className={styles.postStandfirst}>
          <Text variant="body-lg" tone="muted">
            {post.standfirst}
          </Text>
        </div>
      </header>

      <hr className={styles.rule} />
      <div className={`blog-prose ${styles.postBody}`}>{post.body}</div>

      <div className={styles.subscribe}>
        <ArrivedAs post={post} />
      </div>
      <div className={styles.subscribe}>
        <SubscribeForm />
      </div>

      <footer className={styles.postFooter}>
        <ReadNext older={older} newer={newer} />

        <div className={styles.allPosts}>
          <Button variant="subtle" size="sm" render={<RouterLink to={blogPaths.archive} />}>
            All posts
          </Button>
        </div>
      </footer>
    </article>
  );
}

/**
 * The newer post is the one a reader arriving from the archive has not read yet,
 * so it gets the card; on the newest post the older one takes its place.
 */
function ReadNext({ older, newer }: { older?: Post; newer?: Post }) {
  const next = newer ?? older;
  if (!next) {
    return null;
  }
  const behind = newer && older;

  return (
    <nav className={styles.readNext} aria-label="Read next">
      <Card
        tone="sunken"
        elevation="raised"
        render={<RouterLink to={blogPaths.post(slugify(next.title))} />}
      >
        <div className={styles.readNextMeta}>
          <Text variant="label" tone="muted" as="span">
            Read next
          </Text>
          <Text variant="body-sm" tone="muted" as="span">
            <time dateTime={next.date}>{formatDate(next.date, "short")}</time>
          </Text>
        </div>
        <div className={styles.readNextTitle}>
          <Text variant="title-4" as="span">
            {next.title}
          </Text>
        </div>
        <Text variant="body-sm" tone="muted" as="span">
          {next.standfirst}
        </Text>
        {/* Plain tags: a link inside the card's own link would be invalid markup. */}
        <ul className={`${shared.tagList} ${styles.readNextTags}`}>
          {next.tags.map((tag) => (
            <li key={tag}>
              <Tag>{tag}</Tag>
            </li>
          ))}
        </ul>
      </Card>

      {behind && (
        <div className={styles.readNextBehind}>
          <Text variant="label" tone="muted" as="span">
            ← Older · <time dateTime={behind.date}>{formatDate(behind.date, "short")}</time>
          </Text>
          <Text variant="body-sm">
            <SiteLink to={blogPaths.post(slugify(behind.title))}>{behind.title}</SiteLink>
          </Text>
        </div>
      )}
    </nav>
  );
}
