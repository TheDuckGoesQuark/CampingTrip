import { Button, Text } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { posts as allPosts } from "../../data/posts";
import { routes } from "../../routing/navigation";
import type { Post } from "../../types/post";
import Callout from "./Callout";
import { PostSummaryCard } from "./PostSummary";
import TagRail from "./TagRail";

import styles from "./blog.module.css";

export interface FeedPageProps {
  posts: Post[];
  /** The tag being filtered on, or `undefined` for the whole archive. */
  tag?: string;
}

/**
 * A full-width run of posts — the archive, or one tag's worth. One component for
 * both, because a filtered feed and an unfiltered one differ only in their
 * heading and which tag the rail holds down.
 */
export default function FeedPage({ posts, tag }: FeedPageProps) {
  return (
    <>
      <header>
        <Text variant="label" tone="muted" as="p">
          {tag ? "Filed under" : "Everything, newest first"}
        </Text>
        <div className={styles.feedHeading}>
          <Text variant="title-1">{tag ?? "All posts"}</Text>
          <Text variant="label" tone="muted" as="span">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </Text>
        </div>

        <nav className={styles.feedRail} aria-label="Browse posts by topic">
          <TagRail current={tag} total={allPosts.length} />
        </nav>
      </header>

      <ul className={styles.feedList}>
        {posts.map((post) => (
          <PostSummaryCard key={post.title} post={post} />
        ))}
      </ul>

      {tag === "music" && (
        <div className={styles.feedFooter}>
          <Callout
            icon="cassette"
            title="Rather just listen?"
            body="The tape deck back at camp has the actual songs on it."
            action={
              <Button size="sm" render={<RouterLink to={routes.music} />}>
                Open the tape deck →
              </Button>
            }
          />
        </div>
      )}
    </>
  );
}
