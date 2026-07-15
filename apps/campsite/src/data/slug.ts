/** URL-safe slug derived from a title. Kept derived (not stored) so titles
 * stay the single source of truth for a post's identity. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
