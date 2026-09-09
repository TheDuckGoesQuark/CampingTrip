import { Badge, Button, Text } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { SITE_ORIGIN } from "../../data/blogPages";
import { slugify } from "../../data/slug";
import { routes } from "../../routing/navigation";

import "../../styles/blogProse.css";
import type { Project } from "../../types/project";
import PhotoBroomPage from "../overlays/PhotoBroomPage";

import styles from "./blog.module.css";

export interface ProjectPageProps {
  project: Project;
}

/**
 * Whether a project's link points at the site the reader is already inside.
 * Derived from the URL rather than flagged on the project, so it cannot
 * disagree with it.
 */
function isThisSite(url: string): boolean {
  return url === SITE_ORIGIN || url === `${SITE_ORIGIN}/`;
}

export default function ProjectPage({ project }: ProjectPageProps) {
  // PhotoBroom has a full landing page, folded in from its old subdomain.
  if (slugify(project.title) === "photobroom") return <PhotoBroomPage />;

  const body =
    typeof project.description === "string"
      ? project.description.split("\n\n").map((para) => <p key={para.slice(0, 32)}>{para}</p>)
      : project.description;

  return (
    <article>
      {/* Sized like a title-2, but it is still the one heading this page is about. */}
      <header className={styles.projectHeader}>
        <Text variant="title-2" as="h1">
          {project.title}
        </Text>
        <Text variant="body-sm" tone="muted">
          {project.year}
        </Text>
        {project.tags && project.tags.length > 0 && (
          <ul className={styles.tagList}>
            {project.tags.map((tag) => (
              <li key={tag}>
                <Badge>{tag}</Badge>
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="blog-prose">{body}</div>

      <footer className={styles.projectActions}>
        {/* The campsite is one of the projects, and a new tab at the origin
            would reload the site the reader is standing in. */}
        {isThisSite(project.url) ? (
          <Button render={<RouterLink to={routes.tent} />} variant="subtle">
            Touch grass →
          </Button>
        ) : (
          <Button
            render={<a href={project.url} target="_blank" rel="noopener noreferrer" />}
            variant="subtle"
          >
            Visit Project →
          </Button>
        )}
        {project.github && (
          <Button
            render={<a href={project.github} target="_blank" rel="noopener noreferrer" />}
            variant="default"
          >
            Source
          </Button>
        )}
      </footer>
    </article>
  );
}
