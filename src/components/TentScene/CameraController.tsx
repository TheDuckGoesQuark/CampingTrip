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

// Desktop mouse parallax amounts
const LOOK_X = 0.8;
const LOOK_Y = 0.4;
const POS_X = 0.12;
const POS_Y = 0.08;

// Mobile touch-drag sensitivity (maps drag pixels → normalised offset)
// Higher = camera responds more per pixel dragged
const TOUCH_DRAG_SENSITIVITY = 3.5 / Math.max(window.innerWidth, 1);
// Wider clamp range than desktop (0.5) so mobile users can look further L/R
const TOUCH_CLAMP = 0.85;
// Gyroscope gentle additive layer (much softer than touch)
const GYRO_WEIGHT = 0.12;

// Breathing / idle sway
const BREATHE_SPEED = 0.22;
const BREATHE_Y = 0.008;
const SWAY_SPEED = 0.12;
const SWAY_X = 0.004;

const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export default function CameraController() {
  const { camera } = useThree();
  const time = useRef(0);

  // Shared output that feeds the frame loop — normalised to roughly -0.5..0.5
  const inputRef = useRef({ x: 0, y: 0 });

  // Desktop mouse (absolute position, same as before)
  const mouseRef = useRef({ x: 0, y: 0 });

  // Mobile: accumulated touch drag offset
  const touchDragRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Mobile: gentle gyroscope additive
  const gyroRef = useRef({ x: 0, y: 0 });

  const lookAt = useRef(CAMERA_PRESETS.default.target.clone());
  const basePos = useRef(CAMERA_PRESETS.default.pos.clone());
  const baseTarget = useRef(CAMERA_PRESETS.default.target.clone());
  const paralaxMul = useRef(1);
  const prevFocus = useRef<FocusTarget>('default');

  // Focus target transitions (unchanged)
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

  // Input listeners
  useEffect(() => {
    const isTouch = isTouchDevice();

    // ── Desktop: absolute mouse position ──
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth - 0.5;
      mouseRef.current.y = e.clientY / window.innerHeight - 0.5;
    };

    // ── Mobile: cumulative drag ──
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const t = e.touches[0];
      // Inverted: drag right → look left (natural "grab & drag the world" feel)
      const dx = -(t.clientX - touchStartRef.current.x) * TOUCH_DRAG_SENSITIVITY;
      const dy = -(t.clientY - touchStartRef.current.y) * TOUCH_DRAG_SENSITIVITY;
      touchDragRef.current.x = Math.max(-TOUCH_CLAMP, Math.min(TOUCH_CLAMP, touchDragRef.current.x + dx));
      touchDragRef.current.y = Math.max(-TOUCH_CLAMP, Math.min(TOUCH_CLAMP, touchDragRef.current.y + dy));
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    };

    const onTouchEnd = () => {
      touchStartRef.current = null;
    };

    // ── Mobile: gentle gyroscope (additive on top of drag) ──
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      gyroRef.current.x = Math.max(-0.5, Math.min(0.5, (e.gamma ?? 0) / 45));
      gyroRef.current.y = Math.max(-0.5, Math.min(0.5, ((e.beta ?? 45) - 45) / 45));
    };

    if (isTouch) {
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
      window.addEventListener('touchcancel', onTouchEnd, { passive: true });
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
    } else {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('deviceorientation', onOrientation);
    };
  }, []);

  useFrame((_, delta) => {
    const storeState = useSceneStore.getState();
    if (!storeState.wakeUpDone) return;
    if (storeState.laptopFocused) return;

    time.current += delta;
    const t = time.current;
    const mul = paralaxMul.current;

    // Merge inputs into a single -0.5..0.5 value
    if (isTouchDevice()) {
      // Touch drag is the primary input; gyro adds a gentle layer
      inputRef.current.x = touchDragRef.current.x + gyroRef.current.x * GYRO_WEIGHT;
      inputRef.current.y = touchDragRef.current.y + gyroRef.current.y * GYRO_WEIGHT;
    } else {
      inputRef.current.x = mouseRef.current.x;
      inputRef.current.y = mouseRef.current.y;
    }

    const ix = inputRef.current.x;
    const iy = inputRef.current.y;

    // Breathing bob + idle sway
    const breatheOffset = Math.sin(t * BREATHE_SPEED * Math.PI * 2) * BREATHE_Y;
    const swayOffset = Math.sin(t * SWAY_SPEED * Math.PI * 2) * SWAY_X;

    // Camera position: subtle depth parallax
    const targetX = basePos.current.x + ix * POS_X * mul + swayOffset;
    const targetY = basePos.current.y - iy * POS_Y * mul + breatheOffset;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.06);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, basePos.current.z, 0.06);

    // LookAt: larger shift for "looking around"
    lookAt.current.x = THREE.MathUtils.lerp(
      lookAt.current.x,
      baseTarget.current.x + ix * LOOK_X * mul + swayOffset * 0.5,
      0.06
    );
    lookAt.current.y = THREE.MathUtils.lerp(
      lookAt.current.y,
      baseTarget.current.y - iy * LOOK_Y * mul + breatheOffset * 0.3,
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
