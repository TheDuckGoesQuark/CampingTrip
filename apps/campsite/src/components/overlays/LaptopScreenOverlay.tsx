import {
  Badge,
  Button,
  DesktopIcon,
  Dock,
  DockDivider,
  DockItem,
  Link,
  MenuBar,
  Modal,
  Text,
  Window,
} from "@jordanscamp/ds";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { playWindowOpen, playSoftClick } from "../../audio/soundEffects";
import { bookmarks } from "../../data/bookmarks";
import { projects } from "../../data/projects";
import { slugify } from "../../data/slug";
import { routes } from "../../routing/navigation";
import { useSceneStore } from "../../store/sceneStore";
import { useSessionStore } from "../../store/sessionStore";
import type { Project, Bookmark } from "../../types/project";
import { asset } from "../../utils/assetPath";
import PhotoBroomPage from "./PhotoBroomPage";

type OpenItem = { kind: "project"; data: Project } | { kind: "bookmark"; data: Bookmark };

/** Resolve the open window from the URL-backed slug (single source of truth). */
function resolveOpenItem(slug: string | null): OpenItem | null {
  if (!slug) return null;
  const project = projects.find((p) => slugify(p.title) === slug);
  if (project) return { kind: "project", data: project };
  const bookmark = bookmarks.find((b) => slugify(b.title) === slug);
  if (bookmark) return { kind: "bookmark", data: bookmark };
  return null;
}

/**
 * CatOS — the laptop's blog, a full-screen Base UI takeover (so it traps focus,
 * returns focus on close, and handles Escape). Composes the DS faux-desktop
 * chrome (MenuBar, DesktopIcon, Dock, Window) with the campsite's own content.
 * Open state is URL-driven (`laptopFocused`); Escape/close navigate.
 */
export default function LaptopScreenOverlay() {
  const navigate = useNavigate();
  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const activePostSlug = useSceneStore((s) => s.activePostSlug);
  const lastVisitedAt = useSessionStore((s) => s.lastVisitedAt);
  const [clock, setClock] = useState("");
  const prevFocused = useRef(false);

  // The open window is URL-backed, so closing/opening a post is a navigation:
  // BlogRoute maps /blog/:slug back onto activePostSlug.
  const openItem = useMemo(() => resolveOpenItem(activePostSlug), [activePostSlug]);
  const closeWindow = useCallback(() => navigate(routes.blog()), [navigate]);

  // Update lastVisitedAt when leaving CatOS.
  useEffect(() => {
    if (prevFocused.current && !laptopFocused) {
      useSessionStore.getState().updateLastVisited();
    }
    prevFocused.current = laptopFocused;
  }, [laptopFocused]);

  // Live clock while open.
  useEffect(() => {
    if (!laptopFocused) return;
    const update = () =>
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [laptopFocused]);

  // Base UI reports close intent (Escape). Close the open post first, else the
  // whole takeover — mirrors the layered Escape behaviour, no manual keydown.
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      playSoftClick();
      navigate(openItem ? routes.blog() : routes.tent);
    },
    [openItem, navigate],
  );

  const handleProjectClick = useCallback(
    (project: Project) => {
      navigate(routes.blog(slugify(project.title)));
      playWindowOpen();
    },
    [navigate],
  );

  const handleBookmarkClick = useCallback(
    (bookmark: Bookmark) => {
      navigate(routes.blog(slugify(bookmark.title)));
      playWindowOpen();
    },
    [navigate],
  );

  const hasBookmarks = bookmarks.length > 0;

  return (
    <Modal
      variant="takeover"
      open={laptopFocused}
      onOpenChange={onOpenChange}
      ariaLabel="CatOS — the laptop blog"
    >
      <div style={{ position: "absolute", inset: 0, userSelect: "none" }}>
        {/* Wallpaper — soft green → ivory */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, var(--brand-bg), var(--brand-surface))",
          }}
        />

        <MenuBar
          left={
            <>
              <span style={{ display: "flex", gap: 6 }}>
                <span>🐱</span>
                <span style={{ fontWeight: 700 }}>CatOS</span>
              </span>
              <span style={{ opacity: 0.7 }}>Finder</span>
            </>
          }
          right={<span style={{ opacity: 0.7 }}>{clock}</span>}
        />

        {/* Desktop — scrollable sections */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 0,
            right: 0,
            bottom: 72,
            overflowY: "auto",
            padding: "24px 32px",
          }}
        >
          <SectionHeader label="My Projects" />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 24,
              marginBottom: hasBookmarks ? 32 : 0,
            }}
          >
            {projects.map((p) => (
              <DesktopIcon
                key={p.title}
                label={p.title}
                icon={asset(p.icon)}
                color={p.color}
                isNew={isNewSince(p.addedAt, p.updatedAt, lastVisitedAt)}
                onClick={() => handleProjectClick(p)}
              />
            ))}
          </div>

          {hasBookmarks && (
            <>
              <SectionHeader label="Bookmarks" />
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
                {bookmarks.map((b) => (
                  <DesktopIcon
                    key={b.title}
                    label={b.title}
                    icon={asset(b.icon)}
                    color={b.color}
                    isNew={isNewSince(b.addedAt, undefined, lastVisitedAt)}
                    onClick={() => handleBookmarkClick(b)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <Dock>
          <DockItem label="Finder">📁</DockItem>
          <DockItem label="Terminal">🖥️</DockItem>
          <DockItem label="Notes">📝</DockItem>
          <DockDivider />
          <DockItem label="Trash">🗑️</DockItem>
        </Dock>

        {openItem?.kind === "project" && (
          <ProjectWindow project={openItem.data} onClose={closeWindow} />
        )}
        {openItem?.kind === "bookmark" && (
          <BookmarkWindow bookmark={openItem.data} onClose={closeWindow} />
        )}

        {!openItem && (
          <div style={{ position: "absolute", bottom: 84, right: 20, zIndex: 5 }}>
            <Button variant="ghost" size="sm" onClick={() => navigate(routes.tent)}>
              Back to tent
              <span style={{ opacity: 0.5, marginLeft: 6 }}>Esc</span>
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

/** Returns true if an item was added or updated after the visitor's last session. */
function isNewSince(
  addedAt: string | undefined,
  updatedAt: string | undefined,
  lastVisitedAt: string | null,
): boolean {
  // First-time visitors: nothing highlighted (everything is new)
  if (!lastVisitedAt) return false;
  const last = new Date(lastVisitedAt).getTime();
  if (addedAt && new Date(addedAt).getTime() > last) return true;
  if (updatedAt && new Date(updatedAt).getTime() > last) return true;
  return false;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Text variant="label" tone="muted" align="center">
        {label}
      </Text>
    </div>
  );
}

/* ─── Windows ─────────────────────────────────────────────────── */

function ProjectWindow({ project, onClose }: { project: Project; onClose: () => void }) {
  // PhotoBroom has a full landing page (folded in from its old subdomain).
  if (slugify(project.title) === "photobroom") {
    return (
      <Window size="page" title="PhotoBroom" onClose={onClose}>
        <PhotoBroomPage />
      </Window>
    );
  }

  const body =
    typeof project.description === "string"
      ? project.description.split("\n\n").map((para, i) => <p key={i}>{para}</p>)
      : project.description;

  return (
    <Window title={project.title} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <Text variant="title-2">{project.title}</Text>
        <Text variant="body-sm" tone="muted">
          {project.year}
        </Text>
        {project.tags && project.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {project.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        )}
      </div>

      <div style={{ lineHeight: 1.7 }}>{body}</div>

      <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
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
    </Window>
  );
}

function BookmarkWindow({ bookmark, onClose }: { bookmark: Bookmark; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Window title={bookmark.title} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        {!imgError && (
          <img
            src={asset(bookmark.icon)}
            alt=""
            width={64}
            height={64}
            style={{ borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
            onError={() => setImgError(true)}
          />
        )}
        <Text variant="title-3">{bookmark.title}</Text>
      </div>

      <Text variant="body-sm" tone="muted">
        {bookmark.blurb}
      </Text>

      <div style={{ marginTop: 24 }}>
        <Link href={bookmark.url} target="_blank" rel="noopener noreferrer">
          Check it out →
        </Link>
      </div>
    </Window>
  );
}
