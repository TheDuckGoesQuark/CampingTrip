import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useSceneStore } from '../../store/sceneStore';
import { mobileInput } from '../../mobileInput';
import type { FocusTarget } from '../../types/scene';

const CAMERA_PRESETS: Record<FocusTarget, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  default: { pos: new THREE.Vector3(0, 2.8, 2.8),    target: new THREE.Vector3(0, 1.0, -4) },
  lantern: { pos: new THREE.Vector3(0, 1.8, 1.5),    target: new THREE.Vector3(0, 2.2, 0.5) },
  laptop:  { pos: new THREE.Vector3(-1.2, 0.6, 1.5), target: new THREE.Vector3(-1.5, 0.3, 0.5) },
  door:    { pos: new THREE.Vector3(0, 2.2, 1.5),    target: new THREE.Vector3(0, 1.5, -5) },
  guitar:  { pos: new THREE.Vector3(1.2, 0.6, 0.5),  target: new THREE.Vector3(1.6, 0.3, -1.2) },
};

// Desktop mouse parallax amounts (unchanged)
const LOOK_X = 0.8;
const LOOK_Y = 0.4;
const POS_X = 0.12;
const POS_Y = 0.08;

// Mobile: angular camera rotation
const MOBILE_MAX_YAW = (85 * Math.PI) / 180;   // ±85° horizontal
const MOBILE_MAX_PITCH = (25 * Math.PI) / 180;  // ±25° vertical

// Joystick: normalised units per second at full deflection
const JOYSTICK_SPEED = 1.2;
const ANGLE_CLAMP = 1.0;

// Gyroscope gentle additive layer
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

  // Shared output that feeds the frame loop
  const inputRef = useRef({ x: 0, y: 0 });

  // Desktop mouse (absolute position)
  const mouseRef = useRef({ x: 0, y: 0 });

  // Mobile: accumulated camera angle offset (fed by joystick velocity each frame)
  const angleRef = useRef({ x: 0, y: 0 });

  // Mobile: gentle gyroscope additive
  const gyroRef = useRef({ x: 0, y: 0 });

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
        // Mobile: fully zero out parallax so focus preset camera angles work correctly
        const targetMul = isTouchDevice() ? 0 : 0.15;
        gsap.to(paralaxMul, { current: targetMul, duration: 0.4, ease: 'power2.out' });

        // Mobile: smoothly center the accumulated angle so the focus view faces forward
        if (isTouchDevice()) {
          gsap.to(angleRef.current, {
            x: 0, y: 0,
            duration: 0.8, ease: 'power2.inOut',
          });
        }

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

  // Input listeners — desktop: mouse; mobile: gyroscope only (touch replaced by joystick)
  useEffect(() => {
    const isTouch = isTouchDevice();

    // ── Desktop: absolute mouse position ──
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth - 0.5;
      mouseRef.current.y = e.clientY / window.innerHeight - 0.5;
    };

    // ── Mobile: gentle gyroscope (additive on top of joystick) ──
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      gyroRef.current.x = Math.max(-0.5, Math.min(0.5, (e.gamma ?? 0) / 45));
      gyroRef.current.y = Math.max(-0.5, Math.min(0.5, ((e.beta ?? 45) - 45) / 45));
    };

    if (isTouch) {
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
    } else {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
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

    // Merge inputs
    if (isTouchDevice()) {
      // Accumulate joystick velocity into persistent angle offset
      if (mobileInput.active) {
        angleRef.current.x += mobileInput.x * JOYSTICK_SPEED * delta;
        angleRef.current.y += mobileInput.y * JOYSTICK_SPEED * delta;
        angleRef.current.x = Math.max(-ANGLE_CLAMP, Math.min(ANGLE_CLAMP, angleRef.current.x));
        angleRef.current.y = Math.max(-ANGLE_CLAMP, Math.min(ANGLE_CLAMP, angleRef.current.y));
      }

      inputRef.current.x = angleRef.current.x + gyroRef.current.x * GYRO_WEIGHT;
      inputRef.current.y = angleRef.current.y + gyroRef.current.y * GYRO_WEIGHT;
    } else {
      inputRef.current.x = mouseRef.current.x;
      inputRef.current.y = mouseRef.current.y;
    }

    const ix = inputRef.current.x;
    const iy = inputRef.current.y;

    // Breathing bob + idle sway
    const breatheOffset = Math.sin(t * BREATHE_SPEED * Math.PI * 2) * BREATHE_Y;
    const swayOffset = Math.sin(t * SWAY_SPEED * Math.PI * 2) * SWAY_X;

    if (isTouchDevice()) {
      // ── Mobile: angular rotation for wide FOV ──
      const yaw = ix * MOBILE_MAX_YAW * mul;
      const pitch = -iy * MOBILE_MAX_PITCH * mul;

      // Direction from camera to base look target
      const dx = baseTarget.current.x - basePos.current.x;
      const dy = baseTarget.current.y - basePos.current.y;
      const dz = baseTarget.current.z - basePos.current.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Rotate direction by yaw (around Y axis)
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const rotX = dx * cosY + dz * sinY;
      const rotZ = -dx * sinY + dz * cosY;

      // Camera position: just breathing/sway, no positional parallax
      const targetPosX = basePos.current.x + swayOffset;
      const targetPosY = basePos.current.y + breatheOffset;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetPosX, 0.06);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetPosY, 0.06);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, basePos.current.z, 0.06);

      // Look at: rotated direction + pitch
      lookAt.current.x = THREE.MathUtils.lerp(
        lookAt.current.x,
        basePos.current.x + rotX + swayOffset * 0.5,
        0.06,
      );
      lookAt.current.y = THREE.MathUtils.lerp(
        lookAt.current.y,
        basePos.current.y + dy + Math.sin(pitch) * dist + breatheOffset * 0.3,
        0.06,
      );
      lookAt.current.z = THREE.MathUtils.lerp(
        lookAt.current.z,
        basePos.current.z + rotZ,
        0.06,
      );
    } else {
      // ── Desktop: subtle parallax (unchanged) ──
      const targetX = basePos.current.x + ix * POS_X * mul + swayOffset;
      const targetY = basePos.current.y - iy * POS_Y * mul + breatheOffset;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.06);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, basePos.current.z, 0.06);

      lookAt.current.x = THREE.MathUtils.lerp(
        lookAt.current.x,
        baseTarget.current.x + ix * LOOK_X * mul + swayOffset * 0.5,
        0.06,
      );
      lookAt.current.y = THREE.MathUtils.lerp(
        lookAt.current.y,
        baseTarget.current.y - iy * LOOK_Y * mul + breatheOffset * 0.3,
        0.06,
      );
      lookAt.current.z = THREE.MathUtils.lerp(
        lookAt.current.z,
        baseTarget.current.z,
        0.06,
      );
    }

    camera.lookAt(lookAt.current);
  });

  return null;
}
