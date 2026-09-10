import type { Cv } from "../types/cv";
import { cv } from "./cv";

export const MAILTO = "mailto:";

/**
 * The one `mailto:` in `cv.links`. Read off that list rather than stored beside
 * it, so the contact footer, MouseMail, the CV's header row and the
 * `schema.org/Person` in the page head cannot disagree about the address.
 */
export function mailtoOf(person: Cv): string | undefined {
  return person.links.find((link) => link.url.startsWith(MAILTO))?.url;
}

/** The address itself, without the scheme. */
export function emailOf(person: Cv): string | undefined {
  return mailtoOf(person)?.slice(MAILTO.length);
}

export const contactMailto = mailtoOf(cv);

/** The address as `cv.links` writes it, which is the address itself. */
export const contactLabel = cv.links.find((link) => link.url === contactMailto)?.label;
