import type { IconName } from "@jordanscamp/ds";

import { blogPaths } from "../routing/blogPaths";
import { cv } from "./cv";
import { listedProjects } from "./projects";
import { slugify } from "./slug";

export interface WorkItem {
  title: string;
  to: string;
  tags: string[];
  color?: string;
  /** Public-directory path, before `asset()`. */
  icon?: string;
  glyph?: IconName;
}

export const personalWork: WorkItem[] = listedProjects.map((project) => ({
  title: project.title,
  to: blogPaths.project(slugify(project.title)),
  tags: project.tags ?? [],
  color: project.color,
  icon: project.icon,
  glyph: project.glyph,
}));

/* `org` is a key into the CV, not a label: a card for a job the CV has dropped
   should not survive. The tags deliberately differ from that role's on the CV,
   and each colour is its logo's own background rather than a chosen swatch. */
const FEATURED_ROLES: {
  org: string;
  label: string;
  color: string;
  icon: string;
  tags: string[];
}[] = [
  {
    org: "Lindus Health",
    label: "Lindus",
    color: "#000000",
    icon: "images/projects/lindus-health.webp",
    tags: ["Clinical-Trials", "AI-Native", "Regulatory-Compliance"],
  },
  {
    org: "Gravity Sketch",
    label: "Gravity Sketch",
    color: "#ffffff",
    icon: "images/projects/gravity-sketch.webp",
    tags: ["VR", "Design", "B2B", "B2C"],
  },
];

export const professionalWork: WorkItem[] = [
  ...FEATURED_ROLES.flatMap(({ org, label, color, icon, tags }) => {
    const onTheCv = cv.experience.some((entry) => entry.org === org);
    // A drop rather than a throw: `work.test.ts` is where this is meant to fail.
    return onTheCv ? [{ title: label, to: blogPaths.cv, tags, color, icon }] : [];
  }),
  {
    /* Written out because the CV carries the thesis as one line under Education
       rather than an entry of its own, so there is nothing to look up. */
    title: "MultiAgent Systems",
    to: blogPaths.cv,
    tags: ["Java", "JADE", "MSci-Thesis"],
    color: "#ffffff",
    icon: "images/projects/st-andrews.webp",
  },
];
