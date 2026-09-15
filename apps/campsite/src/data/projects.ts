import type { Project } from "../types/project";

/** Every project with a page. `listedProjects` is the subset the homepage shows. */
export const projects: Project[] = [
  {
    title: "JordansCamp.Site",
    url: "https://jordanscamp.site/",
    github: "https://github.com/TheDuckGoesQuark/CampingTrip",
    description:
      "In the depths of winter in January 2026, I was desperately reminiscing of my happy place — inside a tent, looking out to nature, listening to the rain clatter on the sheets. The overwhelming white noise bringing peace to my mind and body. If I was to have my own space on the internet that would communicate who I was, I thought bringing people to my happy place was the way to do that. And I filled my happy place with all of my favourite things. My music, my nonsense scribbles, the projects that I work on, and crucially my animal familiar Smittens.\n\nThis was my first vibe coded adventure, allowing all these funny ideas I had to come to life instead of spending my after hours trawling docs. I thought I'd miss it, but I don't. This is the fun part of software, the creating something out of nothing. Not the error messages and build pipelines. This project reignited my love of making. And it will house many of the things I will make, so check back whenever if you want to see what nonsense I've fixated on in the past while.\n\nClick around, explore, play. I was inspired by the interactions and storytelling of the game Firewatch, of the peaceful home menus of video games and early DVDs. The art isn't mine, and it's all credited in the GitHub repo — bless the people who let others take their creations and make something new out of it.\n\nI hope this site was a treat, amongst the scrolling and constant stimulation that the internet thrives on now. I hope you make something too.",
    year: 2025,
    icon: "images/projects/jordanscamp-site.webp",
    color: "#4a9eff",
    tags: ["react", "three.js", "creative"],
    addedAt: "2026-01-15",
  },
  {
    title: "CatMap",
    url: "https://catmaps.me",
    description: "Identifying and helping track down missing pets.",
    year: 2026,
    // The same logo the laptop in the tent shows on its screen.
    icon: "images/logo.webp",
    color: "#1a1a1a",
    tags: ["rust", "react-native", "product"],
    addedAt: "2026-02-01",
  },
  {
    title: "PhotoBroom",
    url: "https://jordanscamp.site/blog/photobroom",
    github: "https://github.com/TheDuckGoesQuark/CampingTrip",
    description:
      "Google Photos quietly took away the ability to bulk-delete photos from a search, and their API can't delete at all — which drove me up the wall every time I wanted to clear out a day's worth of near-identical shots. So PhotoBroom is my answer: a Chrome extension that overlays a fast, keyboard-driven review right on top of Google Photos. Search a date, flick through with the arrow keys — keep, skip, or bin — then send the whole pile to the bin in one go.\n\nIt drives Google's own interface (the only way that's actually possible), runs entirely in your browser, and nothing's gone for good since the bin holds onto things for 60 days. A small, stubborn little tool born purely out of being annoyed at not being able to do a basic thing.",
    year: 2026,
    color: "#ffb347",
    tags: ["chrome-extension", "tools"],
    addedAt: "2026-06-29",
    listed: false,
  },
  {
    title: "Music Production",
    description:
      "The tent is full of kit for a reason: the guitar, the MIDI controller, the interface and the mic are the same set that lives next to my desk. I play guitar and drums, and I'm learning to turn the noodling into finished tracks in Ableton.\n\nNothing to listen to yet. When there is, it will live here.",
    year: 2026,
    glyph: "note",
    color: "#8a5cf6",
    tags: ["guitar", "drums", "ableton"],
    addedAt: "2026-09-14",
  },
];

export const listedProjects: Project[] = projects.filter((project) => project.listed !== false);
