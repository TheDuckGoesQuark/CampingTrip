import { describe, it, expect } from 'vitest';
import * as THREE from 'three';

/**
 * CameraController is a React Three Fiber component using useFrame.
 * We extract and test its core camera math logic here:
 * - Camera preset positions
 * - Breathing/sway calculations
 * - Parallax calculations
 * - Mouse-to-camera mapping
 */

// Replicate constants from CameraController.tsx
const CAMERA_PRESETS = {
  default: { pos: new THREE.Vector3(0, 2.8, 2.8),    target: new THREE.Vector3(0, 1.0, -4) },
  lantern: { pos: new THREE.Vector3(0, 1.8, 1.5),    target: new THREE.Vector3(0, 2.2, 0.5) },
  laptop:  { pos: new THREE.Vector3(-1.2, 0.6, 1.5), target: new THREE.Vector3(-1.5, 0.3, 0.5) },
  door:    { pos: new THREE.Vector3(0, 2.2, 1.5),    target: new THREE.Vector3(0, 1.5, -5) },
  guitar:  { pos: new THREE.Vector3(1.2, 0.6, 0.5),  target: new THREE.Vector3(1.6, 0.3, -1.2) },
};

const LOOK_X = 0.8;
const LOOK_Y = 0.4;
const POS_X = 0.12;
const POS_Y = 0.08;
const BREATHE_SPEED = 0.22;
const BREATHE_Y = 0.008;
const SWAY_SPEED = 0.12;
const SWAY_X = 0.004;

// Extracted pure functions from the useFrame loop
function calculateBreathingOffset(time: number): number {
  return Math.sin(time * BREATHE_SPEED * Math.PI * 2) * BREATHE_Y;
}

function calculateSwayOffset(time: number): number {
  return Math.sin(time * SWAY_SPEED * Math.PI * 2) * SWAY_X;
}

function calculateCameraTargetX(
  baseX: number,
  mouseX: number,
  parallaxMul: number,
  swayOffset: number,
): number {
  return baseX + mouseX * POS_X * parallaxMul + swayOffset;
}

function calculateCameraTargetY(
  baseY: number,
  mouseY: number,
  parallaxMul: number,
  breatheOffset: number,
): number {
  return baseY - mouseY * POS_Y * parallaxMul + breatheOffset;
}

function calculateLookAtX(
  baseTargetX: number,
  mouseX: number,
  parallaxMul: number,
  swayOffset: number,
): number {
  return baseTargetX + mouseX * LOOK_X * parallaxMul + swayOffset * 0.5;
}

// ─── Tests ───────────────────────────────────────────────────────

describe('Camera presets', () => {
  it('default preset is elevated and looking forward', () => {
    const { pos, target } = CAMERA_PRESETS.default;
    expect(pos.y).toBeGreaterThan(2); // elevated viewpoint
    expect(target.z).toBeLessThan(pos.z); // looking forward/into tent
  });

  it('all presets have distinct positions', () => {
    const keys = Object.keys(CAMERA_PRESETS) as Array<keyof typeof CAMERA_PRESETS>;
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const a = CAMERA_PRESETS[keys[i]].pos;
        const b = CAMERA_PRESETS[keys[j]].pos;
        expect(a.distanceTo(b)).toBeGreaterThan(0);
      }
    }
  });

  it('laptop preset is lower (looking down at desk)', () => {
    expect(CAMERA_PRESETS.laptop.pos.y).toBeLessThan(CAMERA_PRESETS.default.pos.y);
  });

  it('guitar preset is to the right', () => {
    expect(CAMERA_PRESETS.guitar.pos.x).toBeGreaterThan(0);
  });
});

describe('breathing animation', () => {
  it('oscillates with bounded amplitude', () => {
    for (let t = 0; t < 100; t += 0.1) {
      const offset = calculateBreathingOffset(t);
      expect(Math.abs(offset)).toBeLessThanOrEqual(BREATHE_Y);
    }
  });

  it('is zero at t=0', () => {
    expect(calculateBreathingOffset(0)).toBeCloseTo(0, 10);
  });

  it('has the correct period', () => {
    // Period = 1 / BREATHE_SPEED seconds
    const period = 1 / BREATHE_SPEED;
    const atZero = calculateBreathingOffset(0);
    const atPeriod = calculateBreathingOffset(period);
    expect(atPeriod).toBeCloseTo(atZero, 5);
  });
});

describe('idle sway animation', () => {
  it('oscillates with bounded amplitude', () => {
    for (let t = 0; t < 100; t += 0.1) {
      const offset = calculateSwayOffset(t);
      expect(Math.abs(offset)).toBeLessThanOrEqual(SWAY_X);
    }
  });
});

describe('camera position calculation', () => {
  it('at center mouse, matches base position', () => {
    const baseX = CAMERA_PRESETS.default.pos.x;
    const x = calculateCameraTargetX(baseX, 0, 1, 0);
    expect(x).toBe(baseX);
  });

  it('mouse at right edge shifts camera right', () => {
    const baseX = 0;
    const x = calculateCameraTargetX(baseX, 0.5, 1, 0); // mouse at right edge
    expect(x).toBeGreaterThan(baseX);
  });

  it('mouse at left edge shifts camera left', () => {
    const baseX = 0;
    const x = calculateCameraTargetX(baseX, -0.5, 1, 0);
    expect(x).toBeLessThan(baseX);
  });

  it('parallax multiplier scales the effect', () => {
    const full = calculateCameraTargetX(0, 0.5, 1, 0);
    const reduced = calculateCameraTargetX(0, 0.5, 0.15, 0);
    expect(Math.abs(reduced)).toBeLessThan(Math.abs(full));
  });

  it('y position includes breathing offset', () => {
    const baseY = 2.8;
    const breathe = 0.005;
    const y = calculateCameraTargetY(baseY, 0, 1, breathe);
    expect(y).toBe(baseY + breathe);
  });
});

describe('look-at calculation', () => {
  it('look-at has larger parallax range than position', () => {
    // LOOK_X (0.8) > POS_X (0.12)
    const mouseX = 0.5;
    const posShift = mouseX * POS_X;
    const lookShift = mouseX * LOOK_X;
    expect(lookShift).toBeGreaterThan(posShift);
  });

  it('look-at shifts with mouse input', () => {
    const baseLook = CAMERA_PRESETS.default.target.x;
    const shifted = calculateLookAtX(baseLook, 0.5, 1, 0);
    expect(shifted).toBeGreaterThan(baseLook);
  });
});

describe('mouse input mapping', () => {
  it('mouse coordinates map to -0.5 to 0.5 range', () => {
    // From CameraController: mouseRef.current.x = e.clientX / window.innerWidth - 0.5
    const windowWidth = 1920;
    const atLeft = 0 / windowWidth - 0.5;
    const atCenter = (windowWidth / 2) / windowWidth - 0.5;
    const atRight = windowWidth / windowWidth - 0.5;

    expect(atLeft).toBeCloseTo(-0.5);
    expect(atCenter).toBeCloseTo(0);
    expect(atRight).toBeCloseTo(0.5);
  });
});
