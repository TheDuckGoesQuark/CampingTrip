import type { Cv, Role } from "../types/cv";

/*
 * Placeholder throughout, in the posts' `[DRAFT — …]` convention: the shape is
 * real and proves the pipeline end to end, the words are not yet Jordan's.
 */
const roles: Role[] = [
  {
    org: "[DRAFT — current employer]",
    title: "[DRAFT — current title]",
    start: "2024-01-01",
    location: "[DRAFT — city]",
    summary: "[DRAFT — one paragraph: what the team builds, and what Jordan owns in it.]",
    highlights: [
      "[DRAFT — a highlight with a number in it.]",
      "[DRAFT — a second highlight, about a decision rather than a task.]",
    ],
    tags: ["typescript", "react"],
  },
  {
    org: "[DRAFT — previous employer]",
    title: "[DRAFT — previous title]",
    start: "2020-01-01",
    end: "2023-12-31",
    summary: "[DRAFT — one paragraph.]",
    highlights: ["[DRAFT — a highlight.]"],
    tags: ["python"],
  },
];

export const cv: Cv = {
  name: "Jordan Mackie",
  headline: "[DRAFT — the one-line pitch: what Jordan does, and who it is for.]",
  updated: "2026-09-08",
  links: [{ label: "GitHub", url: "https://github.com/TheDuckGoesQuark" }],
  narrative: (
    <>
      <p>[DRAFT — how Jordan works: the kind of problems they pick, and how they go at them.]</p>
      <p>[DRAFT — what they want next, so a reader can tell in a paragraph whether to write.]</p>
    </>
  ),
  experience: [...roles].sort((a, b) => b.start.localeCompare(a.start)),
  skills: [
    { group: "Languages", items: ["[DRAFT — TypeScript]", "[DRAFT — Python]"] },
    { group: "Practices", items: ["[DRAFT — a practice]"] },
  ],
  education: [
    {
      institution: "[DRAFT — institution]",
      qualification: "[DRAFT — qualification]",
      start: "2014-09-01",
      end: "2018-06-30",
    },
  ],
};
