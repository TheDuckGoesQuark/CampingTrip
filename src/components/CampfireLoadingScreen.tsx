import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useSessionStore } from '../store/sessionStore';
import { startCampfire, stopCampfire } from '../audio/campfireSynth';
import { startRain } from '../audio/rainSynth';

// Fire grows with progress: embers → kindling → growing → full flame.
// Every line is exactly 14 Braille chars; every frame is exactly 12 lines.
// Uses Unicode Braille (U+2800–U+28FF) for high-res pixel-art feel.
const FIRE_STAGES = [
  // Stage 0 — Embers (0-24 %): faint glow above cold logs
  [
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⢀⡀⢀⠀⠀⠀⠀⠀⠀⠀⡀⠀⡀\n⠈⠹⢿⣯⡄⠀⠀⠀⠀⠀⢠⣿⡾⠁\n⠀⠀⠈⠛⢿⣆⠀⡀⢀⡠⠞⠋⠀⠀\n⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠹⣿⣿⡄⠀⠀⠀⠀⠀⢠⣿⡞⠁\n⠀⠀⠈⠛⢳⣇⠀⠀⠀⣠⠞⠋⠁⠀\n⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀\n⠀⠹⣿⣿⡄⠀⠀⠀⠀⠀⢨⣽⡞⠁\n⠀⠀⠐⠛⢻⣄⢀⠀⠀⣠⠏⠋⠀⠀\n⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀",
  ],
  // Stage 1 — Kindling (25-49 %): a small flame catches
  [
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⢰⢀⣤⣔⣤⠀⠀⢠⣤⢴⣤⣄⣤⣤\n⢚⣿⣿⣿⠏⠁⠀⠘⠃⠸⣿⣿⣿⡯\n⢳⣿⣿⡯⠀⠀⠀⠀⠀⠀⢹⡿⡿⡁\n⠈⠹⣿⣿⡄⠀⠀⠀⠀⠀⢀⣵⡌⠉\n⠀⠀⠈⠙⣻⣤⠀⠀⠀⣤⠞⠛⠀⠀\n⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⢠⠀⣤⣔⡴⠆⠀⠀⡄⢤⣴⣤⣤⣤\n⢘⣿⣿⣿⡏⠀⠀⠀⠓⠙⣻⣿⣿⣿\n⢻⣿⣿⣿⠁⠀⠀⠀⠀⠀⢹⣿⡿⠉\n⠀⠹⣿⣟⡅⠀⠀⠀⠀⠀⢠⣽⡞⠁\n⠀⠀⠉⠚⢿⡤⠀⠀⠀⢢⠏⠛⠀⠀\n⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⢠⢤⣤⣤⣤⠆⠀⠀⣦⣦⣴⣶⣤⣤\n⠸⣾⣿⣿⡏⠀⠀⠐⠋⠸⢿⣿⣿⡫\n⠲⣿⣿⣿⠁⠀⠀⠀⠀⠀⢱⣿⡿⣁\n⠀⠫⣿⣿⡖⠀⠀⠀⠀⠀⠠⣿⡲⠀\n⠀⠀⠈⠛⠿⡄⠀⡀⠀⣄⠾⠋⠀⠀\n⠀⠀⠀⠀⠀⠀⠉⠁⠀⠀⠀⠀⠀⠀",
  ],
  // Stage 2 — Growing (50-74 %): flame widens, second tongue appears
  [
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⡀⢠⣶⡤⣤⣤⣤⡂⠀⠀\n⠀⠀⠀⢀⣳⣴⣿⡯⢸⣿⣿⣯⢀⠀\n⠀⠀⠀⣴⣿⣿⡿⠁⢺⣿⣿⢟⣽⡆\n⢰⣂⢾⣿⣿⠟⠀⠀⣾⢟⣿⣿⣿⣿\n⠸⣿⣿⣿⡏⠀⠀⠀⠃⠸⣿⣿⣿⡿\n⢹⣿⣿⣿⠁⠀⠀⠀⠀⠀⢹⣿⡯⡅\n⠀⠳⢿⣷⡀⠀⠀⠀⠀⠀⣤⣯⡞⠁\n⠀⠀⠈⠛⢭⣄⠀⠀⠀⣠⠞⠋⠀⠀\n⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⣀⣢⣤⡄⢤⣶⣤⡄⠀⠀\n⠀⠀⠀⠀⡻⣼⣿⠍⢸⣿⣿⣿⣆⠀\n⠀⠀⢀⣴⣿⣿⡿⠁⢸⣿⣿⡟⣬⡆\n⢐⣘⣳⣿⣟⠟⠂⠀⢻⠿⣿⣾⣾⣿\n⣾⢿⣿⣿⡇⠀⠀⠀⠃⠻⣿⣿⣿⡿\n⢁⣿⣿⣯⠁⠀⠀⠀⠀⠀⢹⡿⡷⡋\n⠀⠹⣿⣿⡤⠀⠀⠀⠀⠀⢠⣽⡞⠁\n⠀⠀⠈⠛⢻⣧⡀⠀⢀⣠⠞⠋⠀⠀\n⠀⠀⠀⠀⠀⠈⠉⠀⠀⠀⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⢀⡀⢠⣦⡄⣄⣤⣂⣄⠀⠀\n⠀⠀⠀⢀⣱⣼⣿⡍⣺⣿⣿⣿⠀⠀\n⠀⠀⠀⣰⣿⣿⡟⠁⢻⣿⣿⣛⣿⡇\n⣰⢀⣾⣿⣿⡟⠁⠀⣾⢿⣿⣿⣿⣿\n⢺⣿⣿⣿⡋⠀⠀⠀⠃⠸⣿⣿⣿⠿\n⠣⣿⣿⣿⠀⠀⠀⠀⠀⠀⢹⣿⡿⡀\n⠀⠸⣿⣿⣄⠀⠀⠀⠀⠀⢸⣿⡞⠁\n⠀⠀⠈⠛⢯⣄⠀⠀⠠⣰⠖⠋⠁⠀\n⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀",
  ],
  // Stage 3 — Full flame (75-100 %): full campfire, two-pronged
  [
    "⠀⠀⠀⠀⠀⠀⣱⣇⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠈⣽⣦⡄⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠸⣿⣿⣶⣣⠀⠀⠀\n⠀⠀⠀⠠⡀⢨⣿⡿⢿⣿⣿⡆⠀⠀\n⠀⠀⠀⠀⣳⣼⣿⡏⢑⣿⣿⡿⢀⠀\n⠀⠀⠀⣲⣿⣿⡟⠁⢸⣿⣿⣟⣯⡎\n⠐⢀⣿⣿⣿⠟⠀⠨⣶⢿⣿⣿⣾⣿\n⢼⣿⣿⣿⡎⠀⠀⠐⠃⢺⣿⣿⣿⠿\n⣻⢿⣿⣿⠂⠀⠀⠀⠀⠀⢺⣿⡿⡁\n⠀⠹⣻⣿⡀⠀⠀⠀⠀⠀⢄⣿⡞⠁\n⠀⠀⠉⠛⢷⣄⡀⡀⠀⣠⠾⠋⠀⠀\n⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⢳⣆⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⢘⣿⣵⣀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⠾⣿⣿⣷⡧⠂⠀⠀\n⠀⠀⠀⠀⡄⢢⣿⡟⣿⣿⣿⡧⠀⠀\n⠀⠀⠀⠀⣲⣌⣿⠟⢺⣿⣿⣿⢁⠀\n⠀⠀⠀⣰⣿⣿⡛⠉⢸⣿⣿⣟⣼⡆\n⢐⢀⣾⣿⣟⠝⠁⠀⣿⣿⣿⣿⣿⣷\n⢰⣾⣿⣿⡍⠀⠀⠀⠋⠹⣿⣿⣿⡿\n⢻⣽⣿⣿⠄⠀⠀⠀⠀⠀⣻⣿⡿⣅\n⠀⠹⣿⣿⡄⠀⠀⠀⠀⠀⢰⣿⡞⠁\n⠀⠀⠈⠛⣿⡄⠀⠀⠀⣄⡞⠋⠀⠀\n⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⢱⣖⠀⠀⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⢈⣻⣷⣂⠀⠀⠀⠀\n⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣧⠀⠀⠀\n⠀⠀⠀⠠⡀⢤⣿⡝⣿⣿⣿⡇⡀⠀\n⠀⠀⠀⠀⣲⣾⣿⡍⢸⣿⣿⣿⢠⡀\n⠀⠀⠀⣰⣿⣿⣟⠉⢸⣿⣿⡝⣽⡇\n⢸⢈⣿⣿⣿⡗⠀⠈⡿⣿⣿⣿⣿⣞\n⢺⣿⣿⣿⣏⠀⠀⠈⠃⠺⣿⣿⣿⡿\n⢱⣼⣿⣿⠀⠀⠀⠀⠀⠀⢙⢿⡿⡁\n⠀⠰⡿⣿⡔⠀⠀⠀⠀⠀⢠⣾⡶⠁\n⠀⠀⠈⠙⢿⡤⢀⠀⠀⢠⠎⠋⠁⠀\n⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀",
  ],
];

const MIN_DISPLAY_MS = 2000;

export default function CampfireLoadingScreen() {
  const { progress } = useProgress();
  const soundEnabled = useSessionStore((s) => s.soundEnabled);
  const hasCompletedWelcome = useSessionStore((s) => s.hasCompletedWelcome);

  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [frame, setFrame] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);

  const audioStarted = useRef(false);
  const mountTime = useRef(Date.now());
  const displayRef = useRef(0);

  // Reset state when welcome is reset (settings → reset preferences)
  useEffect(() => {
    if (!hasCompletedWelcome) {
      setVisible(true);
      setFadingOut(false);
      audioStarted.current = false;
      mountTime.current = Date.now();
    }
  }, [hasCompletedWelcome]);

  // Smooth progress animation — lerps displayPct toward real progress
  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const target = progress;
      const prev = displayRef.current;
      // Advance at ~60%/s, or snap if within 1%
      const next = Math.abs(target - prev) < 1
        ? target
        : prev + Math.min(target - prev, 60 * dt);
      displayRef.current = next;
      setDisplayPct(Math.round(next));
      if (next < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  // Fast-load skip: if assets finish within 300ms, hide immediately (returning user with cache)
  useEffect(() => {
    if (progress < 100) return;
    const elapsed = Date.now() - mountTime.current;
    if (elapsed < 300 && hasCompletedWelcome) {
      setVisible(false);
    }
  }, [progress, hasCompletedWelcome]);

  // Animate fire frames
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => f + 1), 400);
    return () => clearInterval(id);
  }, []);

  // Start campfire audio once welcome is done (user gesture unlocks AudioContext)
  useEffect(() => {
    if (!hasCompletedWelcome || !soundEnabled || audioStarted.current) return;
    startCampfire(0.15);
    audioStarted.current = true;
  }, [hasCompletedWelcome, soundEnabled]);

  // Returning users: no prior gesture → unlock AudioContext on first touch/click
  useEffect(() => {
    if (!hasCompletedWelcome || !soundEnabled) return;
    if (audioStarted.current) return;
    const unlock = () => {
      if (!audioStarted.current) {
        startCampfire(0.15);
        audioStarted.current = true;
      }
    };
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    window.addEventListener('click', unlock, { once: true });
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };
  }, [hasCompletedWelcome, soundEnabled]);

  // Fade out when loading completes + min time elapsed + welcome done
  useEffect(() => {
    if (!hasCompletedWelcome || fadingOut) return;
    if (progress < 100) return;

    const elapsed = Date.now() - mountTime.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const timer = setTimeout(() => {
      // Cross-fade audio: campfire out, rain in
      if (audioStarted.current) stopCampfire(1.5);
      if (soundEnabled) startRain(0.12);

      setFadingOut(true);
      setTimeout(() => setVisible(false), 1800);
    }, remaining);

    return () => clearTimeout(timer);
  }, [progress, hasCompletedWelcome, soundEnabled, fadingOut]);

  if (!visible) return null;

  const stageIdx = displayPct < 25 ? 0 : displayPct < 50 ? 1 : displayPct < 75 ? 2 : 3;
  const stageFrames = FIRE_STAGES[stageIdx];
  const fireArt = stageFrames[frame % stageFrames.length];

  const barWidth = 20;
  const filled = Math.max(0, Math.min(barWidth, Math.round((displayPct / 100) * barWidth)));
  const bar = '\u2591'.repeat(filled) + '\u00B7'.repeat(barWidth - filled);

  return (
    <div
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
        userSelect: 'none',
        opacity: fadingOut ? 0 : 1,
        transition: fadingOut ? 'opacity 1.6s ease-out' : 'none',
      }}
    >
      <pre
        style={{
          margin: 0,
          fontSize: 'clamp(0.75rem, 3.5vw, 1.2rem)',
          lineHeight: 1.0,
          color: '#c4935a',
        }}
      >
        {fireArt}
      </pre>

      <div style={{ marginTop: '2rem', fontSize: '0.8rem', letterSpacing: '0.12em', textAlign: 'center' }}>
        <div style={{ opacity: 0.9 }}>setting up camp...</div>
        <div style={{ marginTop: '0.6rem', opacity: 0.5 }}>
          [{bar}] {displayPct}%
        </div>
      </div>
    </div>
  );
}
