import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette as VignetteEffect } from '@react-three/postprocessing';
import SceneContent from './SceneContent';
import LoadingScreen from '../overlays/LoadingScreen';
import ProjectsOverlay from '../overlays/ProjectsOverlay';
import { useSceneStore } from '../../store/sceneStore';

interface TentSceneProps {
  visible: boolean;
}

export default function TentScene({ visible }: TentSceneProps) {
  // Escape key resets camera focus to default
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useSceneStore.getState().setFocusTarget('default');
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
        camera={{ position: [0, 0.8, 2.5], fov: 65, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, toneMapping: 3 }}
        style={{ width: '100%', height: '100dvh', display: 'block' }}
      >
        <color attach="background" args={['#0a0608']} />
        <Suspense fallback={null}>
          <SceneContent />
          <EffectComposer>
            <Bloom
              intensity={0.4}
              luminanceThreshold={0.6}
              luminanceSmoothing={0.9}
              radius={0.8}
            />
            <VignetteEffect
              darkness={0.5}
              offset={0.3}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Black overlay for the wake-up blink sequence */}
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

      <ProjectsOverlay />

      <Suspense fallback={null}>
        <LoadingScreen />
      </Suspense>
    </div>
  );
}
