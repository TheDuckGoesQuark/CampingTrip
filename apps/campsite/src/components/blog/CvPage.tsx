import { Link, Text } from "@jordanscamp/ds";
import { Fragment, type ReactNode } from "react";

import { useDocumentId } from "../../prerender/renderTarget";
import type {
  Achievement,
  Commendation,
  Coursework,
  Cv,
  CvProject,
  Education,
  Role,
} from "../../types/cv";

import "../../styles/blogProse.css";
import { asset } from "../../utils/assetPath";
import { projectAnchorId, roleAnchorId } from "../../utils/cvAnchors";
import CvHeader from "./CvHeader";
import { monthYear } from "./formatDate";
import { offsiteLinkProps } from "./offsiteLink";

import styles from "./blog.module.css";

export interface CvPageProps {
  cv: Cv;
}

/* Plain, conventional words: the resume parsers behind job applications map
   sections by heading text, and a creative heading maps to nothing. */
export const CV_SECTIONS = [
  "Summary",
  "Skills",
  "Experience",
  "Projects",
  "Education",
  "Commendations",
] as const;
export type CvSectionName = (typeof CV_SECTIONS)[number];

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

export default function CvPage({ cv }: CvPageProps) {
  return (
    <article className={styles.cv}>
      <CvHeader cv={cv} variant="full" />

      <CvSection name="Summary">
        <div className="blog-prose">{cv.narrative}</div>
      </CvSection>

      <CvSection name="Skills">
        <dl className={styles.cvSkills}>
          {cv.skills.map((group) => (
            <div
              key={group.group}
              className={group.fullWidth ? styles.cvSkillGroupFull : styles.cvSkillGroup}
            >
              <dt>
                <Text variant="label" as="span">
                  {group.group}
                </Text>
              </dt>
              <dd>
                <ul className={styles.cvSkillItems}>
                  {group.items.map((item) => (
                    <li key={item}>
                      <Text variant="body-sm" as="span">
                        {item}
                      </Text>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </CvSection>

      <CvSection name="Experience">
        {cv.experience.map((role) => (
          <RoleEntry key={`${role.org} ${role.start}`} role={role} />
        ))}
      </CvSection>

      <CvSection name="Projects">
        {cv.projects.map((project) => (
          <ProjectEntry key={project.name} project={project} />
        ))}
      </CvSection>

      <CvSection name="Education">
        {cv.education.map((entry) => (
          <EducationEntry key={`${entry.institution} ${entry.start}`} entry={entry} />
        ))}
      </CvSection>

      {cv.commendations.length > 0 && (
        <CvSection name="Commendations">
          {cv.commendationsNote && (
            <Text variant="body-sm" tone="muted">
              {cv.commendationsNote}
            </Text>
          )}
          {cv.commendations.map((commendation) => (
            <CommendationEntry key={commendation.quote} commendation={commendation} />
          ))}
        </CvSection>
      )}
    </article>
  );
}

function CvSection({ name, children }: { name: CvSectionName; children: ReactNode }) {
  return (
    <section className={styles.cvSection}>
      <Text variant="title-2">{name}</Text>
      {children}
    </section>
  );
}

function RoleEntry({ role }: { role: Role }) {
  const anchor = useDocumentId(roleAnchorId(role.org));
  return (
    <div className={styles.cvRole} id={anchor}>
      <div className={styles.cvRoleHead}>
        <Text variant="title-4" as="h3">
          {role.title}
        </Text>
        <Text variant="body-sm" tone="muted" as="span">
          <DateRange start={role.start} end={role.end} />
        </Text>
      </div>
      <OrgLine name={role.org} url={role.url} logo={role.logo} detail={role.location} />
      {role.summary && <Text>{role.summary}</Text>}
      {role.achievements?.map((achievement) => (
        <AchievementEntry key={achievement.name} achievement={achievement} />
      ))}
      {role.highlights.length > 0 && <Highlights items={role.highlights} />}
    </div>
  );
}

function ProjectEntry({ project }: { project: CvProject }) {
  const anchor = useDocumentId(projectAnchorId(project.name));
  return (
    <div className={styles.cvRole} id={anchor}>
      <div className={styles.cvRoleHead}>
        <Text variant="title-4" as="h3">
          {project.name}
        </Text>
        <Text variant="body-sm" tone="muted" as="span">
          <DateRange start={project.start} end={project.end} />
        </Text>
      </div>
      {project.url && (
        <Text variant="body-sm" tone="muted">
          <Link href={project.url} {...offsiteLinkProps(project.url)}>
            {project.urlLabel ?? project.url.replace(/^https?:\/\//, "")}
          </Link>
        </Text>
      )}
      <Text>{project.summary}</Text>
      {project.highlights.length > 0 && <Highlights items={project.highlights} />}
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
        <Text variant="body-sm" tone="muted" as="span">
          <DateRange start={entry.start} end={entry.end} />
        </Text>
      </div>
      <OrgLine name={entry.institution} url={entry.url} logo={entry.logo} />
      {entry.coursework && entry.coursework.length > 0 && (
        <CourseworkList items={entry.coursework} />
      )}
    </div>
  );
}

/** The subject carries the link so the line stays prose, rather than trailing a bare URL. */
function CourseworkList({ items }: { items: Coursework[] }) {
  return (
    <ul className={styles.cvHighlights}>
      {items.map(({ subject, detail, url }) => (
        <li key={subject}>
          <Text variant="body-sm" as="span">
            {url ? (
              <Link href={url} {...offsiteLinkProps(url)}>
                {subject}
              </Link>
            ) : (
              subject
            )}
            {`: ${detail}`}
          </Text>
        </li>
      ))}
    </ul>
  );
}

/**
 * `figure` + `figcaption` is how the spec attributes a quotation: the attribution is
 * about the quote, not part of what was said, so it sits outside the `blockquote`.
 * The name is not a `cite` — that element is for the title of a work, not a person.
 */
function CommendationEntry({ commendation }: { commendation: Commendation }) {
  const { quote, attribution, url } = commendation;
  return (
    <figure className={styles.cvCommendation}>
      <blockquote className={styles.cvQuote} cite={url}>
        <Text>{quote}</Text>
      </blockquote>
      <figcaption className={styles.cvAttribution}>
        <Text variant="body-sm" tone="muted" as="span">
          {url ? (
            <Link href={url} {...offsiteLinkProps(url)}>
              {attribution}
            </Link>
          ) : (
            attribution
          )}
        </Text>
      </figcaption>
    </figure>
  );
}

/* Outcome leads so a reader taking only the first facet of each still has the role. */
const FACETS = [
  ["Outcome", (a: Achievement) => a.outcome],
  ["Feature", (a: Achievement) => a.feature],
  ["Difficulty", (a: Achievement) => a.difficulty],
  ["Approach", (a: Achievement) => a.approach],
] as const;

/**
 * `dt`/`dd` arrive as fragments rather than wrapped in a `div`, so every label and
 * value is a direct child of the grid the `dl` establishes.
 */
function AchievementEntry({ achievement }: { achievement: Achievement }) {
  return (
    <div className={styles.cvAchievement}>
      <Text variant="title-4" as="h4">
        {achievement.name}
      </Text>
      <dl className={styles.cvFacets}>
        {FACETS.map(([label, read]) => {
          const value = read(achievement);
          if (!value) return null;
          return (
            <Fragment key={label}>
              <dt>
                <Text variant="label" as="span">
                  {label}
                </Text>
              </dt>
              <dd>
                <Text variant="body-sm" as="span">
                  {value}
                </Text>
              </dd>
            </Fragment>
          );
        })}
      </dl>
    </div>
  );
}

/** The mark is decoration beside a name that already says who this is, so it has no alt text. */
function OrgLine({
  name,
  url,
  logo,
  detail,
}: {
  name: string;
  url?: string;
  logo?: string;
  detail?: string;
}) {
  return (
    <Text variant="body-sm" tone="muted" as="div">
      <span className={styles.cvOrg}>
        {logo && (
          <img className={styles.cvOrgLogo} src={asset(logo)} alt="" width={20} height={20} />
        )}
        {url ? (
          <Link href={url} {...offsiteLinkProps(url)}>
            {name}
          </Link>
        ) : (
          name
        )}
        {detail && `, ${detail}`}
      </span>
    </Text>
  );
}

function Highlights({ items }: { items: string[] }) {
  return (
    <ul className={styles.cvHighlights}>
      {items.map((item) => (
        <li key={item}>
          <Text variant="body-sm" as="span">
            {item}
          </Text>
        </li>
      ))}
    </ul>
  );
}
