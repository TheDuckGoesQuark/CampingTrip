import type { Post } from "./post";

/**
 * One issue of the newsletter. Its slug is derived from `subject` via
 * `slugify`, as a post's is from its title, and is what the Newsletter
 * workflow is dispatched with.
 */
export interface Issue {
  subject: string;
  /** ISO date. Shown in the issue and, later, in the archive. */
  date: string;
  /** Short paragraphs in my voice, above the posts. Plain text; no markup. */
  note: string[];
  /** The posts it points at, each as a summary and a link. Published ones only. */
  posts: Post[];
  /** Can be test-sent, and is refused by a real send. */
  draft?: boolean;
  /**
   * ISO date it went to the list, set by hand after the send. Only an issue
   * with it is prerendered, listed in the archive or previewed under a post;
   * without it the issue is viewable in CatOS, as a draft post is, and no more.
   */
  sentOn?: string;
}
