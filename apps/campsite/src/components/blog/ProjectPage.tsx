import { Badge, Button, Text } from "@jordanscamp/ds";

import { slugify } from "../../data/slug";

import "../../styles/blogProse.css";
import type { Project } from "../../types/project";
import PhotoBroomPage from "../overlays/PhotoBroomPage";

import styles from "./blog.module.css";

export interface ProjectPageProps {
  project: Project;
}

export default function ProjectPage({ project }: ProjectPageProps) {
  // PhotoBroom has a full landing page, folded in from its old subdomain.
  if (slugify(project.title) === "photobroom") return <PhotoBroomPage />;

  const body =
    typeof project.description === "string"
      ? project.description.split("\n\n").map((para) => <p key={para.slice(0, 32)}>{para}</p>)
      : project.description;

  return (
    <>
      <div className={styles.projectHeader}>
        <Text variant="title-2">{project.title}</Text>
        <Text variant="body-sm" tone="muted">
          {project.year}
        </Text>
        {project.tags && project.tags.length > 0 && (
          <div className={styles.tagRow}>
            {project.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}
      </div>

      <div className="blog-prose">{body}</div>

      <div className={styles.projectActions}>
        <Button
          render={<a href={project.url} target="_blank" rel="noopener noreferrer" />}
          variant="subtle"
        >
          Visit Project →
        </Button>
        {project.github && (
          <Button
            render={<a href={project.github} target="_blank" rel="noopener noreferrer" />}
            variant="default"
          >
            Source
          </Button>
        )}
      </div>
    </>
  );
}
