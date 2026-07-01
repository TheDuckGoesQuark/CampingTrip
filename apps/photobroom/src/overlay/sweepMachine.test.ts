import { describe, it, expect } from 'vitest';
import {
  reducer,
  initialState,
  deckOf,
  currentPhoto,
  trashIds,
  deckStats,
  type State,
  type View,
} from './sweepMachine';
import type { ScrapedPhoto } from '../types';

const photos: ScrapedPhoto[] = [
  { id: 'a', thumbnailUrl: 'a.jpg', ariaLabel: 'A' },
  { id: 'b', thumbnailUrl: 'b.jpg', ariaLabel: 'B' },
  { id: 'c', thumbnailUrl: 'c.jpg', ariaLabel: 'C' },
];

const start = (over: Partial<State> = {}): State => ({ ...initialState, href: 'u0', ...over });

/** Drive the machine from idle into a sweeping deck of the given photos. */
function sweeping(ps: ScrapedPhoto[], baseSeen: string[] = []): State {
  let s = start({ baseSeen: new Set(baseSeen) });
  s = reducer(s, { type: 'collecting', status: '…' });
  s = reducer(s, { type: 'collected', photos: ps });
  return s;
}

describe('collection', () => {
  it('goes to error when nothing is found', () => {
    const s = reducer(start(), { type: 'collected', photos: [] });
    expect(s.view.phase).toBe('error');
  });

  it('goes to allseen when every photo was already reviewed', () => {
    const s = reducer(start({ baseSeen: new Set(['a', 'b', 'c']) }), { type: 'collected', photos });
    expect(s.view.phase).toBe('allseen');
  });

  it('starts sweeping the fresh photos and records how many were skipped', () => {
    const s = reducer(start({ baseSeen: new Set(['a']) }), { type: 'collected', photos });
    expect(s.view.phase).toBe('sweeping');
    const deck = deckOf(s.view)!;
    expect(deck.photos.map((p) => p.id)).toEqual(['b', 'c']);
    expect(deck.alreadyReviewed).toBe(1);
  });

  it('sweepAll reviews the collected photos ignoring memory', () => {
    let s = reducer(start({ baseSeen: new Set(['a', 'b', 'c']) }), { type: 'collected', photos });
    expect(s.view.phase).toBe('allseen');
    s = reducer(s, { type: 'sweepAll' });
    expect(s.view.phase).toBe('sweeping');
    expect(deckOf(s.view)!.photos).toHaveLength(3);
  });
});

describe('triage', () => {
  it('records a decision and advances', () => {
    let s = sweeping(photos);
    s = reducer(s, { type: 'decide', decision: 'keep' });
    const deck = deckOf(s.view)!;
    expect(deck.decisions).toEqual({ a: 'keep' });
    expect(deck.index).toBe(1);
    expect(s.view.phase).toBe('sweeping');
  });

  it('auto-transitions to review when the last card is decided (no effect needed)', () => {
    let s = sweeping(photos);
    s = reducer(s, { type: 'decide', decision: 'trash' });
    s = reducer(s, { type: 'decide', decision: 'keep' });
    s = reducer(s, { type: 'decide', decision: 'skip' });
    expect(s.view.phase).toBe('review');
    expect(trashIds(deckOf(s.view)!)).toEqual(['a']);
  });

  it('undo steps back and removes only that decision', () => {
    let s = sweeping(photos);
    s = reducer(s, { type: 'decide', decision: 'trash' });
    s = reducer(s, { type: 'decide', decision: 'keep' });
    s = reducer(s, { type: 'undo' });
    const deck = deckOf(s.view)!;
    expect(deck.index).toBe(1);
    expect(deck.decisions).toEqual({ a: 'trash' });
    expect((s.view as Extract<View, { phase: 'sweeping' }>).dir).toBe(-1);
  });

  it('undo at the first card is a no-op', () => {
    const s0 = sweeping(photos);
    const s1 = reducer(s0, { type: 'undo' });
    expect(deckOf(s1.view)!.index).toBe(0);
  });

  it('ignores decide when not sweeping', () => {
    const s = reducer(start(), { type: 'decide', decision: 'keep' });
    expect(s.view.phase).toBe('idle');
  });
});

describe('review ↔ sweeping and delete flow', () => {
  it('toReview / toSweeping move between the deck views', () => {
    let s = sweeping(photos);
    s = reducer(s, { type: 'toReview' });
    expect(s.view.phase).toBe('review');
    s = reducer(s, { type: 'toSweeping' });
    expect(s.view.phase).toBe('sweeping');
  });

  it('selecting/deleting keep the deck, done drops it', () => {
    let s = sweeping(photos);
    s = reducer(s, { type: 'decide', decision: 'trash' }); // -> b
    s = reducer(s, { type: 'toReview' });
    s = reducer(s, { type: 'selecting', status: 'Selecting…' });
    expect(s.view.phase).toBe('selecting');
    expect(deckOf(s.view)).not.toBeNull();
    s = reducer(s, { type: 'deleting', status: 'Moving…' });
    expect(s.view.phase).toBe('deleting');
    s = reducer(s, { type: 'done', status: 'Moved 1 to bin.' });
    expect(s.view).toEqual({ phase: 'done', status: 'Moved 1 to bin.' });
  });
});

describe('navigation + reset', () => {
  it('urlTick resets to idle on a real navigation', () => {
    let s = sweeping(photos);
    s = reducer(s, { type: 'urlTick', href: 'u1' });
    expect(s.view.phase).toBe('idle');
    expect(s.href).toBe('u1');
  });

  it('urlTick does NOT reset (or advance href) while busy', () => {
    let s = sweeping(photos);
    s = reducer(s, { type: 'toReview' });
    s = reducer(s, { type: 'selecting', status: '…' }); // busy
    const busy = s;
    s = reducer(s, { type: 'urlTick', href: 'u1' });
    expect(s).toBe(busy); // unchanged reference — ignored, href left stale to re-catch later
  });

  it('urlTick preserves memory across the reset', () => {
    let s = sweeping(photos, ['x']);
    s = reducer(s, { type: 'urlTick', href: 'u2' });
    expect(s.view.phase).toBe('idle');
    expect([...s.baseSeen]).toEqual(['x']);
  });

  it('reset returns to idle keeping memory', () => {
    let s = sweeping(photos, ['x']);
    s = reducer(s, { type: 'reset' });
    expect(s.view.phase).toBe('idle');
    expect([...s.baseSeen]).toEqual(['x']);
  });
});

describe('deck selectors', () => {
  it('currentPhoto / trashIds / deckStats', () => {
    let s = sweeping(photos);
    s = reducer(s, { type: 'decide', decision: 'trash' });
    s = reducer(s, { type: 'decide', decision: 'keep' });
    const deck = deckOf(s.view)!;
    expect(currentPhoto(deck)?.id).toBe('c');
    expect(trashIds(deck)).toEqual(['a']);
    expect(deckStats(deck)).toMatchObject({ total: 3, kept: 1, trashed: 1, remaining: 1 });
  });
});
