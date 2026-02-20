import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../store/sceneStore';

// Camera presets for click-to-focus transitions
export const CAMERA_PRESETS = {
  default: { pos: new THREE.Vector3(0, 0.8, 2.5),    target: new THREE.Vector3(0, 0.5, -2.5) },
  lantern: { pos: new THREE.Vector3(0, 1.8, 1.5),    target: new THREE.Vector3(0, 2.2, 0.5) },
  laptop:  { pos: new THREE.Vector3(-1.2, 0.6, 1.5), target: new THREE.Vector3(-1.5, 0.3, 0.5) },
  door:    { pos: new THREE.Vector3(0, 0.9, 1.0),    target: new THREE.Vector3(0, 0.8, -3.0) },
  guitar:  { pos: new THREE.Vector3(1.5, 0.8, 0.5),  target: new THREE.Vector3(2.0, 0.5, -1.5) },
} as const;

const BASE_POS    = new THREE.Vector3(0, 0.8, 2.5);
const BASE_TARGET = new THREE.Vector3(0, 0.5, -2.5);

// Parallax strength — enough to lean and peek around
const PAN_X = 0.35;
const PAN_Y = 0.12;

export default function CameraController() {
  const { camera } = useThree();

  // Mouse/touch position — updated outside React, read in useFrame
  const mouseRef   = useRef({ x: 0, y: 0 });
  const lookAt     = useRef(BASE_TARGET.clone());
  // When > 0, parallax is suppressed (during GSAP focus transitions)
  const paralaxMul = useRef(1);

  // Expose paralaxMul so GSAP timelines can suppress it
  ;(camera as THREE.PerspectiveCamera & { _paralaxMul?: typeof paralaxMul }).
    _paralaxMul = paralaxMul;

  useEffect(() => {
    // Desktop mouse
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x =  (e.clientX / window.innerWidth  - 0.5);
      mouseRef.current.y =  (e.clientY / window.innerHeight - 0.5);
    };

    // Mobile touch
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      mouseRef.current.x =  (t.clientX / window.innerWidth  - 0.5);
      mouseRef.current.y =  (t.clientY / window.innerHeight - 0.5);
    };

    // iOS DeviceOrientation (if permission was granted via welcome screen)
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      mouseRef.current.x =  Math.max(-0.5, Math.min(0.5, (e.gamma ?? 0) / 45));
      mouseRef.current.y =  Math.max(-0.5, Math.min(0.5, ((e.beta ?? 45) - 45) / 45));
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('deviceorientation', onOrientation, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('deviceorientation', onOrientation);
    };
  }, []);

  useFrame(() => {
    // Don't fight the wake-up GSAP timeline
    if (!useSceneStore.getState().wakeUpDone) return;

    const mul = paralaxMul.current;

    // Lerp camera position toward mouse-nudged base
    const targetX = BASE_POS.x + mouseRef.current.x * PAN_X * mul;
    const targetY = BASE_POS.y - mouseRef.current.y * PAN_Y * mul;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.06);

    // Lerp lookAt target (much subtler than position — keeps scene stable)
    lookAt.current.x = THREE.MathUtils.lerp(
      lookAt.current.x,
      BASE_TARGET.x + mouseRef.current.x * 0.15 * mul,
      0.06
    );
    lookAt.current.y = THREE.MathUtils.lerp(
      lookAt.current.y,
      BASE_TARGET.y,
      0.06
    );
    camera.lookAt(lookAt.current);
  });

  // This component renders nothing — it's a pure side-effect hook
  return null;
}
