import { useEffect, useState, useRef } from 'react';
import { useMusicStore } from '../../store/musicStore';
import { musicPlayer } from '../../audio/musicPlayer';
import { songs } from '../../data/songs';
import { playSoftClick } from '../../audio/soundEffects';

/**
 * iPod Nano-style floating music player.
 * Opens when clicking the microphone in the tent scene.
 */
export default function MusicPlayerOverlay() {
  const isOpen = useMusicStore((s) => s.isOpen);
  const close = useMusicStore((s) => s.close);
  const [mounted, setMounted] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [view, setView] = useState<'list' | 'playing'>('list');

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => setOpacity(1));
    } else {
      setOpacity(0);
      const timer = setTimeout(() => { setMounted(false); setView('list'); }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'playing') {
          setView('list');
          playSoftClick();
          e.stopPropagation();
        } else {
          close();
          musicPlayer.stop();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [mounted, view, close]);

  if (!mounted) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 95,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)',
      opacity, transition: 'opacity 0.3s ease',
      pointerEvents: opacity > 0 ? 'auto' : 'none',
    }} onClick={(e) => { if (e.target === e.currentTarget) { close(); musicPlayer.stop(); } }}>
      {/* iPod body */}
      <div style={{
        width: 260, height: 440,
        background: 'linear-gradient(180deg, #e8e8e8 0%, #c8c8c8 100%)',
        borderRadius: 24,
        padding: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.5)',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        animation: 'ipodIn 0.3s ease-out',
      }}>
        {/* Screen */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: 12,
          flex: '0 0 200px',
          overflow: 'hidden',
          border: '2px solid #333',
        }}>
          {view === 'list' ? (
            <SongList onSelect={(i) => { setView('playing'); musicPlayer.playTrack(i); useMusicStore.getState().setTrack(i); }} />
          ) : (
            <NowPlaying />
          )}
        </div>

        {/* Click Wheel */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ClickWheel
            onMenu={() => { playSoftClick(); if (view === 'playing') setView('list'); else { close(); musicPlayer.stop(); } }}
            onPlay={() => { playSoftClick(); musicPlayer.togglePlay(); if (view === 'list') setView('playing'); }}
            onNext={() => { playSoftClick(); musicPlayer.next(); setView('playing'); }}
            onPrev={() => { playSoftClick(); musicPlayer.prev(); setView('playing'); }}
          />
        </div>

        {/* Close X */}
        <button
          onClick={() => { close(); musicPlayer.stop(); }}
          style={{
            position: 'absolute', top: -8, right: -8,
            width: 24, height: 24, borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>

      <style>{`
        @keyframes ipodIn {
          from { transform: scale(0.85) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Song List View ──────────────────────────────────────────── */
function SongList({ onSelect }: { onSelect: (index: number) => void }) {
  const currentTrackIndex = useMusicStore((s) => s.currentTrackIndex);
  const isPlaying = useMusicStore((s) => s.isPlaying);

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        background: 'linear-gradient(180deg, #4a6fa5, #2d4a7a)',
        color: '#fff', fontSize: 12, fontWeight: 600,
        textAlign: 'center',
      }}>
        Songs
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {songs.length === 0 ? (
          <div style={{
            padding: 16, textAlign: 'center', color: '#666', fontSize: 12,
          }}>
            No songs yet
          </div>
        ) : (
          songs.map((song, i) => (
            <SongRow
              key={i}
              song={song}
              index={i}
              active={i === currentTrackIndex && isPlaying}
              onClick={() => onSelect(i)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SongRow({ song, index, active, onClick }: {
  song: typeof songs[number]; index: number; active: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '6px 12px',
        background: hovered ? 'rgba(74,111,165,0.3)' : (index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'),
        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      {/* Now-playing indicator */}
      <span style={{
        width: 14, fontSize: 10, color: '#4a9eff',
        flexShrink: 0,
      }}>
        {active ? '▶' : ''}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, color: active ? '#4a9eff' : '#ddd',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontWeight: active ? 600 : 400,
        }}>
          {song.title}
        </div>
        <div style={{
          fontSize: 10, color: '#777', marginTop: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {song.artist}
        </div>
      </div>
    </button>
  );
}

/* ─── Now Playing View ────────────────────────────────────────── */
function NowPlaying() {
  const currentTrackIndex = useMusicStore((s) => s.currentTrackIndex);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const progress = useMusicStore((s) => s.progress);
  const duration = useMusicStore((s) => s.duration);

  const wrappedIndex = songs.length > 0
    ? ((currentTrackIndex % songs.length) + songs.length) % songs.length
    : 0;
  const song = songs[wrappedIndex];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!song) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#666', fontSize: 12, fontFamily: '-apple-system, sans-serif',
      }}>
        No track
      </div>
    );
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        background: 'linear-gradient(180deg, #4a6fa5, #2d4a7a)',
        color: '#fff', fontSize: 12, fontWeight: 600,
        textAlign: 'center',
      }}>
        Now Playing
      </div>

      {/* Album art placeholder */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '12px 16px',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 8,
          background: 'linear-gradient(135deg, #2a3a5c, #1a2a4c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <span style={{ fontSize: 32, opacity: 0.5 }}>
            {isPlaying ? '♪' : '♫'}
          </span>
        </div>

        <div style={{
          fontSize: 13, color: '#eee', fontWeight: 600, textAlign: 'center',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}>
          {song.title}
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
          {song.artist}
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', marginTop: 12 }}>
          <ProgressBar progress={progress} onSeek={(p) => musicPlayer.seek(p)} />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 9, color: '#666', marginTop: 3,
          }}>
            <span>{formatTime(progress * duration)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Progress Bar ────────────────────────────────────────────── */
function ProgressBar({ progress, onSeek }: { progress: number; onSeek: (p: number) => void }) {
  const barRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(fraction);
  };

  return (
    <div
      ref={barRef}
      onClick={handleClick}
      style={{
        height: 4, background: 'rgba(255,255,255,0.1)',
        borderRadius: 2, cursor: 'pointer', position: 'relative',
      }}
    >
      <div style={{
        height: '100%', width: `${progress * 100}%`,
        background: '#4a9eff', borderRadius: 2,
        transition: 'width 0.25s linear',
      }} />
    </div>
  );
}

/* ─── Click Wheel ─────────────────────────────────────────────── */
function ClickWheel({ onMenu, onPlay, onNext, onPrev }: {
  onMenu: () => void;
  onPlay: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const isPlaying = useMusicStore((s) => s.isPlaying);

  const wheelSize = 160;
  const centerSize = 56;

  return (
    <div style={{
      position: 'relative',
      width: wheelSize, height: wheelSize,
      borderRadius: '50%',
      background: 'linear-gradient(180deg, #d0d0d0, #a0a0a0)',
      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.15)',
    }}>
      {/* Quadrant buttons */}
      <WheelButton position="top" onClick={onMenu} label="MENU" />
      <WheelButton position="right" onClick={onNext} label="▶▶" />
      <WheelButton position="bottom" onClick={onPlay} label={isPlaying ? '❚❚' : '▶'} />
      <WheelButton position="left" onClick={onPrev} label="◀◀" />

      {/* Center button */}
      <button
        onClick={onPlay}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: centerSize, height: centerSize,
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #f0f0f0, #d8d8d8)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
          transition: 'transform 0.1s',
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(0.95)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'; }}
      />
    </div>
  );
}

function WheelButton({ position, onClick, label }: {
  position: 'top' | 'right' | 'bottom' | 'left';
  onClick: () => void;
  label: string;
}) {
  const [hovered, setHovered] = useState(false);

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    background: hovered ? 'rgba(0,0,0,0.06)' : 'transparent',
    border: 'none',
    borderRadius: '50%',
    transition: 'background 0.15s',
    fontSize: position === 'top' ? 9 : 11,
    fontWeight: position === 'top' ? 700 : 400,
    color: '#444',
    letterSpacing: position === 'top' ? '0.08em' : 0,
  };

  switch (position) {
    case 'top':
      Object.assign(posStyle, { top: 6, left: '50%', transform: 'translateX(-50%)', width: 50, height: 28 });
      break;
    case 'bottom':
      Object.assign(posStyle, { bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 50, height: 28 });
      break;
    case 'left':
      Object.assign(posStyle, { left: 6, top: '50%', transform: 'translateY(-50%)', width: 28, height: 50 });
      break;
    case 'right':
      Object.assign(posStyle, { right: 6, top: '50%', transform: 'translateY(-50%)', width: 28, height: 50 });
      break;
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={posStyle}
    >
      {label}
    </button>
  );
}
