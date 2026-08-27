import { Badge, Button, DesktopIcon, Link, MenuBar, Modal, Text, Window } from "@jordanscamp/ds";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

/** Not `location.origin`: a `localhost:5173` address would break the illusion. */
const SITE_ORIGIN = "https://jordanscamp.site";

type OpenItem = { kind: "project"; data: Project } | { kind: "bookmark"; data: Bookmark };

function resolveOpenItem(slug: string | null): OpenItem | null {
  if (!slug) return null;
  const project = projects.find((p) => slugify(p.title) === slug);
  if (project) return { kind: "project", data: project };
  const bookmark = bookmarks.find((b) => slugify(b.title) === slug);
  if (bookmark) return { kind: "bookmark", data: bookmark };
  return null;
}

function titleOf(item: OpenItem): string {
  return item.data.title;
}

/**
 * CatOS — the laptop's blog, a full-screen Base UI takeover (so it traps focus,
 * returns focus on close, and handles Escape). Composes the DS faux-desktop
 * chrome (MenuBar, DesktopIcon, Window) with the campsite's own content.
 *
 * The open post is URL-driven (`/blog/:slug` → `activePostSlug`); the *set* of
 * open tabs is session state in the scene store.
 */
export default function LaptopScreenOverlay() {
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();
  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const activePostSlug = useSceneStore((s) => s.activePostSlug);
  const openPostSlugs = useSceneStore((s) => s.openPostSlugs);
  const lastVisitedAt = useSessionStore((s) => s.lastVisitedAt);
  const [clock, setClock] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const prevFocused = useRef(false);

  const openTabs = useMemo(
    () =>
      openPostSlugs
        .map((slug) => ({ slug, item: resolveOpenItem(slug) }))
        .filter((t): t is { slug: string; item: OpenItem } => t.item !== null),
    [openPostSlugs],
  );
  const activeItem = useMemo(() => resolveOpenItem(activePostSlug), [activePostSlug]);

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

  const closeWindow = useCallback(() => {
    useSceneStore.getState().closeAllPosts();
    navigate(routes.blog());
  }, [navigate]);

  /** CatOS has no new-tab page of its own — the desktop is the one you pick from. */
  const showDesktop = useCallback(() => {
    playSoftClick();
    navigate(routes.blog());
  }, [navigate]);

  // Base UI reports close intent (Escape). Close the open window first, else the
  // whole takeover — mirrors the layered Escape behaviour, no manual keydown.
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      playSoftClick();
      navigate(activeItem ? routes.blog() : routes.tent);
    },
    [activeItem, navigate],
  );

  const openSlug = useCallback(
    (slug: string) => {
      navigate(routes.blog(slug));
      playWindowOpen();
    },
    [navigate],
  );

  /** Only navigates if the closed tab was on screen; focus falls right, else left. */
  const closeTab = useCallback(
    (slug: string) => {
      const scene = useSceneStore.getState();
      const index = scene.openPostSlugs.indexOf(slug);
      const remaining = scene.openPostSlugs.filter((s) => s !== slug);
      playSoftClick();
      scene.closePost(slug);
      if (slug !== scene.activePostSlug) return;
      const next = remaining[index] ?? remaining[index - 1];
      navigate(next ? routes.blog(next) : routes.blog());
    },
    [navigate],
  );

  /**
   * A visitor who deep-linked straight to a post has nothing behind them, and a
   * Back that left the site would break the illusion worse than a greyed-out one.
   * Read from the history entry, so it needs re-reading per navigation.
   */
  const [canGoBack, setCanGoBack] = useState(false);
  useEffect(() => {
    setCanGoBack(((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0);
  }, [locationKey]);

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
            width: 148,
            bottom: 0,
            overflowY: "auto",
            padding: "8px 12px",
          }}
        >
          <SectionHeader label="My Projects" />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginBottom: hasBookmarks ? 24 : 0,
            }}
          >
            {projects.map((p) => (
              <DesktopIcon
                key={p.title}
                label={p.title}
                icon={asset(p.icon)}
                color={p.color}
                isNew={isNewSince(p.addedAt, p.updatedAt, lastVisitedAt)}
                onClick={() => openSlug(slugify(p.title))}
              />
            ))}
          </div>

          {hasBookmarks && (
            <>
              <SectionHeader label="Bookmarks" />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {bookmarks.map((b) => (
                  <DesktopIcon
                    key={b.title}
                    label={b.title}
                    icon={asset(b.icon)}
                    color={b.color}
                    isNew={isNewSince(b.addedAt, undefined, lastVisitedAt)}
                    onClick={() => openSlug(slugify(b.title))}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {activeItem && activePostSlug && (
          <Window>
            <Window.TitleBar title={`${titleOf(activeItem)} — CatNav`} onClose={closeWindow} />
            <Window.Tabs>
              {openTabs.map(({ slug, item }) => (
                <Window.Tab
                  key={slug}
                  label={titleOf(item)}
                  icon={<img src={asset(item.data.icon)} alt="" width={14} height={14} />}
                  active={slug === activePostSlug}
                  onSelect={() => navigate(routes.blog(slug))}
                  onClose={() => closeTab(slug)}
                />
              ))}
              <Window.NewTab onClick={showDesktop} />
            </Window.Tabs>
            <Window.AddressBar
              url={`${SITE_ORIGIN}${routes.blog(activePostSlug)}`}
              onBack={canGoBack ? () => navigate(-1) : undefined}
              onReload={() => setReloadCount((n) => n + 1)}
            />
            <Window.Body>
              {/* Re-keyed so the reload control actually remounts the page. */}
              <div key={`${activePostSlug}:${reloadCount}`} style={{ userSelect: "text" }}>
                {activeItem.kind === "project" ? (
                  <ProjectPage project={activeItem.data} />
                ) : (
                  <BookmarkPage bookmark={activeItem.data} />
                )}
              </div>
            </Window.Body>
          </Window>
        )}

        {!activeItem && (
          <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 5 }}>
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
    <div style={{ marginBottom: 12 }}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
    </div>
  );
}

/* ─── Pages ───────────────────────────────────────────────────── */

function ProjectPage({ project }: { project: Project }) {
  // PhotoBroom has a full landing page (folded in from its old subdomain).
  if (slugify(project.title) === "photobroom") return <PhotoBroomPage />;

  const body =
    typeof project.description === "string"
      ? project.description.split("\n\n").map((para, i) => <p key={i}>{para}</p>)
      : project.description;

  return (
    <>
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
    </>
  );
}

function BookmarkPage({ bookmark }: { bookmark: Bookmark }) {
  const [imgError, setImgError] = useState(false);

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        {!imgError && (
          <img
            src={asset(bookmark.icon)}
            alt=""
            width={64}
            height={64}
            style={{ objectFit: "cover", flexShrink: 0 }}
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
    </>
  );
}
