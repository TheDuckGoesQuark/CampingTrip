import type { IconName } from "@jordanscamp/ds";

import { blogPaths } from "../routing/blogPaths";
import { projectAnchorId, roleAnchorId } from "../utils/cvAnchors";
import { cv } from "./cv";
import { listedProjects } from "./projects";
import { slugify } from "./slug";

export interface WorkItem {
  title: string;
  to: string;
  /**
   * The entry on that page, as a bare id rather than a fragment on `to`: a built
   * page holds the reader's copy of every id beside the app's, and only the
   * renderer knows which of the two it is linking into. See `useDocumentId`.
   */
  anchor?: string;
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
   should not survive, and the logo is the CV's. The tags deliberately differ
   from that role's on the CV, and each colour is its logo's own background
   rather than a chosen swatch. */
const FEATURED_ROLES: {
  org: string;
  label: string;
  color: string;
  tags: string[];
}[] = [
  {
    org: "Lindus Health",
    label: "Lindus",
    color: "#000000",
    tags: ["Clinical-Trials", "AI-Native", "Regulatory-Compliance"],
  },
  {
    org: "Gravity Sketch",
    label: "Gravity Sketch",
    color: "#ffffff",
    tags: ["VR", "Design", "B2B", "B2C"],
  },
];

/* The CV files the dissertation under the game's name; this column names the
   subject, which is what a reader scanning for skills is after. */
const THESIS = "Unconventional Chess";

export const professionalWork: WorkItem[] = [
  ...FEATURED_ROLES.flatMap(({ org, label, color, tags }) => {
    const role = cv.experience.find((entry) => entry.org === org);
    // A drop rather than a throw: `work.test.ts` is where this is meant to fail.
    return role
      ? [
          {
            title: label,
            to: blogPaths.cv,
            anchor: roleAnchorId(org),
            tags,
            color,
            icon: role.logo,
          },
        ]
      : [];
  }),
  ...cv.projects
    .filter((project) => project.name === THESIS)
    .map((project) => ({
      title: "MultiAgent Systems",
      to: blogPaths.cv,
      anchor: projectAnchorId(project.name),
      tags: ["Java", "JADE", "MSci-Thesis"],
      color: "#ffffff",
      icon: cv.education.find((entry) => entry.institution === "University of St Andrews")?.logo,
    })),
];
