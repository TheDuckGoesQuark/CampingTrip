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
    caption: "Smittens, in the doorway, refusing to come in out of the rain.",
    dimensions: "2048 × 1365",
    size: "1.4 MB",
  },
  {
    kind: "text",
    label: "notes.txt",
    mode: "Plain text",
    body: [
      "- she is NOT called Smittens on the vet's forms",
      "- ask Claude to stop suggesting Tailwind (17th time)",
      "- the campfire shader is one magic number away",
      "  from collapse. do not touch 0.37",
      "- buy oat milk",
      "- tell absolutely nobody about line 412",
    ].join("\n"),
  },
  {
    kind: "text",
    label: "DO_NOT_OPEN.txt",
    mode: "Plain text",
    body: "Told you.",
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
