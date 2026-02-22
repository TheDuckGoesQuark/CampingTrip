import { useEffect, useState, useCallback } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { projects } from '../../data/projects';
import { asset } from '../../utils/assetPath';
import { playWindowOpen, playSoftClick } from '../../audio/soundEffects';
import type { Project } from '../../types/project';

/**
 * CatOS — the laptop's operating system overlay.
 * Shows a desktop with project icons. Clicking a project opens a window.
 * Press Escape to close window → desktop → tent.
 */
export default function LaptopScreenOverlay() {
  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const [mounted, setMounted] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [clock, setClock] = useState('');

  // Mount/unmount with fade
  useEffect(() => {
    if (laptopFocused) {
      setMounted(true);
      const timer = setTimeout(() => setOpacity(1), 650);
      return () => clearTimeout(timer);
    } else {
      setOpacity(0);
      setOpenProject(null);
      const timer = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(timer);
    }
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
        if (openProject) {
          e.stopPropagation();
          setOpenProject(null);
          playSoftClick();
        }
        // If no project open, TentScene's handler will close the laptop
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [mounted, openProject]);

  const handleProjectClick = useCallback((project: Project) => {
    setOpenProject(project);
    playWindowOpen();
  }, []);

  if (!mounted) return null;

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

      {/* Desktop icons */}
      <div style={{
        position: 'absolute',
        top: 36, left: 0, right: 0, bottom: 72,
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '24px 32px',
        gap: 8,
      }}>
        {projects.map((p) => (
          <DesktopIcon
            key={p.title}
            project={p}
            onClick={() => handleProjectClick(p)}
          />
        ))}
      </div>

      {/* Dock */}
      <Dock />

      {/* Window (if open) */}
      {openProject && (
        <ProjectWindow
          project={openProject}
          onClose={() => { setOpenProject(null); playSoftClick(); }}
        />
      )}

      {/* Back to tent button */}
      {!openProject && (
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
function DesktopIcon({ project, onClick }: { project: Project; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => { playSoftClick(); onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: 88, padding: '8px 4px', gap: 6,
        background: hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: 'none', borderRadius: 8, cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {imgError ? (
        <FallbackIcon title={project.title} color={project.color} />
      ) : (
        <img
          src={asset(project.icon)}
          alt={project.title}
          width={48} height={48}
          style={{ borderRadius: 10, objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      )}
      <span style={{
        fontSize: 11, color: '#fff', textAlign: 'center',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        lineHeight: 1.2, maxWidth: 80,
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      } as React.CSSProperties}>
        {project.title}
      </span>
    </button>
  );
}

/* ─── Fallback Icon (generated from title) ────────────────────── */
function FallbackIcon({ title, color }: { title: string; color?: string }) {
  const bg = color || '#4a9eff';
  const letter = title.charAt(0).toUpperCase();
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 10,
      background: `linear-gradient(135deg, ${bg}, ${bg}88)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, fontWeight: 700, color: '#fff',
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

/* ─── Project Window ──────────────────────────────────────────── */
function ProjectWindow({ project, onClose }: { project: Project; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);

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
          {/* Traffic lights */}
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
            {project.title}
          </span>
          <div style={{ width: 52 }} />
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px' }}>
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

          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.7, margin: '0 0 24px' }}>
            {project.description}
          </p>

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
