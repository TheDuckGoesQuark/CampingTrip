import { Button, Link, Tag, Text } from "@jordanscamp/ds";

import { blogPaths } from "../../routing/blogPaths";

import "../../styles/blogProse.css";
import type { Cv, Education, Role } from "../../types/cv";
import { formatDate, monthYear } from "./formatDate";

import styles from "./blog.module.css";

export interface CvPageProps {
  cv: Cv;
}

function dateRange(start: string, end?: string): string {
  return `${monthYear(start)} – ${end ? monthYear(end) : "Present"}`;
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
            <Link
              key={link.url}
              href={link.url}
              {...(link.url.startsWith("mailto:")
                ? {}
                : { target: "_blank", rel: "noopener noreferrer" })}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className={styles.cvActions}>
          <Button variant="default" size="sm" render={<a href={blogPaths.cvPdf} download />}>
            Download PDF
          </Button>
          <Text variant="label" tone="muted" as="span">
            Updated {formatDate(cv.updated)}
          </Text>
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
        <Text variant="title-4">{role.title}</Text>
        <Text variant="label" tone="muted" as="span">
          {dateRange(role.start, role.end)}
        </Text>
      </div>
      <Text variant="body-sm" tone="muted">
        {role.location ? `${role.org}, ${role.location}` : role.org}
      </Text>
      <Text>{role.summary}</Text>
      <ul className={styles.cvHighlights}>
        {role.highlights.map((highlight) => (
          <li key={highlight}>
            <Text as="span">{highlight}</Text>
          </li>
        ))}
      </ul>
      {role.tags.length > 0 && (
        <div className={styles.tagRow}>
          {role.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      )}
    </div>
  );
}

function EducationEntry({ entry }: { entry: Education }) {
  return (
    <div className={styles.cvEducation}>
      <div className={styles.cvRoleHead}>
        <Text variant="title-4">{entry.qualification}</Text>
        <Text variant="label" tone="muted" as="span">
          {dateRange(entry.start, entry.end)}
        </Text>
      </div>
      <Text variant="body-sm" tone="muted">
        {entry.institution}
      </Text>
    </div>
  );
}
