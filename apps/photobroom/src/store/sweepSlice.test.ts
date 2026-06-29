import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import {
  sweepSlice,
  sweepActions,
  selectCurrentPhoto,
  selectNextPhoto,
  selectIsComplete,
  selectTrashIds,
  selectKeepIds,
  selectStats,
} from './sweepSlice';
import type { ScrapedPhoto } from '../types';

function createStore(preloaded?: Partial<ReturnType<typeof sweepSlice.getInitialState>>) {
  return configureStore({
    reducer: { sweep: sweepSlice.reducer },
    preloadedState: preloaded ? { sweep: { ...sweepSlice.getInitialState(), ...preloaded } } : undefined,
  });
}

const mockPhotos: ScrapedPhoto[] = [
  { id: 'a', thumbnailUrl: 'https://example.com/a.jpg', ariaLabel: 'Photo A' },
  { id: 'b', thumbnailUrl: 'https://example.com/b.jpg', ariaLabel: 'Photo B' },
  { id: 'c', thumbnailUrl: 'https://example.com/c.jpg', ariaLabel: 'Photo C' },
];

describe('sweepSlice', () => {
  describe('fetchStart / fetchSuccess / fetchError', () => {
    it('sets loading state and clears previous data', () => {
      const store = createStore({ photos: mockPhotos, currentIndex: 2 });
      store.dispatch(sweepActions.fetchStart('March 27'));

      const state = store.getState().sweep;
      expect(state.loading).toBe(true);
      expect(state.searchDate).toBe('March 27');
      expect(state.photos).toHaveLength(0);
      expect(state.currentIndex).toBe(0);
    });

    it('stores photos on success', () => {
      const store = createStore();
      store.dispatch(sweepActions.fetchStart('March 27'));
      store.dispatch(sweepActions.fetchSuccess(mockPhotos));

      const state = store.getState().sweep;
      expect(state.loading).toBe(false);
      expect(state.photos).toHaveLength(3);
    });

    it('stores error on failure', () => {
      const store = createStore();
      store.dispatch(sweepActions.fetchStart('March 27'));
      store.dispatch(sweepActions.fetchError('Extension unreachable'));

      const state = store.getState().sweep;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Extension unreachable');
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

      // Already at the end — deciding again shouldn't crash
      store.dispatch(sweepActions.decide({ id: 'x', decision: 'keep' }));
      expect(store.getState().sweep.currentIndex).toBe(3);
    });
  });

  describe('undo', () => {
    it('goes back one card and removes the decision', () => {
      const store = createStore({ photos: mockPhotos });
      store.dispatch(sweepActions.decide({ id: 'a', decision: 'trash' }));
      store.dispatch(sweepActions.decide({ id: 'b', decision: 'keep' }));

      expect(store.getState().sweep.currentIndex).toBe(2);

      store.dispatch(sweepActions.undo());
      const state = store.getState().sweep;
      expect(state.currentIndex).toBe(1);
      expect(state.decisions['b']).toBeUndefined();
      expect(state.decisions['a']).toBe('trash'); // still there
    });

    it('does nothing at index 0', () => {
      const store = createStore({ photos: mockPhotos });
      store.dispatch(sweepActions.undo());
      expect(store.getState().sweep.currentIndex).toBe(0);
    });
  });

  describe('flipDecision', () => {
    it('flips trash to keep', () => {
      const store = createStore({
        photos: mockPhotos,
        decisions: { a: 'trash' },
      });
      store.dispatch(sweepActions.flipDecision('a'));
      expect(store.getState().sweep.decisions['a']).toBe('keep');
    });

    it('flips keep to trash', () => {
      const store = createStore({
        photos: mockPhotos,
        decisions: { a: 'keep' },
      });
      store.dispatch(sweepActions.flipDecision('a'));
      expect(store.getState().sweep.decisions['a']).toBe('trash');
    });

    it('does not flip skip', () => {
      const store = createStore({
        photos: mockPhotos,
        decisions: { a: 'skip' },
      });
      store.dispatch(sweepActions.flipDecision('a'));
      expect(store.getState().sweep.decisions['a']).toBe('skip');
    });
  });

  describe('delete flow', () => {
    it('tracks progress through deletion', () => {
      const store = createStore({
        photos: mockPhotos,
        decisions: { a: 'trash', b: 'trash', c: 'keep' },
      });

      store.dispatch(sweepActions.deleteStart());
      let state = store.getState().sweep;
      expect(state.deleting).toBe(true);
      expect(state.deleteProgress).toEqual({ done: 0, total: 2 });

      store.dispatch(sweepActions.deleteProgress({ id: 'a', success: true }));
      state = store.getState().sweep;
      expect(state.deleteProgress.done).toBe(1);
      expect(state.deleteResults).toHaveLength(1);

      store.dispatch(sweepActions.deleteProgress({ id: 'b', success: false, error: 'Button not found' }));
      store.dispatch(sweepActions.deleteComplete());
      state = store.getState().sweep;
      expect(state.deleting).toBe(false);
      expect(state.deleteResults).toHaveLength(2);
    });
  });

  describe('reset', () => {
    it('returns to initial state', () => {
      const store = createStore({
        photos: mockPhotos,
        decisions: { a: 'keep' },
        currentIndex: 2,
        searchDate: 'March 27',
      });
      store.dispatch(sweepActions.reset());
      const state = store.getState().sweep;
      expect(state.photos).toHaveLength(0);
      expect(state.decisions).toEqual({});
      expect(state.currentIndex).toBe(0);
    });
  });

  describe('selectors', () => {
    it('selectCurrentPhoto returns the photo at currentIndex', () => {
      const state = { sweep: { ...sweepSlice.getInitialState(), photos: mockPhotos, currentIndex: 1 } };
      expect(selectCurrentPhoto(state)?.id).toBe('b');
    });

    it('selectNextPhoto returns the next photo', () => {
      const state = { sweep: { ...sweepSlice.getInitialState(), photos: mockPhotos, currentIndex: 1 } };
      expect(selectNextPhoto(state)?.id).toBe('c');
    });

    it('selectIsComplete when all photos are swiped', () => {
      const state = { sweep: { ...sweepSlice.getInitialState(), photos: mockPhotos, currentIndex: 3 } };
      expect(selectIsComplete(state)).toBe(true);
    });

    it('selectIsComplete is false when photos remain', () => {
      const state = { sweep: { ...sweepSlice.getInitialState(), photos: mockPhotos, currentIndex: 1 } };
      expect(selectIsComplete(state)).toBe(false);
    });

    it('selectTrashIds and selectKeepIds', () => {
      const state = {
        sweep: {
          ...sweepSlice.getInitialState(),
          photos: mockPhotos,
          decisions: { a: 'trash' as const, b: 'keep' as const, c: 'trash' as const },
        },
      };
      expect(selectTrashIds(state)).toEqual(['a', 'c']);
      expect(selectKeepIds(state)).toEqual(['b']);
    });

    it('selectStats computes counts', () => {
      const state = {
        sweep: {
          ...sweepSlice.getInitialState(),
          photos: mockPhotos,
          decisions: { a: 'trash' as const, b: 'keep' as const },
          currentIndex: 2,
        },
      };
      const stats = selectStats(state);
      expect(stats.total).toBe(3);
      expect(stats.kept).toBe(1);
      expect(stats.trashed).toBe(1);
      expect(stats.remaining).toBe(1);
    });
  });
});
