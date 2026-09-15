import type { ReactNode } from "react";

/** One job. `highlights` are plain strings so the PDF and the JSON-LD can carry them. */
export interface Role {
  org: string;
  url?: string;
  /** Public-directory path to its mark, before `asset()`. */
  logo?: string;
  title: string;
  /** ISO date. Roles sort newest first on it. */
  start: string;
  /** ISO date. Absent while the role is current. */
  end?: string;
  location?: string;
  /** A short role, an internship say, can go without one. */
  summary?: string;
  highlights: string[];
  /** Shown on screen only; the print form has no chips. */
  tags: string[];
}

export interface CvProject {
  name: string;
  summary: string;
  url?: string;
  start: string;
  end?: string;
  highlights: string[];
  tags: string[];
}

export interface SkillGroup {
  group: string;
  items: string[];
  fullWidth?: boolean;
}

export interface Education {
  institution: string;
  url?: string;
  /** Public-directory path, before `asset()`. */
  logo?: string;
  qualification: string;
  start: string;
  end: string;
  /** Coursework and projects worth a line each. */
  highlights?: string[];
}

export interface CvLink {
  label: string;
  /** An `https:` or `mailto:` URL. */
  url: string;
}

/**
 * The CV. One module renders three ways: the CatOS page, the prerendered HTML
 * with its `schema.org/Person`, and the PDF printed from that HTML. Anything
 * derivable from these fields is derived, never stored twice.
 */
export interface Cv {
  name: string;
  /** The one-line pitch. It is also the meta description and the link-preview text. */
  headline: string;
  location?: string;
  /** Written first on the page, TSX like a post body. May hold `Island`s. */
  narrative: ReactNode;
  links: CvLink[];
  /** Newest first. */
  experience: Role[];
  /** Authored order, not date order: the one to talk about first goes first. */
  projects: CvProject[];
  skills: SkillGroup[];
  education: Education[];
  /** ISO date, shown on the page and used as `dateModified`. */
  updated: string;
}
