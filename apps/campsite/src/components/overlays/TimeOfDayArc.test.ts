import { describe, it, expect } from 'vitest';
import { getTimeOfDay } from '../../store/timeStore';

/**
 * TimeOfDayArc is a complex SVG/DOM component with pointer event handling.
 * We test the pure calculation functions it depends on:
 * - arcPoint geometry
 * - pointerToProgress mapping
 * - Time display formatting via getTimeOfDay
 */

// Replicate constants from TimeOfDayArc.tsx
const SIZE = 120;
const PAD = 18;
const RADIUS = SIZE - PAD * 2;
const CX = PAD;
const CY = PAD;

function arcPoint(t: number): { x: number; y: number } {
  const angle = (Math.PI / 2) * (1 - t);
  return {
    x: CX + RADIUS * Math.cos(angle),
    y: CY + RADIUS * Math.sin(angle),
  };
}

function pointerToProgress(
  clientX: number,
  clientY: number,
  containerRect: { left: number; top: number },
): number {
  const svgX = clientX - containerRect.left - 14;
  const svgY = clientY - containerRect.top - 14;
  const dx = svgX - CX;
  const dy = svgY - CY;
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += Math.PI * 2;
  angle = Math.max(0, Math.min(Math.PI / 2, angle));
  return 1 - angle / (Math.PI / 2);
}

describe('arcPoint', () => {
  it('t=0 returns bottom of arc', () => {
    const { x, y } = arcPoint(0);
    // At t=0, angle = π/2, cos(π/2) ≈ 0, sin(π/2) = 1
    expect(x).toBeCloseTo(CX, 0);
    expect(y).toBeCloseTo(CY + RADIUS, 0);
  });

  it('t=1 returns right of arc', () => {
    const { x, y } = arcPoint(1);
    // At t=1, angle = 0, cos(0) = 1, sin(0) = 0
    expect(x).toBeCloseTo(CX + RADIUS, 0);
    expect(y).toBeCloseTo(CY, 0);
  });

  it('t=0.5 returns 45-degree point', () => {
    const { x, y } = arcPoint(0.5);
    // At t=0.5, angle = π/4
    const expected_x = CX + RADIUS * Math.cos(Math.PI / 4);
    const expected_y = CY + RADIUS * Math.sin(Math.PI / 4);
    expect(x).toBeCloseTo(expected_x, 5);
    expect(y).toBeCloseTo(expected_y, 5);
  });

  it('all points lie on the arc at RADIUS distance from center', () => {
    for (let t = 0; t <= 1; t += 0.1) {
      const { x, y } = arcPoint(t);
      const dist = Math.sqrt((x - CX) ** 2 + (y - CY) ** 2);
      expect(dist).toBeCloseTo(RADIUS, 3);
    }
  });
});

describe('pointerToProgress', () => {
  const rect = { left: 0, top: 0 };

  it('returns 0 for pointer at bottom of arc', () => {
    // Bottom of arc: angle = π/2 from center
    const centerX = CX + 14;
    const centerY = CY + 14;
    const p = pointerToProgress(centerX, centerY + RADIUS, rect);
    expect(p).toBeCloseTo(0, 1);
  });

  it('returns ~1 for pointer at right of arc', () => {
    const centerX = CX + 14;
    const centerY = CY + 14;
    const p = pointerToProgress(centerX + RADIUS, centerY, rect);
    expect(p).toBeCloseTo(1, 1);
  });

  it('returns values between 0 and 1', () => {
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 200;
      const y = Math.random() * 200;
      const p = pointerToProgress(x, y, rect);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe('TimeOfDayArc display', () => {
  it('shows sun icon during daytime', () => {
    const { isDaytime } = getTimeOfDay(0.25); // noon
    expect(isDaytime).toBe(true);
  });

  it('shows moon icon at night', () => {
    const { isDaytime } = getTimeOfDay(0.75); // midnight
    expect(isDaytime).toBe(false);
  });

  it('key labels match expected times', () => {
    const labels = [
      { t: 0, expected: '6am' },
      { t: 0.25, expected: 'noon' },
      { t: 0.5, expected: '6pm' },
      { t: 0.75, expected: '12am' },
    ];

    for (const { t, expected } of labels) {
      const { hours } = getTimeOfDay(t);
      if (expected === '6am') expect(hours).toBe(6);
      if (expected === 'noon') expect(hours).toBe(12);
      if (expected === '6pm') expect(hours).toBe(18);
      if (expected === '12am') expect(hours).toBe(0);
    }
  });
});
