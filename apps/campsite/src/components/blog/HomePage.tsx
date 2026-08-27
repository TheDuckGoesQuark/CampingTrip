import { Card, Link, Tag, Text, Tile } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { bookmarks } from "../../data/bookmarks";
import { projects } from "../../data/projects";
import { slugify } from "../../data/slug";
import { blogPaths } from "../../routing/blogPaths";
import type { Bookmark, Project } from "../../types/project";
import FeedPanel from "./FeedPanel";

import styles from "./blog.module.css";

/**
 * The page CatNav opens on — who I am, what I've built, what I use, and the blog
 * feed down the right. The desktop behind it holds no content of its own, so
 * everything worth reading is reachable from here.
 */
export default function HomePage() {
  return (
    <div className={styles.home}>
      <div className={styles.homeMain}>
        <div className={styles.eyebrow}>
          <Text variant="label" tone="muted" as="span">
            Jordan's Camp
          </Text>
        </div>
        <div className={styles.pageTitle}>
          <Text variant="title-1">Hello, you found the laptop.</Text>
        </div>

        <div className={styles.intro}>
          <Text>
            I'm Jordan. I build software for a living and make odd little things for the fun of it —
            this site being the oddest of them. There's a tent out there with a cat in it, and in
            here there's a browser, because I couldn't resist putting a computer inside a campsite
            inside a computer.
          </Text>
          <div className={styles.paragraphGap}>
            <Text>
              I write about whatever I've been fixated on lately. Sometimes that's code. Often it's
              records, or a Flash game from 2004 that taught me something about systems. The tags
              will let you skip one or the other.
            </Text>
          </div>
        </div>

        <hr className={styles.rule} />
        <Text variant="title-3">Projects</Text>
        <div className={styles.sectionBody}>
          {projects.map((project) => (
            <ProjectRow key={project.title} project={project} />
          ))}
        </div>

        <hr className={styles.rule} />
        <Text variant="title-3">Favourite Tools</Text>
        <div className={styles.sectionNote}>
          <Text variant="body-sm" tone="muted">
            Things I keep coming back to, and would nudge at you across a table.
          </Text>
        </div>
        <div className={styles.toolGrid}>
          {bookmarks.map((bookmark) => (
            <ToolCard key={bookmark.title} bookmark={bookmark} />
          ))}
        </div>
      </div>

      <div className={styles.homeFeed}>
        <FeedPanel />
      </div>
    </div>
  );
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <div className={styles.row}>
      {/* A project's `icon` path is not shipped, so the letter tile is what draws. */}
      <Tile label={project.title} color={project.color} size="md" />
      <div className={styles.rowBody}>
        <div className={styles.titleLine}>
          <Link render={<RouterLink to={blogPaths.project(slugify(project.title))} />}>
            <Text variant="title-4" as="span">
              {project.title}
            </Text>
          </Link>
          <Text variant="label" tone="muted" as="span">
            {project.year}
          </Text>
        </div>
        {project.tags && project.tags.length > 0 && (
          <div className={styles.tagRow}>
            {project.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCard({ bookmark }: { bookmark: Bookmark }) {
  return (
    <Card tone="sunken" padding="sm">
      <div className={styles.toolCard}>
        <Tile label={bookmark.title} color={bookmark.color} size="sm" />
        <Link render={<RouterLink to={blogPaths.tool(slugify(bookmark.title))} />}>
          <Text variant="body-sm" as="span">
            <strong>{bookmark.title}</strong>
          </Text>
        </Link>
      </div>
    </Card>
  );
}
