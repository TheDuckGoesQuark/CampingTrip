/**
 * The homepage rail offers only the top tags; the archive offers all of them.
 * A post carrying a sub-tag carries its parent too, so the parent's page holds it.
 */
export const TAG_TREE = {
  ai: [],
  code: ["design-systems", "react", "rust"],
  creative: ["ableton", "art", "fun", "music"],
} as const;

export type TopTag = keyof typeof TAG_TREE;
export type SubTag = (typeof TAG_TREE)[TopTag][number];
export type TagName = TopTag | SubTag;

export const TOP_TAGS = Object.keys(TAG_TREE) as TopTag[];

export function isTopTag(tag: TagName): tag is TopTag {
  return tag in TAG_TREE;
}

/** The top tag a sub-tag is filed under; `undefined` for a top tag. */
export function parentOf(tag: TagName): TopTag | undefined {
  return TOP_TAGS.find((top) => (TAG_TREE[top] as readonly string[]).includes(tag));
}
