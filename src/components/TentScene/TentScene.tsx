import { Suspense, useEffect, useState, useRef } from 'react';
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
  const overlayRef = useRef<HTMLDivElement>(null);

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
