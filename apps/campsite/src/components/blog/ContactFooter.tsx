import { Button, Link, Text } from "@jordanscamp/ds";
import {
  Envelope,
  GithubLogo,
  type Icon,
  Link as LinkGlyph,
  LinkedinLogo,
} from "@jordanscamp/ds/icons";
import { type MouseEvent, useRef } from "react";

import { playWindowOpen } from "../../audio/soundEffects";
import { contactMailto } from "../../data/contactEmail";
import { cv } from "../../data/cv";
import { MAIL_PRESETS, type MailPreset, presetMailto } from "../../data/mailPresets";
import { useAnchorFollows } from "../../hooks/useAnchorFollows";
import { useArrivals } from "../../hooks/useArrivals";
import { useDocumentId, useRenderTarget } from "../../prerender/renderTarget";
import { useSceneStore } from "../../store/sceneStore";
import { asset } from "../../utils/assetPath";
import { offsiteLinkProps } from "./offsiteLink";

import styles from "./blog.module.css";

export const CONTACT_ID = "contact";

/** Exported so the CV's PDF step can assert this footer is not on the paper. */
export const CONTACT_HEADING = "Let's talk";

/** The rail carries no visible label, so this is the only thing naming it. */
export const RAIL_LABEL = "Ways to get in touch";

const HEADING_ID = "contact-heading";

/** The mascot's frame on the same page, so the two pictures match. */
const PORTRAIT_PX = 128;

/** Optically level with the 16px link text beside it. */
const GLYPH_PX = 20;

const PILL_GLYPH_PX = 18;

/** Past the end of a smooth scroll, short of the reader losing interest. */
const SETTLE_MS = 500;

/**
 * MouseMail is a window on the CatOS desktop, not a dialog this footer owns, so
 * opening it is a request to the desktop rather than local state — which is why
 * it needs nothing from the component. The desktop is always what this footer
 * is inside when a script is running.
 */
function openMouseMail(preset?: MailPreset) {
  useSceneStore.getState().openMail(preset?.id);
  playWindowOpen();
}

/**
 * Read off the URL rather than stored beside it: a second field would be a fact
 * about a link the link already carries, and one more thing to forget to set.
 */
function glyphFor(url: string): Icon {
  if (url.startsWith("mailto:")) return Envelope;
  if (url.includes("linkedin.com")) return LinkedinLogo;
  if (url.includes("github.com")) return GithubLogo;
  return LinkGlyph;
}

/**
 * `cv.links` is the one list, so this strip, the CV's own header row and the
 * `schema.org/Person` in the page head cannot disagree about how to reach me.
 *
 * A plain `footer`, not `role="contentinfo"`: it sits inside `main`, where that
 * landmark does not apply.
 */
export default function ContactFooter() {
  const anchor = useDocumentId(CONTACT_ID);
  const headingId = useDocumentId(HEADING_ID);
  const banner = useRef<HTMLElement>(null);
  const followed = useAnchorFollows(`#${anchor}`);
  const arrivals = useArrivals(banner, SETTLE_MS, followed);
  const live = useRenderTarget() === "live";
  const mailto = contactMailto;

  /**
   * Every trigger stays a real `mailto:` anchor and JS takes the click off it,
   * so the prerendered page — where none of this runs — still reaches me, and a
   * right-click still offers the address to copy. A `button` would be the
   * plainer control, but the scriptless answer would then be no answer at all.
   */
  function intercept(event: MouseEvent<HTMLAnchorElement>, preset?: MailPreset) {
    // A modified click means the reader wants the browser's behaviour, not ours.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openMouseMail(preset);
  }

  const interceptProps = live && mailto !== undefined ? { onClick: intercept } : {};

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
          {cv.links.map((link) => (
            <li key={link.url}>
              <Glyph glyph={glyphFor(link.url)} size={GLYPH_PX} />
              <Link
                href={link.url}
                {...offsiteLinkProps(link.url)}
                {...(link.url === mailto ? interceptProps : {})}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {mailto === undefined ? null : (
        <ul className={styles.contactRail} aria-label={RAIL_LABEL}>
          {MAIL_PRESETS.map((preset) => (
            <li key={preset.id}>
              <Button
                variant="subtle"
                size="sm"
                render={
                  <a
                    href={presetMailto(mailto, preset)}
                    {...(live ? { onClick: (event) => intercept(event, preset) } : {})}
                  />
                }
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
