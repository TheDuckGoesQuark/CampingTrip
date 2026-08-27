import type { Post } from "../types/post";
import { posts } from "./posts";

export interface TagSummary {
  tag: string;
  /** How many posts carry it. Derived on load; never stored on a post. */
  count: number;
}

function summarise(all: Post[]): TagSummary[] {
  const counts = new Map<string, number>();
  for (const post of all) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Every tag in use, busiest first, then alphabetical so ties hold still. */
export const tags: TagSummary[] = summarise(posts);

/** Posts carrying `tag`, in the order `posts` already holds them. */
export function postsTagged(tag: string): Post[] {
  return posts.filter((post) => post.tags.includes(tag));
}
