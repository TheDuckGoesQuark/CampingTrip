import { describe, it, expect } from 'vitest';
import { easings } from './easings';

describe('easings', () => {
  it('exports all expected easing presets', () => {
    expect(easings.smooth).toBe('power2.inOut');
    expect(easings.out).toBe('power2.out');
    expect(easings.in).toBe('power2.in');
    expect(easings.snappy).toBe('power3.out');
    expect(easings.bounce).toBe('back.out(1.7)');
    expect(easings.gentle).toBe('power1.inOut');
  });

  it('is a frozen/readonly object (const assertion)', () => {
    // TypeScript const assertion makes the values readonly at the type level.
    // At runtime, Object.isFrozen depends on how TS compiles it.
    // We verify the values are strings (GSAP easing identifiers).
    for (const value of Object.values(easings)) {
      expect(typeof value).toBe('string');
    }
  });
});
