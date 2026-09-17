import { Link, Text } from "@jordanscamp/ds";
import type { ReactNode } from "react";

import type { Cv, CvProject, Education, Role } from "../../types/cv";
import CvHeader from "./CvHeader";
import { monthYear } from "./formatDate";
import { offsiteLinkProps } from "./offsiteLink";

import styles from "./blog.module.css";

export interface CvCondensedPageProps {
  cv: Cv;
}

/** The plain words resume parsers map sections by; a creative heading maps to nothing. */
export const CV_CONDENSED_SECTIONS = [
  "Summary",
  "Skills",
  "Experience",
  "Projects",
  "Education",
] as const;
export type CvCondensedSectionName = (typeof CV_CONDENSED_SECTIONS)[number];

/** A role naming no achievement with a `short` falls back to its `highlights`. */
export function condensedBullets(role: Role): string[] {
  const fromAchievements = (role.achievements ?? [])
    .map((achievement) => achievement.short)
    .filter((short): short is string => short !== undefined);
  return fromAchievements.length > 0 ? fromAchievements : role.highlights;
}

export default function CvCondensedPage({ cv }: CvCondensedPageProps) {
  return (
    <article className={`${styles.cv} ${styles.cvCondensed}`}>
      <CvHeader cv={cv} variant="condensed" />

      <Section name="Summary">
        <Text>{cv.profile}</Text>
      </Section>

      <Section name="Skills">
        <dl className={styles.cvShortSkills}>
          {cv.skills.map((group) => (
            <div key={group.group}>
              <dt>
                <Text variant="label" as="span">
                  {group.group}
                </Text>
              </dt>
              <dd>
                <Text variant="body-sm" as="span">
                  {group.items.join(" · ")}
                </Text>
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section name="Experience">
        {cv.experience.map((role) => (
          <RoleEntry key={`${role.org} ${role.start}`} role={role} />
        ))}
      </Section>

      <Section name="Projects">
        <ul className={styles.cvShortList}>
          {cv.projects.map((project) => (
            <ProjectLine key={project.name} project={project} />
          ))}
        </ul>
      </Section>

      <Section name="Education">
        <ul className={styles.cvShortList}>
          {cv.education.map((entry) => (
            <EducationLine key={`${entry.institution} ${entry.start}`} entry={entry} />
          ))}
        </ul>
      </Section>
    </article>
  );
}

function Section({ name, children }: { name: CvCondensedSectionName; children: ReactNode }) {
  return (
    <section className={styles.cvShortSection}>
      <Text variant="title-2">{name}</Text>
      {children}
    </section>
  );
}

function DateRange({ start, end }: { start: string; end?: string }) {
  return (
    <>
      <time dateTime={start}>{monthYear(start)}</time>
      {" – "}
      {end ? <time dateTime={end}>{monthYear(end)}</time> : "Present"}
    </>
  );
}

function RoleEntry({ role }: { role: Role }) {
  const bullets = condensedBullets(role);
  return (
    <div className={styles.cvShortRole}>
      <div className={styles.cvRoleHead}>
        <Text variant="title-4" as="h3">
          {role.title}
          {", "}
          {role.url ? (
            <Link href={role.url} {...offsiteLinkProps(role.url)}>
              {role.org}
            </Link>
          ) : (
            role.org
          )}
        </Text>
        <Text variant="body-sm" tone="muted" as="span">
          <DateRange start={role.start} end={role.end} />
        </Text>
      </div>
      {(role.short ?? role.summary) && (
        <Text variant="body-sm" tone="muted">
          {role.short ?? role.summary}
        </Text>
      )}
      {bullets.length > 0 && (
        <ul className={styles.cvShortList}>
          {bullets.map((bullet) => (
            <li key={bullet}>
              <Text variant="body-sm" as="span">
                {bullet}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProjectLine({ project }: { project: CvProject }) {
  return (
    <li>
      <Text variant="body-sm" as="span">
        <strong>
          {project.url ? (
            <Link href={project.url} {...offsiteLinkProps(project.url)}>
              {project.name}
            </Link>
          ) : (
            project.name
          )}
        </strong>
        {" · "}
        {project.short ?? project.summary}{" "}
        <span className={styles.cvShortDates}>
          (<DateRange start={project.start} end={project.end} />)
        </span>
      </Text>
    </li>
  );
}

function EducationLine({ entry }: { entry: Education }) {
  return (
    <li>
      <Text variant="body-sm" as="span">
        <strong>{entry.qualification}</strong>
        {" · "}
        {entry.url ? (
          <Link href={entry.url} {...offsiteLinkProps(entry.url)}>
            {entry.institution}
          </Link>
        ) : (
          entry.institution
        )}{" "}
        <span className={styles.cvShortDates}>
          (<DateRange start={entry.start} end={entry.end} />)
        </span>
      </Text>
    </li>
  );
}
