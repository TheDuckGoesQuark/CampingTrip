import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import SceneContent from './SceneContent';
import LoadingScreen from '../overlays/LoadingScreen';
import ProjectsOverlay from '../overlays/ProjectsOverlay';
import Vignette from '../effects/Vignette';

interface TentSceneProps {
  visible: boolean;
}

export default function TentScene({ visible }: TentSceneProps) {
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
        camera={{ position: [0, 0.8, 2.5], fov: 65, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100dvh', display: 'block' }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>

      {/* Black overlay for the wake-up blink sequence — animated by WakeUpController */}
      <div
        id="wake-up-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          zIndex: 20,
          opacity: 1,
          pointerEvents: 'none',
        }}
      />

      <Vignette />
      <ProjectsOverlay />

      <Suspense fallback={null}>
        <LoadingScreen />
      </Suspense>
    </div>
  );
}
