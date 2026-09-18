import { blogPaths } from "../routing/blogPaths";
import { routes } from "../routing/navigation";
import type { DesktopItem } from "../types/desktop";
import { MOUSEMAIL_LABEL } from "./mailPresets";
import { slugify } from "./slug";

/**
 * Every model in the tent, and who made it. CC-BY requires the attribution to
 * travel with the work, so this is the reader-facing copy of it rather than a
 * convenience: the README table is for anyone reading the repo, this is for
 * anyone standing in the scene.
 */
export const MODEL_CREDITS: { model: string; by?: string; url: string }[] = [
  {
    model: "Stylized Campfire",
    by: "Natalia Campos",
    url: "https://sketchfab.com/3d-models/stylized-campfire-3b507b1eb4c142218a4b3baa043e3ed4",
  },
  {
    model: "Cosy Picnic Area",
    url: "https://sketchfab.com/3d-models/cosy-picnic-area-0a1fc21d723e454b91314809871e1031",
  },
  {
    model: "Laptop",
    url: "https://sketchfab.com/3d-models/laptop-7d870e900889481395b4a575b9fa8c3e",
  },
  { model: "Acoustic Guitar", url: "https://sketchfab.com/tags/low-poly-guitar" },
  { model: "Cat Walk", url: "https://sketchfab.com/tags/cat-walk" },
  {
    model: "Shure SM57 Microphone",
    url: "https://sketchfab.com/3d-models/shure-sm57-dynamic-microphone-ec2dc94e022547beadee622b1ff34a5d",
  },
  {
    model: "Moka Pot",
    url: "https://sketchfab.com/3d-models/moka-pot-2ca52d750d95471a953fb2c9eb577da6",
  },
  {
    model: "Notepad",
    url: "https://sketchfab.com/3d-models/notepadb-0b30d2efe63f41b0a812904b610fe577",
  },
  {
    model: "Focusrite Scarlett Solo",
    url: "https://sketchfab.com/3d-models/focusrite-scarlett-solo-interface-f09111be4a5c48228c3b898965d62bba",
  },
  {
    model: "Akai MPK Mini Controller",
    url: "https://sketchfab.com/3d-models/akai-mpk-mini-midi-controller-89eae01d0547430bb8e10110eaadaa81",
  },
];

/**
 * The ambience beds. Public Domain Mark imposes no attribution requirement, so
 * these are named by choice rather than obligation; `docs/ambience-beds.md`
 * carries the licence itself, which is what a takedown would turn on.
 */
export const SOUND_CREDITS: { sound: string; by: string; url: string }[] = [
  {
    sound: "Nighttime rain and thunder inside a tent, Buis-les-Baronnies",
    by: "Jillis Molenaar",
    url: "https://archive.org/details/aporee_70516_82220",
  },
  {
    sound: "Dawn chorus, Sakala Forest Reserve, Estonia",
    by: "John Grzinich",
    url: "https://archive.org/details/260502-dawn-chorus-sakala-forest-reserve-jarvemaa",
  },
];

const CREDITS_BODY = [
  "3D models, sounds, and most images were not made by me.",
  "",
  "The models are all shared under CC-BY, which means I get to use them so",
  "long as I say who made them. Happily - I love giving credit where it's due.",
  "Thank you to everyone below for leaving the door open.",
  "",
  ...MODEL_CREDITS.flatMap(({ model, by, url }) => [
    by ? `${model}, by ${by}` : model,
    `  ${url}`,
    "",
  ]),
  "The rain and the birds are field recordings in the public domain. Nobody",
  "asked me to name the people who went out and recorded them, which seems",
  "like all the more reason to.",
  "",
  ...SOUND_CREDITS.flatMap(({ sound, by, url }) => [`${sound}, by ${by}`, `  ${url}`, ""]),
  "The code is MIT. The writing and the design are mine, under CC BY-NC-ND 4.0.",
].join("\n");

/**
 * The desktop's contents. Everything worth reading lives in the browser now, so
 * what is left here is the junk drawer — which is the point of a desktop.
 *
 * Order is reading order on the desktop: the field fills its first column
 * downwards before starting another to the right, so what is first here is
 * top-left on any screen.
 */
export const desktopItems: DesktopItem[] = [
  { kind: "app", label: "CatNav", opens: blogPaths.home, glyph: "globe" },
  // The joke rather than the reliable door — see the menu bar.
  { kind: "app", label: "Touch Grass", opens: routes.tent, glyph: "grass" },
  { kind: "mail", label: MOUSEMAIL_LABEL },
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
      "- How do I explain that I can't hear what just happened because I rick rolled myself",
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
  {
    kind: "text",
    label: "credits.txt",
    mode: "Plain text",
    body: CREDITS_BODY,
  },
];

/** URL-safe id for an item, derived from its label rather than stored. */
export function desktopItemSlug(item: DesktopItem): string {
  return slugify(item.label);
}

export function findDesktopItem(slug: string): DesktopItem | undefined {
  return desktopItems.find((item) => desktopItemSlug(item) === slug);
}
