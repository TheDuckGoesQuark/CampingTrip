import { describe, it, expect } from 'vitest';
import { asset } from './assetPath';

/**
 * Tests for the asset() utility.
 *
 * In production (Vite build), import.meta.env.BASE_URL = '/CampingTrip/'.
 * In the test environment (Vitest), it defaults to '/'.
 * We test the function's logic (stripping leading slashes, prepending BASE)
 * rather than a hardcoded BASE value.
 */

const BASE = import.meta.env.BASE_URL; // '/' in tests, '/CampingTrip/' in prod

describe('asset', () => {
  it('prepends the base URL to a path', () => {
    const result = asset('models/tent.glb');
    expect(result).toBe(`${BASE}models/tent.glb`);
  });

  it('strips leading slash from the path to avoid double slashes', () => {
    const result = asset('/images/logo.webp');
    expect(result).toBe(`${BASE}images/logo.webp`);
    // Crucially, no double slash
    expect(result).not.toContain('//');
  });

  it('handles paths without leading slash', () => {
    const result = asset('audio/rain.mp3');
    expect(result).toBe(`${BASE}audio/rain.mp3`);
  });

  it('handles nested paths', () => {
    const result = asset('models/environment/tent.glb');
    expect(result).toBe(`${BASE}models/environment/tent.glb`);
  });

  it('handles empty string path', () => {
    const result = asset('');
    expect(result).toBe(BASE);
  });

  it('result always starts with the base URL', () => {
    const paths = ['foo.png', '/bar.glb', 'a/b/c.mp3'];
    for (const p of paths) {
      expect(asset(p).startsWith(BASE)).toBe(true);
    }
  });
});
