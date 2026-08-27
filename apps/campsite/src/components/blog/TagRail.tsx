import { Tag } from "@jordanscamp/ds";
import { Link } from "react-router-dom";

import { tags } from "../../data/tags";
import { blogPaths } from "../../routing/blogPaths";

import styles from "./blog.module.css";

export interface TagRailProps {
  /** The tag whose page we are on, or `undefined` on a page showing everything. */
  current?: string;
  /** Total post count, shown on the "All" tag. */
  total: number;
  /** Omit the counts where the rail is a filter rather than an index. */
  withCounts?: boolean;
}

/**
 * The row of topic tags. The tag standing for the current page renders as a
 * `span` with `aria-current`, not a link back to where you already are.
 */
export default function TagRail({ current, total, withCounts = true }: TagRailProps) {
  const count = (n: number) => (withCounts ? n : undefined);

  return (
    <div className={styles.tagRow}>
      {current === undefined ? (
        <Tag selected count={count(total)} aria-current="page">
          All
        </Tag>
      ) : (
        <Tag count={count(total)} render={<Link to={blogPaths.archive} />}>
          All
        </Tag>
      )}
      {tags.map(({ tag, count: n }) =>
        tag === current ? (
          <Tag key={tag} selected count={count(n)} aria-current="page">
            {tag}
          </Tag>
        ) : (
          <Tag key={tag} count={count(n)} render={<Link to={blogPaths.tag(tag)} />}>
            {tag}
          </Tag>
        ),
      )}
    </div>
  );
}
