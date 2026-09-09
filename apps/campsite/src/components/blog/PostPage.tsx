import { Button, Card, Tag, Text } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { posts } from "../../data/posts";
import { slugify } from "../../data/slug";
import { blogPaths } from "../../routing/blogPaths";

import "../../styles/blogProse.css";
import type { Post } from "../../types/post";
import { formatDate } from "./formatDate";

import styles from "./blog.module.css";

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
          <ul className={styles.tagList}>
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

      <footer className={styles.postFooter}>
        <nav className={styles.neighbours} aria-label="Nearby posts">
          <Neighbour post={older} direction="older" />
          <Neighbour post={newer} direction="newer" />
        </nav>

        <div className={styles.allPosts}>
          <Button variant="subtle" size="sm" render={<RouterLink to={blogPaths.archive} />}>
            All posts
          </Button>
        </div>
      </footer>
    </article>
  );
}

/** Renders an inert placeholder at either end of the run, so the pair stays even. */
function Neighbour({ post, direction }: { post?: Post; direction: "older" | "newer" }) {
  const className = direction === "older" ? styles.neighbour : styles.neighbourNewer;
  if (!post) {
    return <div className={className} aria-hidden="true" />;
  }
  return (
    <div className={className}>
      <Card tone="sunken" render={<RouterLink to={blogPaths.post(slugify(post.title))} />}>
        <Text variant="label" tone="muted" as="span">
          {direction === "older" ? "← Older" : "Newer →"}
        </Text>
        <div className={styles.neighbourTitle}>
          <Text variant="body-sm" as="span">
            <strong>{post.title}</strong>
          </Text>
        </div>
      </Card>
    </div>
  );
}
