/**
 * The blog's URL scheme, in one place. The address bar is on screen, so these
 * strings are visible design: a trailing `.html` and a directory per kind are
 * the point, not an implementation detail.
 *
 * Namespacing by kind also removes a real hazard — posts, projects and tools
 * used to share one flat slug namespace, where a post and a project with the
 * same title silently resolved to whichever list was searched first.
 */
const ROOT = "/blog";

export const blogPaths = {
  /** The CatOS desktop: no window open. */
  desktop: ROOT,
  home: `${ROOT}/index.html`,
  /** Every post. The directory index, which is what `index.html` always meant. */
  archive: `${ROOT}/posts/index.html`,
  post: (slug: string) => `${ROOT}/posts/${encodeURIComponent(slug)}.html`,
  tag: (tag: string) => `${ROOT}/tags/${encodeURIComponent(tag)}.html`,
  project: (slug: string) => `${ROOT}/projects/${encodeURIComponent(slug)}.html`,
  tool: (slug: string) => `${ROOT}/tools/${encodeURIComponent(slug)}.html`,
  /**
   * Desktop items. No `.html`: the extension is there to be *seen* in the
   * address bar, and none of these windows has one.
   */
  desk: (slug: string) => `${ROOT}/desk/${encodeURIComponent(slug)}`,
} as const;

/** What a blog URL names, before any lookup against content. */
export type BlogRef =
  | { kind: "home" }
  | { kind: "archive" }
  | { kind: "post"; slug: string }
  | { kind: "tag"; tag: string }
  | { kind: "project"; slug: string }
  | { kind: "tool"; slug: string }
  | { kind: "desk"; slug: string };

/** Strips the cosmetic extension. Absent is fine; canonical links carry it. */
export function stripHtml(segment: string): string {
  return segment.replace(/\.html$/, "");
}

const DIRECTORIES: Record<string, (slug: string) => BlogRef> = {
  // `index` inside a directory is that directory's listing, not a post named
  // "index" — the same convention the `.html` suffix is borrowed from.
  posts: (slug) => (slug === "index" ? { kind: "archive" } : { kind: "post", slug }),
  tags: (slug) => ({ kind: "tag", tag: slug }),
  projects: (slug) => ({ kind: "project", slug }),
  tools: (slug) => ({ kind: "tool", slug }),
  desk: (slug) => ({ kind: "desk", slug }),
};

/**
 * Reads a blog path back into what it names. `null` for the desktop and for
 * anything unrecognised — both mean "no page open", which is a valid state.
 */
export function parseBlogPath(path: string): BlogRef | null {
  // Empty segments dropped, so a leading or trailing slash does not shift them.
  const [root, directory, file] = path.split("/").filter((segment) => segment !== "");
  if (root !== "blog" || directory === undefined) return null;
  if (file === undefined) return stripHtml(directory) === "index" ? { kind: "home" } : null;

  const build = DIRECTORIES[directory];
  if (!build) return null;
  return build(decodeURIComponent(stripHtml(file)));
}

/**
 * Whether a path names something the mock browser can hold in a tab. Desktop
 * items open in windows of their own, so they must not join the tab strip.
 */
export function isBrowserPath(path: string): boolean {
  const ref = parseBlogPath(path);
  return ref !== null && ref.kind !== "desk";
}

/** The canonical path for a ref — the inverse of `parseBlogPath`. */
export function blogPathFor(ref: BlogRef): string {
  switch (ref.kind) {
    case "home":
      return blogPaths.home;
    case "archive":
      return blogPaths.archive;
    case "post":
      return blogPaths.post(ref.slug);
    case "tag":
      return blogPaths.tag(ref.tag);
    case "project":
      return blogPaths.project(ref.slug);
    case "tool":
      return blogPaths.tool(ref.slug);
    case "desk":
      return blogPaths.desk(ref.slug);
  }
}
