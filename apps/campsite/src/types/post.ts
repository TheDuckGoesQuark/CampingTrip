import type { ReactNode } from "react";

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
  /** Topic tags. Lower-case, hyphenated — they become `/blog/tags/<tag>.html`. */
  tags: string[];
  body: ReactNode;
}
