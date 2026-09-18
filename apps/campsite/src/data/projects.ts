import type { Project } from "../types/project";

/** Every project with a page. `listedProjects` is the subset the homepage shows. */
export const projects: Project[] = [
  {
    title: "JordansCamp.Site",
    url: "https://jordanscamp.site/",
    description:
      "January 2026, the middle of a bad winter, and I kept catching myself somewhere else. Inside a tent, rain going on the flysheet, nothing to do and nowhere to be. That particular white noise that finally switches my head off. It's my happy place and I couldn't get to it, so I built it instead, and then filled it with everything else I love: my music, my nonsense scribbles, the projects I keep starting, and Smittens, my animal familiar.\n\nThis was the first thing I made by describing it rather than typing it, and what caught me off guard was how much of my evenings used to go before the making even started. Which version of the library. Which config key moved. I assumed I'd miss that. I don't. What came back was the part I liked in the first place, which is watching something exist that didn't an hour ago.\n\nSo have a poke about. The laptop turns on, and I'd like it on record that it was meant to be a static image. I followed my nose and came back up for air with an entire operating system, which is also roughly how the notepad ended up full of poems I'm not sure about. The site borrows its manners from Firewatch, and from the home menus of old games and DVDs, back when a screen was content to sit there and be looked at.\n\nMostly I wanted to make something that doesn't want anything from you. Sit by the fire a minute, listen to the rain. Go and put a part of yourself out there too.",
    year: 2025,
    icon: "images/projects/jordanscamp-site.webp",
    color: "#4a9eff",
    tags: ["React", "Three.js", "Creative"],
    addedAt: "2026-01-15",
  },
  {
    title: "CatMap",
    url: "https://catmaps.me",
    description: "Identifying and helping track down missing pets.",
    year: 2026,
    // The same logo the laptop in the tent shows on its screen.
    icon: "images/logo.webp",
    // Light, because the mark is dark and unreadable on the tile's own dark fill.
    color: "#ffffff",
    tags: ["Rust", "React-Native", "Product"],
    addedAt: "2026-02-01",
  },
  {
    title: "PhotoBroom",
    url: "https://jordanscamp.site/blog/photobroom",
    github: "https://github.com/TheDuckGoesQuark/CampingTrip",
    description:
      "Google Photos quietly took away the ability to bulk-delete photos from a search, and their API can't delete at all, which drove me up the wall every time I wanted to clear out a day's worth of near-identical shots. So PhotoBroom is my answer: a Chrome extension that overlays a fast, keyboard-driven review right on top of Google Photos. Search a date, flick through with the arrow keys (keep, skip, or bin), then send the whole pile to the bin in one go.\n\nIt drives Google's own interface (the only way that's actually possible), runs entirely in your browser, and nothing's gone for good since the bin holds onto things for 60 days. A small, stubborn little tool born purely out of being annoyed at not being able to do a basic thing.",
    year: 2026,
    color: "#ffb347",
    tags: ["Chrome-Extension", "Tools"],
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
    tags: ["Guitar", "Drums", "Ableton"],
    addedAt: "2026-09-14",
  },
];

export const listedProjects: Project[] = projects.filter((project) => project.listed !== false);
