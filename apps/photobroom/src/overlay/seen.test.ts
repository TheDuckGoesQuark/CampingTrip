/**
 * Tests for the reviewed-photo memory. In jsdom there's no chrome.storage, so
 * these exercise the localStorage path.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSeen, saveSeen, clearSeen } from './seen';

beforeEach(() => localStorage.clear());

describe('seen memory', () => {
  it('round-trips ids', async () => {
    await saveSeen(new Set(['a', 'b']));
    const seen = await loadSeen();
    expect([...seen].sort()).toEqual(['a', 'b']);
  });

  it('loads an empty set when nothing stored', async () => {
    expect((await loadSeen()).size).toBe(0);
  });

  it('MERGES with what is already stored rather than clobbering it', async () => {
    // Simulates a second tab that already persisted some ids.
    await saveSeen(new Set(['existing1', 'existing2']));
    // This "tab" only knows about its own new ids.
    await saveSeen(new Set(['new1']));
    const seen = await loadSeen();
    expect([...seen].sort()).toEqual(['existing1', 'existing2', 'new1']);
  });

  it('is idempotent for repeated ids', async () => {
    await saveSeen(new Set(['x']));
    await saveSeen(new Set(['x']));
    expect((await loadSeen()).size).toBe(1);
  });

  it('clears everything', async () => {
    await saveSeen(new Set(['a', 'b']));
    clearSeen();
    expect((await loadSeen()).size).toBe(0);
  });

  it('survives corrupt stored JSON', async () => {
    localStorage.setItem('photobroom.seen', '{not valid json');
    expect((await loadSeen()).size).toBe(0);
    await saveSeen(new Set(['a']));
    expect([...(await loadSeen())]).toEqual(['a']);
  });
});
