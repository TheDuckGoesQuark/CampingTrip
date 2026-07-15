import {
  Anchor,
  Badge,
  Box,
  Button,
  DesktopIcon,
  Dock,
  DockDivider,
  DockItem,
  Group,
  MenuBar,
  Stack,
  Text,
  Title,
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
 * CatOS — the laptop's operating system overlay. Composes the DS faux-desktop
 * chrome (MenuBar, DesktopIcon, Dock, Window) with the campsite's own content.
 * Items added since the visitor's last session get a "New" badge.
 * Press Escape to close window → desktop → tent.
 */
export default function LaptopScreenOverlay() {
  const navigate = useNavigate();
  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const activePostSlug = useSceneStore((s) => s.activePostSlug);
  const lastVisitedAt = useSessionStore((s) => s.lastVisitedAt);
  const [mounted, setMounted] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [clock, setClock] = useState("");
  const prevFocused = useRef(false);

  // The open window is URL-backed, so closing/opening a post is a navigation:
  // BlogRoute maps /blog/:slug back onto activePostSlug.
  const openItem = useMemo(() => resolveOpenItem(activePostSlug), [activePostSlug]);
  const closeWindow = useCallback(() => navigate(routes.blog()), [navigate]);

  // Mount/unmount with fade
  useEffect(() => {
    if (laptopFocused) {
      setMounted(true);
      const timer = setTimeout(() => setOpacity(1), 650);
      return () => clearTimeout(timer);
    } else {
      setOpacity(0);
      const timer = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(timer);
    }
  }, [laptopFocused]);

  // Update lastVisitedAt when leaving CatOS
  useEffect(() => {
    if (prevFocused.current && !laptopFocused) {
      useSessionStore.getState().updateLastVisited();
    }
    prevFocused.current = laptopFocused;
  }, [laptopFocused]);

  // Live clock
  useEffect(() => {
    if (!mounted) return;
    const update = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [mounted]);

  // Escape handling: close window first, then exit CatOS
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        playSoftClick();
        // Close the open post first, then leave CatOS entirely.
        navigate(openItem ? routes.blog() : routes.tent);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [mounted, openItem, navigate]);

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

  if (!mounted) return null;

  const hasBookmarks = bookmarks.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="CatOS — the laptop blog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        opacity,
        transition: "opacity 0.4s ease",
        color: "var(--brand-text)",
        userSelect: "none",
      }}
    >
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
            <Group gap={6}>
              <Text span>🐱</Text>
              <Text span fw={700} size="sm">
                CatOS
              </Text>
            </Group>
            <Text size="sm" c="dimmed">
              Finder
            </Text>
          </>
        }
        right={
          <Text size="sm" c="dimmed">
            {clock}
          </Text>
        }
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
        <Group justify="center" gap={24} mb={hasBookmarks ? 32 : 0}>
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
        </Group>

        {hasBookmarks && (
          <>
            <SectionHeader label="Bookmarks" />
            <Group justify="center" gap={24}>
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
            </Group>
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
        <Button
          variant="subtle"
          color="gray"
          size="xs"
          onClick={() => navigate(routes.tent)}
          style={{ position: "absolute", bottom: 84, right: 20, zIndex: 5 }}
        >
          Back to tent
          <Text span opacity={0.5} ml={6}>
            Esc
          </Text>
        </Button>
      )}
    </div>
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
    <Text
      ta="center"
      tt="uppercase"
      fw={600}
      size="sm"
      c="dimmed"
      mb="md"
      style={{ letterSpacing: 1.2 }}
    >
      {label}
    </Text>
  );
}

/* ─── Windows ─────────────────────────────────────────────────── */

function ProjectWindow({ project, onClose }: { project: Project; onClose: () => void }) {
  const body =
    typeof project.description === "string"
      ? project.description.split("\n\n").map((para, i) => <p key={i}>{para}</p>)
      : project.description;

  return (
    <Window title={project.title} onClose={onClose}>
      <Stack gap="xs" mb="md">
        <Title order={2}>{project.title}</Title>
        <Text size="sm" c="dimmed">
          {project.year}
        </Text>
        {project.tags && project.tags.length > 0 && (
          <Group gap="xs">
            {project.tags.map((t) => (
              <Badge key={t} variant="light">
                {t}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>

      <Box style={{ lineHeight: 1.7 }}>{body}</Box>

      <Group mt="lg" gap="sm">
        <Button
          component="a"
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          variant="light"
        >
          Visit Project →
        </Button>
        {project.github && (
          <Button
            component="a"
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            variant="default"
          >
            Source
          </Button>
        )}
      </Group>
    </Window>
  );
}

function BookmarkWindow({ bookmark, onClose }: { bookmark: Bookmark; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Window title={bookmark.title} onClose={onClose}>
      <Group align="flex-start" gap="md" mb="md">
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
        <Title order={3}>{bookmark.title}</Title>
      </Group>

      <Text size="sm" c="dimmed" mb="lg">
        {bookmark.blurb}
      </Text>

      <Anchor href={bookmark.url} target="_blank" rel="noopener noreferrer">
        Check it out →
      </Anchor>
    </Window>
  );
}
