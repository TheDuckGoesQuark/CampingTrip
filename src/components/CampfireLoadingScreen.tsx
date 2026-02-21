import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useSessionStore } from '../store/sessionStore';
import { startCampfire, stopCampfire } from '../audio/campfireSynth';

const FIRE_FRAMES = [
  [
    '             )        (        )',
    '        (         )       )        (',
    '         )  \'  .    \' .    .  \'  (',
    '        (   ,  )    (  . )    , )   )',
    '         ) . (  .  )  (  . )  ( .  (',
    '        (.,___,. \'.,___,.\' .,___,.)',
    '              \\\\  |||  //',
    '               \\\\ ||| //',
    '            ~~~~°~~~~~~~~°~~~~',
  ],
  [
    '              (       )     (    )',
    '         )        (       (        )',
    '          (  \' .     \'.   .  \'   )',
    '         ) ,   )   (  .)   (  ,  (',
    '          (. )  . (  .  ) . ) .  )',
    '        (.,___,. \'.,___,.\' .,___,.)',
    '              \\\\  |||  //',
    '               \\\\ ||| //',
    '            ~~~~°~~~~~~~~°~~~~',
  ],
  [
    '            (     )     (      )',
    '         (      )    )      (    )',
    '          ) .\'   .  \'  . \'  .  (',
    '        (  ,  )   ( .  )  ,  )   )',
    '         ). ( .  )  ( .  ) ( . (  (',
    '        (.,___,. \'.,___,.\' .,___,.)',
    '              \\\\  |||  //',
    '               \\\\ ||| //',
    '            ~~~~°~~~~~~~~°~~~~',
  ],
];

export default function CampfireLoadingScreen() {
  const { active, progress } = useProgress();
  const soundEnabled = useSessionStore((s) => s.soundEnabled);
  const [visible, setVisible] = useState(true);
  const [frame, setFrame] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioStarted = useRef(false);

  // Animate fire frames
  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % FIRE_FRAMES.length);
    }, 350);
    return () => clearInterval(id);
  }, []);

  // Start/stop campfire audio
  useEffect(() => {
    if (soundEnabled && !audioStarted.current) {
      startCampfire(0.15);
      audioStarted.current = true;
    }
    return () => {
      if (audioStarted.current) {
        stopCampfire(0.8);
        audioStarted.current = false;
      }
    };
  }, [soundEnabled]);

  // Fade out when loading completes
  useEffect(() => {
    if (!active && progress >= 100) {
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transition = 'opacity 1.2s ease-out';
          containerRef.current.style.opacity = '0';
        }
        setTimeout(() => setVisible(false), 1300);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [active, progress]);

  if (!visible) return null;

  const pct = Math.round(progress);
  const barWidth = 24;
  const filled = Math.round((pct / 100) * barWidth);
  const bar = '░'.repeat(filled) + ' '.repeat(barWidth - filled);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0612',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        fontFamily: 'Courier New, monospace',
        color: '#9e8a6a',
        letterSpacing: '0.05em',
        userSelect: 'none',
      }}
    >
      {/* Campfire ASCII art */}
      <pre
        style={{
          margin: 0,
          fontSize: 'clamp(0.45rem, 1.6vw, 0.75rem)',
          lineHeight: 1.3,
          color: '#c4935a',
          textAlign: 'center',
        }}
      >
        {FIRE_FRAMES[frame].join('\n')}
      </pre>

      {/* Loading text + bar */}
      <div
        style={{
          marginTop: '2rem',
          fontSize: '0.8rem',
          letterSpacing: '0.12em',
          textAlign: 'center',
        }}
      >
        <div>setting up camp...</div>
        <div style={{ marginTop: '0.6rem', opacity: 0.7 }}>
          [{bar}] {pct}%
        </div>
      </div>
    </div>
  );
}
