import { Card, Icon, Link, Tag, Text, Tile } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { bookmarks } from "../../data/bookmarks";
import { projects } from "../../data/projects";
import { slugify } from "../../data/slug";
import { blogPaths } from "../../routing/blogPaths";
import { routes } from "../../routing/navigation";
import type { Bookmark, Project } from "../../types/project";
import { asset } from "../../utils/assetPath";
import FeedPanel from "./FeedPanel";

import styles from "./blog.module.css";

const CAT_SOURCE = "https://giphy.com/gifs/jinkx-gato-jinx-YfIqRqgD6HxsPTIwfg";

const FOOTNOTE_ID = "home-footnote";

const LEAVE_TITLE = "Leave CatOS for the campsite";

/**
 * The page CatNav opens on — who I am, what I've built, what I use, and the blog
 * feed down the right. The desktop behind it holds no content of its own, so
 * everything worth reading is reachable from here.
 */
export default function HomePage() {
  return (
    <div className={styles.home}>
      <div className={styles.homeMain}>
        <header className={styles.homeHeader}>
          <div className={styles.masthead}>
            <div className={styles.mastheadTitle}>
              <Text variant="title-1">Hello, let's see if we can make your day brighter.</Text>
            </div>

            <Mascot />
          </div>

          <Text>
            I'm Jordan. I love making people's lives easier and more fun. I also love solving
            complex problems with easy to follow systems. This website is trying to do both. If it
            sounds like we'd work well together, feel free to let me know via the medium of your
            liking
            <sup className={styles.footnoteRef}>
              <Link href={`#${FOOTNOTE_ID}`} aria-label="Footnote">
                *
              </Link>
            </sup>
            .
          </Text>
          <div className={styles.paragraphGap}>
            <Text>
              I write about whatever I've been fixated on lately. Sometimes it's code. Often it's
              fun things I've learned, or had to write down to make sure I understood. Topics
              include music, physics, and nostalgic Flash game mechanics that inspired me.
            </Text>
          </div>
          <div className={styles.footnote}>
            <Text variant="body-sm" tone="muted" id={FOOTNOTE_ID}>
              {/* Decorative: it ties the note to the marker above, which the link
                  already names for a screen reader. */}
              <span aria-hidden="true">*</span> or if you just fancy a break, <EscapeHatch /> and be
              immersed in the great outdoors.
            </Text>
          </div>
        </header>

        <section className={styles.homeSection}>
          <Text variant="title-3" as="h2">
            Projects
          </Text>
          <ul className={styles.sectionBody}>
            {projects.map((project) => (
              <ProjectRow key={project.title} project={project} />
            ))}
          </ul>
        </section>

        <section className={styles.homeSection}>
          <Text variant="title-3" as="h2">
            Favourite Tools
          </Text>
          <div className={styles.sectionNote}>
            <Text variant="body-sm" tone="muted">
              Things I keep coming back to, and would nudge at you across a table.
            </Text>
          </div>
          <ul className={styles.toolGrid}>
            {bookmarks.map((bookmark) => (
              <ToolCard key={bookmark.title} bookmark={bookmark} />
            ))}
          </ul>
        </section>
      </div>

      <aside className={styles.homeFeed}>
        <FeedPanel />
      </aside>
    </div>
  );
}

/**
 * The way out, named after whichever control the visitor actually has: a laptop
 * has an Esc key, a phone has the menu bar's button. Swapped on `pointer`, not
 * on width — a narrow window on a desktop still has a keyboard — and in CSS
 * rather than from `isMobile`, because this page is prerendered and a JS answer
 * would ship the wrong branch in the static HTML.
 *
 * Both are the same link, since Esc and Touch grass both end at the campsite.
 */
function EscapeHatch() {
  return (
    <>
      <span className={styles.ifKeyboard}>
        hit{" "}
        <RouterLink to={routes.tent} className={styles.keyLink} title={LEAVE_TITLE}>
          <kbd className={styles.key}>Esc</kbd>
        </RouterLink>{" "}
        a few times
      </span>
      <span className={styles.ifTouch}>
        tap{" "}
        <RouterLink to={routes.tent} className={styles.keyLink} title={LEAVE_TITLE}>
          <span className={styles.key}>
            <Icon name="door-arrow" size="sm" /> Touch grass
          </span>
        </RouterLink>
      </span>
    </>
  );
}

/**
 * Art that happens to look a lot like Smittens rather than a picture of him, so
 * the credit is load-bearing. Reduced motion gets a different file, not a rule:
 * CSS cannot pause a GIF.
 */
function Mascot() {
  return (
    <figure className={styles.mascot}>
      <picture>
        <source
          srcSet={asset("images/pixel-cat-still.webp")}
          media="(prefers-reduced-motion: reduce)"
        />
        <img
          className={styles.mascotFrame}
          src={asset("images/pixel-cat.gif")}
          alt="A pixel-art tuxedo cat, sitting upright and flicking its tail"
          width={128}
          height={128}
        />
      </picture>
      <figcaption>
        <Text variant="label" tone="muted" as="span">
          cat by{" "}
          <Link href={CAT_SOURCE} target="_blank" rel="noopener noreferrer">
            @victorbasso
          </Link>
        </Text>
      </figcaption>
    </figure>
  );
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <li className={styles.row}>
      {/* A project's `icon` path is not shipped, so the letter tile is what draws. */}
      <Tile label={project.title} color={project.color} size="md" />
      <div className={styles.rowBody}>
        <div className={styles.titleLine}>
          <Text variant="title-4" as="h3">
            <Link render={<RouterLink to={blogPaths.project(slugify(project.title))} />}>
              {project.title}
            </Link>
          </Text>
          <Text variant="label" tone="muted" as="span">
            {project.year}
          </Text>
        </div>
        {project.tags && project.tags.length > 0 && (
          <ul className={styles.tagList}>
            {project.tags.map((tag) => (
              <li key={tag}>
                <Tag>{tag}</Tag>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function ToolCard({ bookmark }: { bookmark: Bookmark }) {
  return (
    <li>
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
    </li>
  );
}
