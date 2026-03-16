import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import SceneContent from './SceneContent';
import DebugControls from './DebugControls';
import InteractionOverlay from './InteractionOverlay';
import LaptopScreenOverlay from '../overlays/LaptopScreenOverlay';
import NotepadOverlay from '../overlays/NotepadOverlay';
import MusicPlayerOverlay from '../overlays/MusicPlayerOverlay';
import TimeOfDayArc from '../overlays/TimeOfDayArc';
import SettingsMenu from '../overlays/SettingsMenu';
import Vignette from '../effects/Vignette';
import VirtualJoystick from '../VirtualJoystick';
import { useSceneStore } from '../../store/sceneStore';
import { isMobile } from '../../utils/deviceDetect';

interface TentSceneProps {
  visible: boolean;
}

export default function TentScene({ visible }: TentSceneProps) {
  const [debug, setDebug] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Detect WebGL context loss (common on mobile due to GPU memory pressure)
  const onCreated = useCallback(({ gl }: { gl: { domElement: HTMLCanvasElement } }) => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.error('[TentScene] WebGL context lost');
      setContextLost(true);
    });
  }, []);

  // Simple fade-in from black when scene becomes visible
  useEffect(() => {
    if (visible && fadeIn) {
      // Mark wakeUpDone immediately so CameraController works
      useSceneStore.getState().setWakeUpDone();
      // Fade out the black overlay
      const timer = setTimeout(() => {
        if (overlayRef.current) {
          overlayRef.current.style.transition = 'opacity 1.2s ease-out';
          overlayRef.current.style.opacity = '0';
        }
        setFadeIn(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, fadeIn]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const store = useSceneStore.getState();
        if (store.notepadFocused) {
          store.setNotepadFocused(false);
        } else if (store.laptopFocused) {
          store.setLaptopFocused(false);
        } else {
          store.setFocusTarget('default');
        }
      }
      // Debug toggle: Alt+D, dev builds only
      if (import.meta.env.DEV && e.altKey && e.key === 'd') {
        // Skip if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        setDebug((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.2s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <Canvas
        shadows
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 2.8, 3.5], fov: 69, near: 0.1, far: 200 }}
        gl={{ antialias: !isMobile, alpha: false }}
        style={{ width: '100%', height: '100dvh', display: 'block', touchAction: 'manipulation' }}
        aria-label="Interactive 3D tent scene — use Tab to navigate objects, Enter to interact"
        role="application"
        onCreated={onCreated}
      >
        <color attach="background" args={['#0a0608']} />
        <Suspense fallback={null}>
          <SceneContent debug={debug} />
          {debug && <DebugControls />}
        </Suspense>
      </Canvas>

      {/* Fade-in overlay — starts black, fades to transparent */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          zIndex: 20,
          opacity: 1,
          pointerEvents: 'none',
        }}
      />

      {/* WebGL context loss fallback */}
      {contextLost && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#0a0612',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Courier New, monospace',
            color: '#9e8a6a',
            zIndex: 30,
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div style={{ fontSize: '1rem', color: '#e8d5b0', marginBottom: '0.5rem' }}>
            The campfire went out.
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '1.5rem' }}>
            Your device ran low on graphics memory.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(255, 179, 71, 0.15)',
              border: '1px solid rgba(255, 179, 71, 0.3)',
              color: '#ffb347',
              padding: '10px 24px',
              borderRadius: 8,
              fontFamily: 'Courier New, monospace',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Relight the fire
          </button>
        </div>
      )}

      {debug && (
        <div style={{
          position: 'fixed', top: 12, left: 12, zIndex: 50,
          background: 'rgba(0,0,0,0.8)', color: '#0f0', padding: '8px 12px',
          fontFamily: 'monospace', fontSize: 12, borderRadius: 4,
        }}>
          DEBUG MODE — orbit with mouse, Alt+D to toggle
        </div>
      )}

      {/* Hidden buttons for keyboard / screen-reader access to 3D objects */}
      <InteractionOverlay />

      {/* Fullscreen overlays */}
      <LaptopScreenOverlay />
      <NotepadOverlay />
      <MusicPlayerOverlay />

      {/* Ambient UI overlays */}
      <Vignette />
      <TimeOfDayArc />
      <SettingsMenu />
      <VirtualJoystick />
    </div>
  );
}
