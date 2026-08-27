import { Link, Text } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { posts } from "../../data/posts";
import { blogPaths } from "../../routing/blogPaths";
import { CompactPostSummary } from "./PostSummary";
import TagRail from "./TagRail";

import styles from "./blog.module.css";

/** How many posts the homepage sidebar shows before deferring to the archive. */
const VISIBLE = 5;

/**
 * The blog feed as it appears beside the homepage: a sunken panel with a
 * bevelled header, the tag rail, and the newest posts. Local to the blog — the
 * design system has no business knowing what a post is.
 */
export default function FeedPanel() {
  const visible = posts.slice(0, VISIBLE);

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <Text variant="label" as="span">
          From the blog
        </Text>
      </div>

      <div className={styles.panelRail}>
        <TagRail total={posts.length} withCounts={false} />
      </div>

      <div className={styles.panelList}>
        {visible.map((post) => (
          <CompactPostSummary key={post.title} post={post} />
        ))}
      </div>

      <div className={styles.panelFooter}>
        <Link render={<RouterLink to={blogPaths.archive} />}>
          <Text variant="body-sm" as="span">
            <strong>All posts →</strong>
          </Text>
        </Link>
      </div>
    </div>
  );
}
