import { Button, Icon, Link, SegmentedNav, Text, type IconName } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { mailtoOf } from "../../data/contactEmail";
import { mailPreset } from "../../data/mailPresets";
import { useMouseMailIntercept } from "../../hooks/useMouseMailIntercept";
import { blogPaths } from "../../routing/blogPaths";
import type { Cv } from "../../types/cv";
import { asset } from "../../utils/assetPath";
import { formatDate } from "./formatDate";
import { offsiteLinkProps } from "./offsiteLink";

import styles from "./CvHeader.module.css";

export type CvVariant = "full" | "condensed";

export const VARIANT_LABELS = { full: "Full", condensed: "Condensed" } as const;

export const VARIANT_NAV_LABEL = "Length of this CV";

const PATHS: Record<CvVariant, { page: string; pdf: string }> = {
  full: { page: blogPaths.cv, pdf: blogPaths.cvPdf },
  condensed: { page: blogPaths.cvCondensed, pdf: blogPaths.cvCondensedPdf },
};

const VARIANTS = ["full", "condensed"] as const;

function iconOfLink(url: string): IconName {
  return url.startsWith("mailto:") ? "envelope" : "globe";
}

/** A reader who mails from a CV is here about work, so the address opens on that template. */
const HIRING = mailPreset("work");

export default function CvHeader({ cv, variant }: { cv: Cv; variant: CvVariant }) {
  const mailto = mailtoOf(cv);
  const interceptProps = useMouseMailIntercept();

  return (
    <header className={styles.cvHeader}>
      <div className={styles.cvIdentity}>
        <Text variant="title-1">{cv.name}</Text>
        <SegmentedNav aria-label={VARIANT_NAV_LABEL}>
          {VARIANTS.map((name) => (
            <SegmentedNav.Item
              key={name}
              current={name === variant}
              render={name === variant ? undefined : <RouterLink to={PATHS[name].page} />}
            >
              {VARIANT_LABELS[name]}
            </SegmentedNav.Item>
          ))}
        </SegmentedNav>
      </div>
      <Text variant="body-lg" tone="muted">
        {cv.headline}
      </Text>
      <ul className={styles.cvLinks}>
        {cv.location && (
          <li>
            <Icon name="house" size="sm" />
            <Text variant="body-sm" as="span">
              {cv.location}
            </Text>
          </li>
        )}
        {cv.citizenship && (
          <li>
            <img className={styles.cvFlag} src={asset(cv.citizenship.flag)} alt="" />
            <Text variant="body-sm" as="span">
              {cv.citizenship.label}
            </Text>
          </li>
        )}
        {cv.links.map((link) => {
          const hiring = link.url === mailto;
          return (
            <li key={link.url}>
              <Icon name={iconOfLink(link.url)} size="sm" />
              <Link
                href={link.url}
                {...offsiteLinkProps(link.url)}
                {...(hiring ? interceptProps(HIRING) : {})}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className={styles.cvActions}>
        <Button variant="default" size="sm" render={<a href={PATHS[variant].pdf} download />}>
          Download PDF
        </Button>
        <Text variant="label" tone="muted" as="span">
          Updated <time dateTime={cv.updated}>{formatDate(cv.updated)}</time>
        </Text>
      </div>
    </header>
  );
}
