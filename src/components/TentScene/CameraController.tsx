import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useSceneStore } from '../../store/sceneStore';
import type { FocusTarget } from '../../types/scene';

const CAMERA_PRESETS: Record<FocusTarget, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  default: { pos: new THREE.Vector3(0, 2.8, 2.8),    target: new THREE.Vector3(0, 1.0, -4) },
  lantern: { pos: new THREE.Vector3(0, 1.8, 1.5),    target: new THREE.Vector3(0, 2.2, 0.5) },
  laptop:  { pos: new THREE.Vector3(-1.2, 0.6, 1.5), target: new THREE.Vector3(-1.5, 0.3, 0.5) },
  door:    { pos: new THREE.Vector3(0, 2.2, 1.5),    target: new THREE.Vector3(0, 1.5, -5) },
  guitar:  { pos: new THREE.Vector3(1.2, 0.6, 0.5),  target: new THREE.Vector3(1.6, 0.3, -1.2) },
};

// How much the lookAt target shifts with mouse — this is the "looking around" feel
const LOOK_X = 0.8;
const LOOK_Y = 0.4;
// How much the camera position shifts (subtle, creates depth parallax)
const POS_X = 0.12;
const POS_Y = 0.08;

// Breathing / idle sway — sells "this is a living person's viewpoint"
const BREATHE_SPEED = 0.22;   // cycles per second (slow, relaxed breathing)
const BREATHE_Y = 0.008;     // vertical amplitude
const SWAY_SPEED = 0.12;     // very slow lateral drift
const SWAY_X = 0.004;        // barely perceptible

export default function CameraController() {
  const { camera } = useThree();
  const time = useRef(0);

  const mouseRef = useRef({ x: 0, y: 0 });
  const lookAt = useRef(CAMERA_PRESETS.default.target.clone());
  const basePos = useRef(CAMERA_PRESETS.default.pos.clone());
  const baseTarget = useRef(CAMERA_PRESETS.default.target.clone());
  const paralaxMul = useRef(1);
  const prevFocus = useRef<FocusTarget>('default');

  // Focus target transitions
  useEffect(() => {
    return useSceneStore.subscribe((state) => {
      const focus = state.focusTarget;
      if (focus === prevFocus.current) return;
      prevFocus.current = focus;

      const preset = CAMERA_PRESETS[focus];
      if (!preset) return;

      gsap.killTweensOf(basePos.current);
      gsap.killTweensOf(baseTarget.current);
      gsap.killTweensOf(paralaxMul);

      if (focus === 'default') {
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

  // Mouse/touch/gyro input
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

  useFrame((_, delta) => {
    const storeState = useSceneStore.getState();
    if (!storeState.wakeUpDone) return;

    // Freeze camera while laptop is in focus mode
    if (storeState.laptopFocused) return;

    time.current += delta;
    const t = time.current;
    const mul = paralaxMul.current;

    // Breathing bob + idle sway (always active, makes it feel alive)
    const breatheOffset = Math.sin(t * BREATHE_SPEED * Math.PI * 2) * BREATHE_Y;
    const swayOffset = Math.sin(t * SWAY_SPEED * Math.PI * 2) * SWAY_X;

    // Camera position: subtle shift WITH mouse for depth parallax
    const targetX = basePos.current.x + mouseRef.current.x * POS_X * mul + swayOffset;
    const targetY = basePos.current.y - mouseRef.current.y * POS_Y * mul + breatheOffset;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.06);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, basePos.current.z, 0.06);

    // LookAt: larger shift WITH mouse — this is the actual "looking around"
    lookAt.current.x = THREE.MathUtils.lerp(
      lookAt.current.x,
      baseTarget.current.x + mouseRef.current.x * LOOK_X * mul + swayOffset * 0.5,
      0.06
    );
    lookAt.current.y = THREE.MathUtils.lerp(
      lookAt.current.y,
      baseTarget.current.y - mouseRef.current.y * LOOK_Y * mul + breatheOffset * 0.3,
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
