import { slugify } from "../data/slug";

/** Stable id for a role's entry, shared by the anchor and whatever links to it. */
export function roleAnchorId(org: string): string {
  return `role-${slugify(org)}`;
}

/** The same, for a project's entry. Prefixed apart: an org and a project may share a name. */
export function projectAnchorId(name: string): string {
  return `project-${slugify(name)}`;
}
