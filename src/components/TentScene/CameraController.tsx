import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useSceneStore } from '../../store/sceneStore';
import type { FocusTarget } from '../../types/scene';

// Camera presets for click-to-focus transitions
const CAMERA_PRESETS: Record<FocusTarget, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  default: { pos: new THREE.Vector3(0, 0.8, 2.5),    target: new THREE.Vector3(0, 0.5, -2.5) },
  lantern: { pos: new THREE.Vector3(0, 1.8, 1.5),    target: new THREE.Vector3(0, 2.2, 0.5) },
  laptop:  { pos: new THREE.Vector3(-1.2, 0.6, 1.5), target: new THREE.Vector3(-1.5, 0.3, 0.5) },
  door:    { pos: new THREE.Vector3(0, 0.9, 1.0),    target: new THREE.Vector3(0, 0.8, -3.0) },
  guitar:  { pos: new THREE.Vector3(1.2, 0.6, 0.5),  target: new THREE.Vector3(1.6, 0.3, -1.2) },
};

const PAN_X = 0.35;
const PAN_Y = 0.12;

export default function CameraController() {
  const { camera } = useThree();

  const mouseRef = useRef({ x: 0, y: 0 });
  const lookAt = useRef(CAMERA_PRESETS.default.target.clone());
  const basePos = useRef(CAMERA_PRESETS.default.pos.clone());
  const baseTarget = useRef(CAMERA_PRESETS.default.target.clone());
  const paralaxMul = useRef(1);
  const prevFocus = useRef<FocusTarget>('default');

  // Listen for focus target changes and animate
  useEffect(() => {
    return useSceneStore.subscribe((state) => {
      const focus = state.focusTarget;
      if (focus === prevFocus.current) return;
      prevFocus.current = focus;

      const preset = CAMERA_PRESETS[focus];
      if (!preset) return;

      // Kill any running transitions
      gsap.killTweensOf(basePos.current);
      gsap.killTweensOf(baseTarget.current);
      gsap.killTweensOf(paralaxMul);

      if (focus === 'default') {
        // Return to default — restore full parallax
        gsap.to(basePos.current, {
          x: preset.pos.x, y: preset.pos.y, z: preset.pos.z,
          duration: 0.8, ease: 'power2.inOut',
        });
        gsap.to(baseTarget.current, {
          x: preset.target.x, y: preset.target.y, z: preset.target.z,
          duration: 0.8, ease: 'power2.inOut',
        });
        gsap.to(paralaxMul, { current: 1, duration: 0.6, ease: 'power2.in' });
      } else {
        // Focus on object — dampen parallax
        gsap.to(paralaxMul, { current: 0.15, duration: 0.4, ease: 'power2.out' });
        gsap.to(basePos.current, {
          x: preset.pos.x, y: preset.pos.y, z: preset.pos.z,
          duration: 1.0, ease: 'power2.inOut',
        });
        gsap.to(baseTarget.current, {
          x: preset.target.x, y: preset.target.y, z: preset.target.z,
          duration: 1.0, ease: 'power2.inOut',
        });
      }
    });
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth - 0.5;
      mouseRef.current.y = e.clientY / window.innerHeight - 0.5;
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      mouseRef.current.x = t.clientX / window.innerWidth - 0.5;
      mouseRef.current.y = t.clientY / window.innerHeight - 0.5;
    };
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      mouseRef.current.x = Math.max(-0.5, Math.min(0.5, (e.gamma ?? 0) / 45));
      mouseRef.current.y = Math.max(-0.5, Math.min(0.5, ((e.beta ?? 45) - 45) / 45));
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
    if (!useSceneStore.getState().wakeUpDone) return;

    const mul = paralaxMul.current;

    const targetX = basePos.current.x + mouseRef.current.x * PAN_X * mul;
    const targetY = basePos.current.y - mouseRef.current.y * PAN_Y * mul;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.06);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, basePos.current.z, 0.06);

    lookAt.current.x = THREE.MathUtils.lerp(
      lookAt.current.x,
      baseTarget.current.x + mouseRef.current.x * 0.15 * mul,
      0.06
    );
    lookAt.current.y = THREE.MathUtils.lerp(
      lookAt.current.y,
      baseTarget.current.y,
      0.06
    );
    lookAt.current.z = THREE.MathUtils.lerp(
      lookAt.current.z,
      baseTarget.current.z,
      0.06
    );
    camera.lookAt(lookAt.current);
  });

  return null;
}
