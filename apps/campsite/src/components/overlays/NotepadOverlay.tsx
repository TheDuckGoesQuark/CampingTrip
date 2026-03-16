import { useEffect, useState, useCallback } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { notebookEntries } from '../../data/notebook';
import { playPageFlip } from '../../audio/soundEffects';

/**
 * Full-screen overlay that appears when the notepad is "focused".
 * Styled like an open journal/notebook with page-flip navigation.
 */
export default function NotepadOverlay() {
  const notepadFocused = useSceneStore((s) => s.notepadFocused);
  const [mounted, setMounted] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [page, setPage] = useState(0);
  const [flipDir, setFlipDir] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    if (notepadFocused) {
      setMounted(true);
      setPage(0);
      const timer = setTimeout(() => setOpacity(1), 600);
      return () => clearTimeout(timer);
    } else {
      setOpacity(0);
      const timer = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(timer);
    }
  }, [notepadFocused]);

  const goNext = useCallback(() => {
    if (page < notebookEntries.length - 1) {
      setFlipDir('right');
      setPage((p) => p + 1);
      playPageFlip();
      setTimeout(() => setFlipDir(null), 300);
    }
  }, [page]);

  const goPrev = useCallback(() => {
    if (page > 0) {
      setFlipDir('left');
      setPage((p) => p - 1);
      playPageFlip();
      setTimeout(() => setFlipDir(null), 300);
    }
  }, [page]);

  // Arrow keys for page navigation
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mounted, goNext, goPrev]);

  if (!mounted) return null;

  const entry = notebookEntries[page];
  if (!entry) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      opacity, transition: 'opacity 0.4s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15,10,5,0.92)',
      userSelect: 'none',
    }}>
      {/* Notebook */}
      <div style={{
        position: 'relative',
        width: '90%', maxWidth: 640, minHeight: 420,
        background: '#f5f0e6',
        borderRadius: '4px 12px 12px 4px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset -2px 0 8px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        animation: flipDir
          ? `notepadFlip${flipDir === 'right' ? 'Right' : 'Left'} 0.3s ease`
          : undefined,
      }}>
        {/* Spine */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 32,
          background: 'linear-gradient(90deg, #c4a882, #d4be9e 60%, #f5f0e6)',
          borderRight: '1px solid rgba(0,0,0,0.08)',
        }} />

        {/* Red margin line */}
        <div style={{
          position: 'absolute', left: 72, top: 0, bottom: 0, width: 1,
          background: 'rgba(200,60,60,0.2)',
        }} />

        {/* Horizontal ruled lines */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute', left: 32, right: 0,
              top: 80 + i * 28, height: 1,
              background: 'rgba(100,140,180,0.12)',
            }} />
          ))}
        </div>

        {/* Content area */}
        <div style={{
          position: 'relative',
          padding: '32px 32px 32px 84px',
          minHeight: 420,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Entry type badge */}
          <span style={{
            display: 'inline-block',
            fontSize: 10, fontFamily: 'monospace',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: entry.type === 'poem' ? '#8b5e3c'
              : entry.type === 'blog' ? '#3c6e8b'
              : '#6b8b3c',
            marginBottom: 4,
          }}>
            {entry.type}
            {entry.date && (
              <span style={{ marginLeft: 12, opacity: 0.6 }}>
                {new Date(entry.date).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </span>
            )}
          </span>

          {/* Title */}
          <h2 style={{
            margin: '0 0 20px', fontSize: 22,
            fontFamily: '"Georgia", "Times New Roman", serif',
            color: '#2a2420', fontWeight: 600,
            lineHeight: 1.3,
          }}>
            {entry.title}
          </h2>

          {/* Body */}
          <div style={{
            flex: 1,
            fontFamily: entry.type === 'poem'
              ? '"Georgia", "Times New Roman", serif'
              : '"Georgia", "Times New Roman", serif',
            fontSize: entry.type === 'poem' ? 15 : 14,
            lineHeight: entry.type === 'poem' ? 1.9 : 1.75,
            color: '#3a3530',
            whiteSpace: 'pre-wrap',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 280px)',
            fontStyle: entry.type === 'poem' ? 'italic' : 'normal',
          }}>
            {entry.content}
          </div>
        </div>

        {/* Page indicator */}
        <div style={{
          position: 'absolute', bottom: 16, right: 24,
          fontSize: 12, fontFamily: 'monospace',
          color: 'rgba(60,50,40,0.35)',
        }}>
          {page + 1} / {notebookEntries.length}
        </div>
      </div>

      {/* Navigation arrows */}
      <NavArrow direction="left" disabled={page === 0} onClick={goPrev} />
      <NavArrow direction="right" disabled={page === notebookEntries.length - 1} onClick={goNext} />

      {/* Close button */}
      <button
        onClick={() => useSceneStore.getState().setNotepadFocused(false)}
        style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.4)',
          padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
          fontSize: 13, transition: 'background 0.2s, color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
        }}
      >
        Close <span style={{ opacity: 0.5, marginLeft: 6 }}>Esc</span>
      </button>

      <style>{`
        @keyframes notepadFlipRight {
          0% { transform: translateX(0); opacity: 1; }
          40% { transform: translateX(-12px); opacity: 0.6; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes notepadFlipLeft {
          0% { transform: translateX(0); opacity: 1; }
          40% { transform: translateX(12px); opacity: 0.6; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function NavArrow({ direction, disabled, onClick }: {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  if (disabled) return null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        top: '50%', transform: 'translateY(-50%)',
        [direction]: 20,
        width: 44, height: 44,
        borderRadius: '50%',
        background: hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: hovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
        fontSize: 20, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s, color 0.2s',
      } as React.CSSProperties}
    >
      {direction === 'left' ? '‹' : '›'}
    </button>
  );
}
