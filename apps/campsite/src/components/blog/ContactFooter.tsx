import { Link, Text } from "@jordanscamp/ds";
import {
  Envelope,
  GithubLogo,
  type Icon,
  Link as LinkGlyph,
  LinkedinLogo,
} from "@jordanscamp/ds/icons";

import { cv } from "../../data/cv";
import { useDocumentId } from "../../prerender/renderTarget";
import { asset } from "../../utils/assetPath";
import { offsiteLinkProps } from "./offsiteLink";

import styles from "./blog.module.css";

export const CONTACT_ID = "contact";

/** Exported so the CV's PDF step can assert this footer is not on the paper. */
export const CONTACT_HEADING = "Let's talk";

const HEADING_ID = "contact-heading";

/** The mascot's frame on the same page, so the two pictures match. */
const PORTRAIT_PX = 128;

/** Optically level with the 16px link text beside it. */
const GLYPH_PX = 20;

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
  return (
    <footer id={anchor} className={styles.contact} aria-labelledby={headingId}>
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
              <Glyph glyph={glyphFor(link.url)} />
              <Link href={link.url} {...offsiteLinkProps(link.url)}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

/**
 * `aria-hidden`: the link beside it already names the destination, and a
 * labelled glyph would be announced as a second one. `bold` to hold its own
 * against the display face, which is heavier than Phosphor's default stroke.
 */
function Glyph({ glyph: Mark }: { glyph: Icon }) {
  return <Mark size={GLYPH_PX} weight="bold" aria-hidden />;
}
