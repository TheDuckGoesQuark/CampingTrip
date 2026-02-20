import { useEffect, useState } from 'react';
import { useSceneStore } from '../../store/sceneStore';

/**
 * Full-viewport overlay that appears when the laptop screen is "focused".
 * Fades in after a short delay (to let the 3D GSAP animation play),
 * then acts as a normal web page layer on top of the 3D canvas.
 *
 * Press Escape to exit (handled in TentScene.tsx).
 */
export default function LaptopScreenOverlay() {
  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const [mounted, setMounted] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (laptopFocused) {
      // Mount immediately but delay fade-in so 3D animation plays first
      setMounted(true);
      const timer = setTimeout(() => setOpacity(1), 650);
      return () => clearTimeout(timer);
    } else {
      // Fade out, then unmount
      setOpacity(0);
      const timer = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(timer);
    }
  }, [laptopFocused]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#0a0a14',
        opacity,
        transition: 'opacity 0.4s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e0e0e8',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Logo */}
      <img
        src="/images/logo.png"
        alt="App logo"
        style={{
          width: 96,
          height: 96,
          marginBottom: 32,
          filter: 'drop-shadow(0 0 20px rgba(100, 140, 255, 0.3))',
        }}
      />

      {/* Placeholder — this becomes the actual app later */}
      <p style={{ opacity: 0.4, fontSize: 14, marginBottom: 48 }}>
        Coming soon
      </p>

      {/* Escape hint */}
      <button
        onClick={() => useSceneStore.getState().setLaptopFocused(false)}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.5)',
          padding: '8px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: 13,
          letterSpacing: '0.02em',
          transition: 'background 0.2s, color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.12)';
          (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
          (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
        }}
      >
        ←  Back to tent <span style={{ opacity: 0.4, marginLeft: 8 }}>Esc</span>
      </button>
    </div>
  );
}
