import type { Post } from "../types/post";
import { isTopTag, type TagName } from "../types/tags";
import { posts } from "./posts";

export interface TagSummary {
  tag: TagName;
  /** How many posts carry it. Derived on load; never stored on a post. */
  count: number;
}

/** Top tags before sub-tags, alphabetical within each tier. */
export function byTier(a: TagName, b: TagName): number {
  return Number(isTopTag(b)) - Number(isTopTag(a)) || a.localeCompare(b);
}

/** Every tag across `all`, in the order every rail shows them in. */
export function tagsOf(all: Post[]): TagSummary[] {
  const counts = new Map<TagName, number>();
  for (const post of all) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => byTier(a.tag, b.tag));
}

/** Every tag in use, drafts included: this is what CatOS shows. */
export const tags: TagSummary[] = tagsOf(posts);

export const topTags: TagSummary[] = tags.filter(({ tag }) => isTopTag(tag));

/** Posts carrying `tag`, in the order `posts` already holds them. */
export function postsTagged(tag: string): Post[] {
  return posts.filter((post) => (post.tags as string[]).includes(tag));
}
