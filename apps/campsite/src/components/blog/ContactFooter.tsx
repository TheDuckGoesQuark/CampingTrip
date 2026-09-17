import { Button, Link, Text } from "@jordanscamp/ds";
import {
  Envelope,
  type Icon,
  Link as LinkGlyph,
  LinkedinLogo,
  ReadCvLogo,
} from "@jordanscamp/ds/icons";
import { useRef } from "react";
import { Link as RouterLink } from "react-router-dom";

import type { BrowserPage } from "../../data/blogPages";
import { contactMailto } from "../../data/contactEmail";
import { cv } from "../../data/cv";
import { MAIL_PRESETS, presetMailto } from "../../data/mailPresets";
import { useAnchorFollows } from "../../hooks/useAnchorFollows";
import { useArrivals } from "../../hooks/useArrivals";
import { useMouseMailIntercept } from "../../hooks/useMouseMailIntercept";
import { useDocumentId } from "../../prerender/renderTarget";
import { blogPaths } from "../../routing/blogPaths";
import { asset } from "../../utils/assetPath";
import { offsiteLinkProps } from "./offsiteLink";

import styles from "./blog.module.css";

export const CONTACT_ID = "contact";

/** Exported so the CV's PDF step can assert this footer is not on the paper. */
export const CONTACT_HEADING = "Let's talk";

/** The rail carries no visible label, so this is the only thing naming it. */
export const RAIL_LABEL = "Ways to get in touch";

export const CV_LINK_LABEL = "Read my CV";

/** GitHub is on the CV and in the page head, but code is no answer to "let's talk". */
const WAYS_TO_TALK = cv.links.filter((link) => !link.url.includes("github.com"));

const HEADING_ID = "contact-heading";

/** The mascot's frame on the same page, so the two pictures match. */
const PORTRAIT_PX = 128;

/** Optically level with the 16px link text beside it. */
const GLYPH_PX = 20;

const PILL_GLYPH_PX = 18;

/** Past the end of a smooth scroll, short of the reader losing interest. */
const SETTLE_MS = 500;

/**
 * Read off the URL rather than stored beside it: a second field would be a fact
 * about a link the link already carries, and one more thing to forget to set.
 */
function glyphFor(url: string): Icon {
  if (url.startsWith("mailto:")) return Envelope;
  if (url.includes("linkedin.com")) return LinkedinLogo;
  return LinkGlyph;
}

/**
 * `cv.links` is the one list, so this strip, the CV's own header row and the
 * `schema.org/Person` in the page head cannot disagree about how to reach me.
 * This strip shows the subset worth talking to, never a different address.
 *
 * A plain `footer`, not `role="contentinfo"`: it sits inside `main`, where that
 * landmark does not apply.
 *
 * `page` rather than `useLocation`: the address is not always the page this
 * footer is under. Opening MouseMail moves it to the window's own path while the
 * page stays rendered behind, and the CV would offer a link to itself.
 */
export default function ContactFooter({ page }: { page: BrowserPage }) {
  const anchor = useDocumentId(CONTACT_ID);
  const headingId = useDocumentId(HEADING_ID);
  const banner = useRef<HTMLElement>(null);
  const followed = useAnchorFollows(`#${anchor}`);
  const arrivals = useArrivals(banner, SETTLE_MS, followed);
  const mailto = contactMailto;
  const interceptProps = useMouseMailIntercept();

  return (
    <footer ref={banner} id={anchor} className={styles.contact} aria-labelledby={headingId}>
      {arrivals > 0 && <span key={arrivals} className={styles.contactShimmer} aria-hidden="true" />}
      <img
        className={styles.contactPortrait}
        src={asset("images/jordan.webp")}
        alt="Jordan Mackie"
        width={PORTRAIT_PX}
        height={PORTRAIT_PX}
      />
      <div className={styles.contactRow}>
        <Text variant="title-1" as="h2" id={headingId}>
          {CONTACT_HEADING}
        </Text>
        <ul className={styles.contactLinks}>
          {WAYS_TO_TALK.map((link) => (
            <li key={link.url}>
              <Glyph glyph={glyphFor(link.url)} size={GLYPH_PX} />
              <Link
                href={link.url}
                {...offsiteLinkProps(link.url)}
                {...(link.url === mailto ? interceptProps() : {})}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {page.kind === "cv" ? null : (
            <li>
              <Glyph glyph={ReadCvLogo} size={GLYPH_PX} />
              <Link render={<RouterLink to={blogPaths.cv} />}>{CV_LINK_LABEL}</Link>
            </li>
          )}
        </ul>
      </div>

      {mailto === undefined ? null : (
        <ul className={styles.contactRail} aria-label={RAIL_LABEL}>
          {MAIL_PRESETS.map((preset) => (
            <li key={preset.id}>
              <Button
                variant="subtle"
                size="sm"
                render={<a href={presetMailto(mailto, preset)} {...interceptProps(preset)} />}
              >
                <Glyph glyph={preset.glyph} size={PILL_GLYPH_PX} />
                {preset.label}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </footer>
  );
}

/**
 * `aria-hidden`: the text beside it already names the destination, and a
 * labelled glyph would be announced as a second one. `bold` to hold its own
 * against the display face, which is heavier than Phosphor's default stroke.
 */
function Glyph({ glyph: Mark, size }: { glyph: Icon; size: number }) {
  return <Mark size={size} weight="bold" aria-hidden />;
}
