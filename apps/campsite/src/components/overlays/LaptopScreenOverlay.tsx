import { useEffect, useState, useCallback, useRef } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { useSessionStore } from '../../store/sessionStore';
import { projects } from '../../data/projects';
import { bookmarks } from '../../data/bookmarks';
import { asset } from '../../utils/assetPath';
import { playWindowOpen, playSoftClick } from '../../audio/soundEffects';
import type { Project, Bookmark } from '../../types/project';

type OpenItem =
  | { kind: 'project'; data: Project }
  | { kind: 'bookmark'; data: Bookmark };

/**
 * CatOS — the laptop's operating system overlay.
 * Shows a desktop with "My Projects" and "Bookmarks" sections.
 * Items added since the visitor's last session get a "New" badge.
 * Press Escape to close window → desktop → tent.
 */
export default function LaptopScreenOverlay() {
  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const lastVisitedAt = useSessionStore((s) => s.lastVisitedAt);
  const [mounted, setMounted] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [openItem, setOpenItem] = useState<OpenItem | null>(null);
  const [clock, setClock] = useState('');
  const prevFocused = useRef(false);

  // Mount/unmount with fade
  useEffect(() => {
    if (laptopFocused) {
      setMounted(true);
      const timer = setTimeout(() => setOpacity(1), 650);
      return () => clearTimeout(timer);
    } else {
      setOpacity(0);
      setOpenItem(null);
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
      setClock(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [mounted]);

  // Escape handling: close window first, then exit CatOS
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openItem) {
          e.stopPropagation();
          setOpenItem(null);
          playSoftClick();
        }
        // If no item open, TentScene's handler will close the laptop
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [mounted, openItem]);

  const handleProjectClick = useCallback((project: Project) => {
    setOpenItem({ kind: 'project', data: project });
    playWindowOpen();
  }, []);

  const handleBookmarkClick = useCallback((bookmark: Bookmark) => {
    setOpenItem({ kind: 'bookmark', data: bookmark });
    playWindowOpen();
  }, []);

  if (!mounted) return null;

  const hasBookmarks = bookmarks.length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      opacity, transition: 'opacity 0.4s ease',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#e0e0e8',
      userSelect: 'none',
    }}>
      {/* Wallpaper */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)',
      }} />

      {/* Subtle starfield dots */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.3 }}>
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 3 === 0 ? 2 : 1,
            height: i % 3 === 0 ? 2 : 1,
            borderRadius: '50%',
            background: '#fff',
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 53 + 7) % 85 + 5}%`,
            opacity: 0.3 + (i % 5) * 0.15,
          }} />
        ))}
      </div>

      {/* Menu bar */}
      <MenuBar clock={clock} />

      {/* Desktop — scrollable sections */}
      <div style={{
        position: 'absolute',
        top: 36, left: 0, right: 0, bottom: 72,
        overflowY: 'auto',
        padding: '24px 32px',
      }}>
        {/* My Projects */}
        <SectionHeader label="My Projects" />
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 24,
          marginBottom: hasBookmarks ? 32 : 0,
        }}>
          {projects.map((p) => (
            <DesktopIcon
              key={p.title}
              title={p.title}
              icon={p.icon}
              color={p.color}
              isNew={isNewSince(p.addedAt, p.updatedAt, lastVisitedAt)}
              onClick={() => handleProjectClick(p)}
            />
          ))}
        </div>

        {/* Bookmarks */}
        {hasBookmarks && (
          <>
            <SectionHeader label="Bookmarks" />
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 24,
            }}>
              {bookmarks.map((b) => (
                <DesktopIcon
                  key={b.title}
                  title={b.title}
                  icon={b.icon}
                  color={b.color}
                  isNew={isNewSince(b.addedAt, undefined, lastVisitedAt)}
                  onClick={() => handleBookmarkClick(b)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dock */}
      <Dock />

      {/* Window (if open) */}
      {openItem?.kind === 'project' && (
        <ProjectWindow
          project={openItem.data}
          onClose={() => { setOpenItem(null); playSoftClick(); }}
        />
      )}
      {openItem?.kind === 'bookmark' && (
        <BookmarkWindow
          bookmark={openItem.data}
          onClose={() => { setOpenItem(null); playSoftClick(); }}
        />
      )}

      {/* Back to tent button */}
      {!openItem && (
        <button
          onClick={() => useSceneStore.getState().setLaptopFocused(false)}
          style={{
            position: 'absolute', bottom: 84, right: 20, zIndex: 5,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.4)',
            padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
            fontSize: 12, transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
          }}
        >
          Back to tent <span style={{ opacity: 0.5, marginLeft: 6 }}>Esc</span>
        </button>
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

/* ─── Section Header ──────────────────────────────────────────── */

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 13,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      color: 'rgba(255,255,255,0.35)',
      marginBottom: 16,
      textAlign: 'center',
    }}>
      {label}
    </div>
  );
}

/* ─── Menu Bar ────────────────────────────────────────────────── */
function MenuBar({ clock }: { clock: string }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 28,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center',
      padding: '0 12px',
      fontSize: 13, fontWeight: 500, zIndex: 10,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>🐱</span>
        <span style={{ fontWeight: 700 }}>CatOS</span>
      </span>
      <span style={{ marginLeft: 20, opacity: 0.6 }}>Finder</span>
      <span style={{ marginLeft: 'auto', opacity: 0.7 }}>{clock}</span>
    </div>
  );
}

/* ─── Desktop Icon ────────────────────────────────────────────── */
function DesktopIcon({
  title, icon, color, isNew, onClick,
}: {
  title: string;
  icon: string;
  color?: string;
  isNew: boolean;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => { playSoftClick(); onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: 120, padding: '12px 8px', gap: 8,
        background: hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: 'none', borderRadius: 12, cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {imgError ? (
        <FallbackIcon title={title} color={color} />
      ) : (
        <img
          src={asset(icon)}
          alt={title}
          width={72} height={72}
          style={{ borderRadius: 14, objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      )}

      {/* "New" badge */}
      {isNew && <NewBadge />}

      <span style={{
        fontSize: 13, color: '#fff', textAlign: 'center',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        lineHeight: 1.3, maxWidth: 110,
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      } as React.CSSProperties}>
        {title}
      </span>
    </button>
  );
}

/* ─── New Badge ───────────────────────────────────────────────── */
function NewBadge() {
  return (
    <span style={{
      position: 'absolute', top: 6, right: 14,
      background: '#ff6b6b',
      color: '#fff',
      fontSize: 9,
      fontWeight: 700,
      padding: '2px 5px',
      borderRadius: 6,
      lineHeight: 1,
      letterSpacing: 0.5,
      boxShadow: '0 0 8px rgba(255,107,107,0.6)',
      animation: 'catosNewPulse 2s ease-in-out infinite',
    }}>
      NEW
      <style>{`
        @keyframes catosNewPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(255,107,107,0.6); }
          50% { box-shadow: 0 0 14px rgba(255,107,107,0.9); }
        }
      `}</style>
    </span>
  );
}

/* ─── Fallback Icon (generated from title) ────────────────────── */
function FallbackIcon({ title, color }: { title: string; color?: string }) {
  const bg = color || '#4a9eff';
  const letter = title.charAt(0).toUpperCase();
  return (
    <div style={{
      width: 72, height: 72, borderRadius: 14,
      background: `linear-gradient(135deg, ${bg}, ${bg}88)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 28, fontWeight: 700, color: '#fff',
      boxShadow: `0 2px 8px ${bg}44`,
    }}>
      {letter}
    </div>
  );
}

/* ─── Dock ────────────────────────────────────────────────────── */
function Dock() {
  return (
    <div style={{
      position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '6px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      zIndex: 10,
    }}>
      <DockIcon label="Finder" emoji="📁" />
      <DockIcon label="Terminal" emoji="🖥️" />
      <DockIcon label="Notes" emoji="📝" />
      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }} />
      <DockIcon label="Trash" emoji="🗑️" />
    </div>
  );
}

function DockIcon({ label, emoji }: { label: string; emoji: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        fontSize: 28, cursor: 'default',
        transform: hovered ? 'scale(1.25) translateY(-4px)' : 'scale(1)',
        transition: 'transform 0.15s ease',
      }}
      title={label}
    >
      {emoji}
      {hovered && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          marginBottom: 6, background: 'rgba(0,0,0,0.75)', color: '#fff',
          fontSize: 11, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap',
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

/* ─── Shared Window Shell ─────────────────────────────────────── */
function WindowShell({
  title, onClose, children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.3)',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%', maxWidth: 520, minHeight: 300,
          background: 'rgba(30,30,45,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          animation: 'catosWindowIn 0.25s ease-out',
        }}
      >
        {/* Title bar */}
        <div style={{
          height: 38, background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', padding: '0 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onClose}
              style={{
                width: 12, height: 12, borderRadius: '50%',
                background: '#ff5f57', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, color: 'transparent', transition: 'color 0.15s',
                padding: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(0,0,0,0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'transparent'; }}
            >
              ✕
            </button>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 13, opacity: 0.7 }}>
            {title}
          </span>
          <div style={{ width: 52 }} />
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', maxHeight: 'calc(80vh - 38px)', overflowY: 'auto' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes catosWindowIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Project Window ──────────────────────────────────────────── */
function ProjectWindow({ project, onClose }: { project: Project; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <WindowShell title={project.title} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        {imgError ? (
          <FallbackIcon title={project.title} color={project.color} />
        ) : (
          <img
            src={asset(project.icon)}
            alt=""
            width={64} height={64}
            style={{ borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
            onError={() => setImgError(true)}
          />
        )}
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{project.title}</h2>
          <span style={{ fontSize: 13, opacity: 0.4 }}>{project.year}</span>
        </div>
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.7, marginBottom: 24 }}>
        {typeof project.description === 'string'
          ? project.description.split('\n\n').map((para, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : '12px 0 0' }}>{para}</p>
            ))
          : project.description}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(74,158,255,0.15)',
            border: '1px solid rgba(74,158,255,0.3)',
            color: '#4a9eff', padding: '8px 16px', borderRadius: 8,
            textDecoration: 'none', fontSize: 13, fontWeight: 500,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,158,255,0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(74,158,255,0.15)'; }}
        >
          Visit Project →
        </a>
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e0e0e8', padding: '8px 16px', borderRadius: 8,
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Source
          </a>
        )}
      </div>
    </WindowShell>
  );
}

/* ─── Bookmark Window ─────────────────────────────────────────── */
function BookmarkWindow({ bookmark, onClose }: { bookmark: Bookmark; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <WindowShell title={bookmark.title} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        {imgError ? (
          <FallbackIcon title={bookmark.title} color={bookmark.color} />
        ) : (
          <img
            src={asset(bookmark.icon)}
            alt=""
            width={64} height={64}
            style={{ borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
            onError={() => setImgError(true)}
          />
        )}
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{bookmark.title}</h2>
        </div>
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.7, marginBottom: 24 }}>
        {bookmark.blurb}
      </div>

      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(74,158,255,0.15)',
          border: '1px solid rgba(74,158,255,0.3)',
          color: '#4a9eff', padding: '8px 16px', borderRadius: 8,
          textDecoration: 'none', fontSize: 13, fontWeight: 500,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,158,255,0.25)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(74,158,255,0.15)'; }}
      >
        Check it out →
      </a>
    </WindowShell>
  );
}
