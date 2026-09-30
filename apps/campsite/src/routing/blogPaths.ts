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
  /** The CV. There is one, so it is a file beside `index.html`, not a directory. */
  cv: `${ROOT}/cv.html`,
  /**
   * The same CV cut to bullets. Its own URL, not a parameter on `cv`: a static
   * host serves one file per path, so a `?view=` would hand every crawler,
   * unfurler and printer the same document.
   */
  cvCondensed: `${ROOT}/cv-condensed.html`,
  /**
   * The CV as a file, printed from the page at build time. Off `/blog` and short
   * enough to say aloud, because it is handed over rather than browsed to.
   */
  cvPdf: "/cv.pdf",
  cvCondensedPdf: "/cv-condensed.pdf",
  /**
   * Desktop items. No `.html`: the extension is there to be *seen* in the
   * address bar, and none of these windows has one.
   */
  desk: (slug: string) => `${ROOT}/desk/${encodeURIComponent(slug)}`,
  /** The About box. A window rather than a page, so no `.html` — see `desk`. */
  about: `${ROOT}/about`,
  /** The Activity Monitor: a window, as `about` is. */
  activity: `${ROOT}/activity`,
  /** What the site holds about a reader. One page, so a file beside `index.html`. */
  privacy: `${ROOT}/privacy.html`,
  /** The newsletter form on its own, for a link that is only about subscribing. */
  subscribe: `${ROOT}/subscribe/index.html`,
  /**
   * The page the endpoint sends a form post back to. The names are the
   * endpoint's (`infra/lambda/newsletter-api/accept.mjs`), so its redirects and
   * these files cannot drift apart without `subscribeNotices.test.ts` noticing.
   */
  subscribeNotice: (name: string) => `${ROOT}/subscribe/${encodeURIComponent(name)}.html`,
  /** Every issue that has gone out. The directory index, as `archive` is for posts. */
  issues: `${ROOT}/newsletter/index.html`,
  issue: (slug: string) => `${ROOT}/newsletter/${encodeURIComponent(slug)}.html`,
} as const;

/** What a blog URL names, before any lookup against content. */
export type BlogRef =
  | { kind: "home" }
  | { kind: "archive" }
  | { kind: "post"; slug: string }
  | { kind: "tag"; tag: string }
  | { kind: "project"; slug: string }
  | { kind: "tool"; slug: string }
  | { kind: "cv" }
  | { kind: "cvCondensed" }
  | { kind: "desk"; slug: string }
  | { kind: "about" }
  | { kind: "activity" }
  | { kind: "privacy" }
  | { kind: "subscribe" }
  | { kind: "notice"; name: string }
  | { kind: "issues" }
  | { kind: "issue"; slug: string };

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
  subscribe: (name) => (name === "index" ? { kind: "subscribe" } : { kind: "notice", name }),
  newsletter: (slug) => (slug === "index" ? { kind: "issues" } : { kind: "issue", slug }),
};

/**
 * Reads a blog path back into what it names. `null` for the desktop and for
 * anything unrecognised — both mean "no page open", which is a valid state.
 */
export function parseBlogPath(path: string): BlogRef | null {
  // Empty segments dropped, so a leading or trailing slash does not shift them.
  const [root, directory, file] = path.split("/").filter((segment) => segment !== "");
  if (root !== "blog" || directory === undefined) return null;
  if (file === undefined) {
    const name = stripHtml(directory);
    if (name === "index") return { kind: "home" };
    if (name === "cv") return { kind: "cv" };
    if (name === "cv-condensed") return { kind: "cvCondensed" };
    if (name === "about") return { kind: "about" };
    if (name === "activity") return { kind: "activity" };
    if (name === "privacy") return { kind: "privacy" };
    return null;
  }

  const build = DIRECTORIES[directory];
  if (!build) return null;
  return build(decodeURIComponent(stripHtml(file)));
}

/**
 * Whether a path names something the mock browser can hold in a tab. Desktop
 * items, the About box and the Activity Monitor open in windows of their own,
 * so they must not join the tab strip.
 */
export function isBrowserPath(path: string): boolean {
  const ref = parseBlogPath(path);
  return ref !== null && !OWN_WINDOW_KINDS.has(ref.kind);
}

const OWN_WINDOW_KINDS: ReadonlySet<BlogRef["kind"]> = new Set(["desk", "about", "activity"]);

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
    case "cv":
      return blogPaths.cv;
    case "cvCondensed":
      return blogPaths.cvCondensed;
    case "desk":
      return blogPaths.desk(ref.slug);
    case "about":
      return blogPaths.about;
    case "activity":
      return blogPaths.activity;
    case "privacy":
      return blogPaths.privacy;
    case "subscribe":
      return blogPaths.subscribe;
    case "notice":
      return blogPaths.subscribeNotice(ref.name);
    case "issues":
      return blogPaths.issues;
    case "issue":
      return blogPaths.issue(ref.slug);
  }
}
