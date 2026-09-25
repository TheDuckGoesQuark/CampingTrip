import type { ReactNode } from "react";

import type { TagName } from "./tags";

/**
 * A blog post. `slug` is derived from `title` via `slugify`, never stored, so a
 * title stays the single source of a post's identity.
 */
export interface Post {
  title: string;
  /** ISO date. Drives feed order and the displayed date. */
  date: string;
  /** One-line standfirst, shown under the title and in every feed. */
  standfirst: string;
  /** Topic tags from `TAG_TREE`; each becomes `/blog/tags/<tag>.html`. */
  tags: TagName[];
  body: ReactNode;
  /**
   * Visible in CatOS for previewing, but given no prerendered file, sitemap
   * entry or feed item, so nothing outside the tent indexes it.
   */
  draft?: boolean;
}
