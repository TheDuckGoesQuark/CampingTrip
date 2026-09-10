import { Button, Link, Tag, Text } from "@jordanscamp/ds";

import { blogPaths } from "../../routing/blogPaths";

import "../../styles/blogProse.css";
import type { Cv, Education, Role } from "../../types/cv";
import { formatDate, monthYear } from "./formatDate";
import { offsiteLinkProps } from "./offsiteLink";

import styles from "./blog.module.css";

export interface CvPageProps {
  cv: Cv;
}

/**
 * Two `time` elements rather than one string: a range has no single datetime,
 * and this page is parsed by CV tooling as well as read.
 */
function DateRange({ start, end }: { start: string; end?: string }) {
  return (
    <>
      <time dateTime={start}>{monthYear(start)}</time>
      {" – "}
      {end ? <time dateTime={end}>{monthYear(end)}</time> : "Present"}
    </>
  );
}

/**
 * The CV: narrative first, then the conventional document. Plain markup below
 * the narrative, because this page is also printed to the PDF and read by
 * tooling that parses CVs.
 */
export default function CvPage({ cv }: CvPageProps) {
  return (
    <article className={styles.cv}>
      <header className={styles.cvHeader}>
        <Text variant="title-1">{cv.name}</Text>
        <Text variant="body-lg" tone="muted">
          {cv.headline}
        </Text>
        <div className={styles.cvLinks}>
          {cv.links.map((link) => (
            <Link key={link.url} href={link.url} {...offsiteLinkProps(link.url)}>
              {link.label}
            </Link>
          ))}
          <Text variant="label" tone="muted" as="span">
            Updated <time dateTime={cv.updated}>{formatDate(cv.updated)}</time>
          </Text>
        </div>
        <div className={styles.cvActions}>
          <Button variant="default" size="sm" render={<a href={blogPaths.cvPdf} download />}>
            Download PDF
          </Button>
        </div>
      </header>

      <div className="blog-prose">{cv.narrative}</div>

      <section className={styles.cvSection}>
        <Text variant="title-2">Experience</Text>
        {cv.experience.map((role) => (
          <RoleEntry key={`${role.org} ${role.start}`} role={role} />
        ))}
      </section>

      <section className={styles.cvSection}>
        <Text variant="title-2">Skills</Text>
        <dl className={styles.cvSkills}>
          {cv.skills.map((group) => (
            <div key={group.group} className={styles.cvSkillGroup}>
              <dt>
                <Text variant="label" as="span">
                  {group.group}
                </Text>
              </dt>
              <dd>
                <Text variant="body-sm" as="span">
                  {group.items.join(", ")}
                </Text>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.cvSection}>
        <Text variant="title-2">Education</Text>
        {cv.education.map((entry) => (
          <EducationEntry key={`${entry.institution} ${entry.start}`} entry={entry} />
        ))}
      </section>
    </article>
  );
}

function RoleEntry({ role }: { role: Role }) {
  return (
    <div className={styles.cvRole}>
      <div className={styles.cvRoleHead}>
        <Text variant="title-4" as="h3">
          {role.title}
        </Text>
        <Text variant="label" tone="muted" as="span">
          <DateRange start={role.start} end={role.end} />
        </Text>
      </div>
      <Text variant="body-sm" tone="muted">
        {role.location ? `${role.org}, ${role.location}` : role.org}
      </Text>
      {role.summary && <Text>{role.summary}</Text>}
      {role.highlights.length > 0 && <Highlights items={role.highlights} />}
      {role.tags.length > 0 && (
        <ul className={styles.tagList}>
          {role.tags.map((tag) => (
            <li key={tag}>
              <Tag>{tag}</Tag>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EducationEntry({ entry }: { entry: Education }) {
  return (
    <div className={styles.cvEducation}>
      <div className={styles.cvRoleHead}>
        <Text variant="title-4" as="h3">
          {entry.qualification}
        </Text>
        <Text variant="label" tone="muted" as="span">
          <DateRange start={entry.start} end={entry.end} />
        </Text>
      </div>
      <Text variant="body-sm" tone="muted">
        {entry.institution}
      </Text>
      {entry.highlights && entry.highlights.length > 0 && <Highlights items={entry.highlights} />}
    </div>
  );
}

function Highlights({ items }: { items: string[] }) {
  return (
    <ul className={styles.cvHighlights}>
      {items.map((item) => (
        <li key={item}>
          <Text as="span">{item}</Text>
        </li>
      ))}
    </ul>
  );
}
