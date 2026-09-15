import { slugify } from "../data/slug";

/** Stable id for a role's card, shared by the anchor and whatever links to it. */
export function roleAnchorId(org: string): string {
  return `role-${slugify(org)}`;
}
