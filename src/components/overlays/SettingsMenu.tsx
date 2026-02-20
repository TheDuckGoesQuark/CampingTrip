import { useState, useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '../../store/sessionStore';

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const soundEnabled = useSessionStore((s) => s.soundEnabled);
  const effectsEnabled = useSessionStore((s) => s.effectsEnabled);
  const setSoundEnabled = useSessionStore((s) => s.setSoundEnabled);
  const setEffectsEnabled = useSessionStore((s) => s.setEffectsEnabled);
  const resetWelcome = useSessionStore((s) => s.resetWelcome);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Delay to avoid the opening click from immediately closing
    const timeout = setTimeout(() => {
      window.addEventListener('mousedown', handler);
    }, 10);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousedown', handler);
    };
  }, [open]);

  const handleReset = useCallback(() => {
    setOpen(false);
    resetWelcome();
  }, [resetWelcome]);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 50,
      }}
    >
      {/* Gear button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Settings"
        aria-expanded={open}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid rgba(255,200,100,0.2)',
          background: open ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
          color: '#f0e0c0',
          fontSize: 18,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          transition: 'background 0.2s ease',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Settings panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 44,
            right: 0,
            minWidth: 180,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,200,100,0.2)',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 13,
            color: '#f0e0c0',
            letterSpacing: '0.03em',
          }}
        >
          {/* Sound toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <span>{soundEnabled ? '🔊' : '🔇'} Sound</span>
            <ToggleSwitch
              checked={soundEnabled}
              onChange={(v) => setSoundEnabled(v)}
            />
          </label>

          {/* Effects toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <span>🌧 Effects</span>
            <ToggleSwitch
              checked={effectsEnabled}
              onChange={(v) => setEffectsEnabled(v)}
            />
          </label>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,200,100,0.12)' }} />

          {/* Reset button */}
          <button
            onClick={handleReset}
            style={{
              background: 'rgba(255,200,100,0.1)',
              border: '1px solid rgba(255,200,100,0.15)',
              borderRadius: 6,
              padding: '6px 0',
              color: '#f0e0c0',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.03em',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = 'rgba(255,200,100,0.2)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = 'rgba(255,200,100,0.1)';
            }}
          >
            Reset preferences
          </button>
        </div>
      )}
    </div>
  );
}

/** Tiny toggle switch component */
function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      style={{
        width: 34,
        height: 18,
        borderRadius: 9,
        background: checked ? 'rgba(255,200,100,0.4)' : 'rgba(255,255,255,0.15)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: checked ? '#f0e0c0' : 'rgba(255,255,255,0.5)',
          position: 'absolute',
          top: 2,
          left: checked ? 18 : 2,
          transition: 'left 0.2s ease, background 0.2s ease',
        }}
      />
    </div>
  );
}
