import type { ReactNode } from "react";

export interface Achievement {
  name: string;
  outcome: string;
  /** One bullet. Its presence is also the selection: the condensed CV prints
      the achievements carrying one and no others. */
  short?: string;
  feature?: string;
  difficulty?: string;
  /** Markup, not plain text: a course or paper named here carries its own link. */
  approach?: ReactNode;
  /** A post telling this story at length. The slug, so the CV holds no URL. */
  postSlug?: string;
}

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
  /** The condensed CV's context line; it falls back to `summary`. */
  short?: string;
  achievements?: Achievement[];
  /** Whatever is a single line and not a project: a course taught, a club founded. */
  highlights: string[];
}

export interface CvProject {
  name: string;
  summary: string;
  /** The condensed CV's line for this project; it falls back to `summary`. */
  short?: string;
  url?: string;
  /** Shown in place of the bare `url`, where the link runs deeper than it reads. */
  urlLabel?: string;
  start: string;
  end?: string;
  highlights: string[];
}

export interface SkillGroup {
  group: string;
  items: string[];
  fullWidth?: boolean;
}

export interface Coursework {
  subject: string;
  detail: string;
  /** The write-up, not the repository: it is the part worth a reader's click. */
  url?: string;
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
  coursework?: Coursework[];
}

/** `quote` carries no surrounding quotation marks; the markup supplies them. */
export interface Commendation {
  /** Verbatim. Square brackets mark a substitution, an ellipsis marks a cut. */
  quote: string;
  /**
   * By role, never by name: these were written in an internal channel by people
   * who did not write them for publication.
   */
  attribution: string;
  url?: string;
}

export interface CvLink {
  label: string;
  /** An `https:` or `mailto:` URL. */
  url: string;
}

/**
 * The CV. One module renders two documents, the full and the condensed, each
 * three ways: the CatOS page, the prerendered HTML with its `schema.org/Person`,
 * and the PDF printed from that HTML. Anything derivable is derived, never
 * stored twice; a `short` holds a different sentence, not a copy of a longer one.
 */
export interface Cv {
  name: string;
  /** The one-line pitch. It is also the meta description and the link-preview text. */
  headline: string;
  location?: string;
  /** The flag is the one flown at home, which need not be the passport's. */
  citizenship?: { label: string; flag: string };
  /** Written first on the page, TSX like a post body. May hold `Island`s. */
  narrative: ReactNode;
  /** `narrative` in two or three sentences. Plain text, not TSX: a link in that
      document's first paragraph is a reader sent away before the bullets. */
  profile: string;
  links: CvLink[];
  /** Newest first. */
  experience: Role[];
  /** Authored order, not date order: the one to talk about first goes first. */
  projects: CvProject[];
  skills: SkillGroup[];
  education: Education[];
  /** Authored order. Empty hides the section rather than printing an empty one. */
  commendations: Commendation[];
  /** Says where the quotes came from, so role-only attribution does not read as evasion. */
  commendationsNote?: string;
  /** ISO date, shown on the page and used as `dateModified`. */
  updated: string;
}
