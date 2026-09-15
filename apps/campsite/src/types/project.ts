import type { IconName } from "@jordanscamp/ds";
import type { ReactNode } from "react";

export interface Project {
  title: string;
  /** Where to visit it. Absent while there is nothing to visit yet. */
  url?: string;
  description: string | ReactNode;
  year: number;
  /** Public-directory image path. Preferred over `glyph` when given. */
  icon?: string;
  glyph?: IconName;
  /** Shown under "Things I'm working on". Off for a finished thing that keeps its page. */
  listed?: boolean;
  color?: string;
  github?: string;
  tags?: string[]; // topic pills shown in the blog window
  addedAt?: string; // ISO date string for "new" badge
  updatedAt?: string; // ISO date string for "updated" badge
}

export interface Bookmark {
  title: string;
  url: string;
  blurb: string;
  icon: string;
  color?: string;
  addedAt?: string; // ISO date string for "new" badge
}
