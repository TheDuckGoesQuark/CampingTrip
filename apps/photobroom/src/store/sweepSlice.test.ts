import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import {
  sweepSlice,
  sweepActions,
  selectCurrentPhoto,
  selectIsComplete,
  selectTrashIds,
  selectStats,
} from './sweepSlice';
import type { ScrapedPhoto } from '../types';

function createStore(preloaded?: Partial<ReturnType<typeof sweepSlice.getInitialState>>) {
  return configureStore({
    reducer: { sweep: sweepSlice.reducer },
    preloadedState: preloaded
      ? { sweep: { ...sweepSlice.getInitialState(), ...preloaded } }
      : undefined,
  });
}

const mockPhotos: ScrapedPhoto[] = [
  { id: 'a', thumbnailUrl: 'https://example.com/a.jpg', ariaLabel: 'Photo A' },
  { id: 'b', thumbnailUrl: 'https://example.com/b.jpg', ariaLabel: 'Photo B' },
  { id: 'c', thumbnailUrl: 'https://example.com/c.jpg', ariaLabel: 'Photo C' },
];

describe('sweepSlice', () => {
  describe('fetchStart / fetchSuccess', () => {
    it('clears previous data on start', () => {
      const store = createStore({ photos: mockPhotos, currentIndex: 2 });
      store.dispatch(sweepActions.fetchStart());
      const state = store.getState().sweep;
      expect(state.photos).toHaveLength(0);
      expect(state.decisions).toEqual({});
      expect(state.currentIndex).toBe(0);
    });

    it('stores photos on success', () => {
      const store = createStore();
      store.dispatch(sweepActions.fetchStart());
      store.dispatch(sweepActions.fetchSuccess(mockPhotos));
      expect(store.getState().sweep.photos).toHaveLength(3);
    });
  });

  describe('decide', () => {
    it('records a decision and advances the index', () => {
      const store = createStore({ photos: mockPhotos });
      store.dispatch(sweepActions.decide({ id: 'a', decision: 'keep' }));
      const state = store.getState().sweep;
      expect(state.decisions['a']).toBe('keep');
      expect(state.currentIndex).toBe(1);
    });

    it('does not advance past the end', () => {
      const store = createStore({ photos: mockPhotos, currentIndex: 2 });
      store.dispatch(sweepActions.decide({ id: 'c', decision: 'trash' }));
      expect(store.getState().sweep.currentIndex).toBe(3);
      store.dispatch(sweepActions.decide({ id: 'x', decision: 'keep' }));
      expect(store.getState().sweep.currentIndex).toBe(3);
    });
  });

  describe('undo', () => {
    it('goes back one card and removes that decision only', () => {
      const store = createStore({ photos: mockPhotos });
      store.dispatch(sweepActions.decide({ id: 'a', decision: 'trash' }));
      store.dispatch(sweepActions.decide({ id: 'b', decision: 'keep' }));
      expect(store.getState().sweep.currentIndex).toBe(2);

      store.dispatch(sweepActions.undo());
      const state = store.getState().sweep;
      expect(state.currentIndex).toBe(1);
      expect(state.decisions['b']).toBeUndefined();
      expect(state.decisions['a']).toBe('trash');
    });

    it('does nothing at index 0', () => {
      const store = createStore({ photos: mockPhotos });
      store.dispatch(sweepActions.undo());
      expect(store.getState().sweep.currentIndex).toBe(0);
    });
  });

  describe('reset', () => {
    it('returns to initial state', () => {
      const store = createStore({ photos: mockPhotos, decisions: { a: 'keep' }, currentIndex: 2 });
      store.dispatch(sweepActions.reset());
      const state = store.getState().sweep;
      expect(state.photos).toHaveLength(0);
      expect(state.decisions).toEqual({});
      expect(state.currentIndex).toBe(0);
    });
  });

  describe('selectors', () => {
    const withState = (over: Partial<ReturnType<typeof sweepSlice.getInitialState>>) => ({
      sweep: { ...sweepSlice.getInitialState(), ...over },
    });

    it('selectCurrentPhoto returns the photo at currentIndex', () => {
      expect(selectCurrentPhoto(withState({ photos: mockPhotos, currentIndex: 1 }))?.id).toBe('b');
    });

    it('selectIsComplete is true when all photos are reviewed', () => {
      expect(selectIsComplete(withState({ photos: mockPhotos, currentIndex: 3 }))).toBe(true);
    });

    it('selectIsComplete is false when photos remain', () => {
      expect(selectIsComplete(withState({ photos: mockPhotos, currentIndex: 1 }))).toBe(false);
    });

    it('selectTrashIds returns only trashed ids in order', () => {
      const state = withState({
        photos: mockPhotos,
        decisions: { a: 'trash', b: 'keep', c: 'trash' },
      });
      expect(selectTrashIds(state)).toEqual(['a', 'c']);
    });

    it('selectStats computes counts', () => {
      const stats = selectStats(
        withState({
          photos: mockPhotos,
          decisions: { a: 'trash', b: 'keep' },
          currentIndex: 2,
        })
      );
      expect(stats).toMatchObject({ total: 3, kept: 1, trashed: 1, skipped: 0, remaining: 1 });
    });
  });
});
