import { blogPaths } from "../routing/blogPaths";
import type { DesktopItem } from "../types/desktop";
import { slugify } from "./slug";

/**
 * The desktop's contents. Everything worth reading lives in the browser now, so
 * what is left here is the junk drawer — which is the point of a desktop.
 *
 * The rail is 148px wide and an icon is 120px, so about five of these are
 * visible before it scrolls.
 */
export const desktopItems: DesktopItem[] = [
  { kind: "app", label: "CatNav", opens: blogPaths.home },
  {
    kind: "image",
    label: "smittens_047.jpg",
    caption: "Smittens, desperately protecting his treasured catnip fish.",
    dimensions: "1600 × 1015",
    size: "87 KB",
  },
  {
    kind: "text",
    label: "words_with_friends.txt",
    mode: "Plain text",
    body: [
      "- A fact becomes a lie if you leave it for long enough",
      "- There is never a good reason to chug wine",
      "- Sometimes I make myself cringe so hard I disassociate",
      "- Is this the camping equivalent of the walk of shame",
      "- Are you gonna gaslight me into thinking that was normal",
      "- These kids and their damn artichokes",
    ].join("\n"),
  },
  {
    // The `.txt` is bait, not a stale label — the mismatch is the joke.
    kind: "video",
    label: "DO_NOT_OPEN.txt",
    videoId: "dQw4w9WgXcQ",
    caption: "Told you.",
    duration: "3:33",
  },
  {
    kind: "bin",
    label: "Bin",
    contents: [
      "draft-post-about-crypto.txt",
      "tailwind.config.js",
      "IMG_2847.jpg (the one where my eyes are shut)",
      "a very confident estimate.xlsx",
    ],
  },
];

/** URL-safe id for an item, derived from its label rather than stored. */
export function desktopItemSlug(item: DesktopItem): string {
  return slugify(item.label);
}

export function findDesktopItem(slug: string): DesktopItem | undefined {
  return desktopItems.find((item) => desktopItemSlug(item) === slug);
}
