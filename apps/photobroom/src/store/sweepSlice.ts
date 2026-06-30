import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Decision, ScrapedPhoto } from '../types';

interface SweepState {
  /** Photos collected from the Google Photos grid. */
  photos: ScrapedPhoto[];
  /** User decisions keyed by photo ID. */
  decisions: Record<string, Decision>;
  /** Index of the current card in the review deck. */
  currentIndex: number;
}

const initialState: SweepState = {
  photos: [],
  decisions: {},
  currentIndex: 0,
};

export const sweepSlice = createSlice({
  name: 'sweep',
  initialState,
  reducers: {
    /** Begin a new sweep — clear any previous photos/decisions. */
    fetchStart(state) {
      state.photos = [];
      state.decisions = {};
      state.currentIndex = 0;
    },

    /** Photos collected — populate the deck. */
    fetchSuccess(state, action: PayloadAction<ScrapedPhoto[]>) {
      state.photos = action.payload;
    },

    /** Record a keep/trash/skip decision for a photo and advance. */
    decide(state, action: PayloadAction<{ id: string; decision: Decision }>) {
      state.decisions[action.payload.id] = action.payload.decision;
      state.currentIndex = Math.min(state.currentIndex + 1, state.photos.length);
    },

    /** Undo the last decision (go back one card). */
    undo(state) {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
        const photo = state.photos[state.currentIndex];
        if (photo) delete state.decisions[photo.id];
      }
    },

    /** Reset everything for a new sweep. */
    reset() {
      return initialState;
    },
  },
});

export const sweepActions = sweepSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectCurrentPhoto = (state: { sweep: SweepState }) => {
  const { photos, currentIndex } = state.sweep;
  return photos[currentIndex] ?? null;
};

export const selectIsComplete = (state: { sweep: SweepState }) =>
  state.sweep.currentIndex >= state.sweep.photos.length && state.sweep.photos.length > 0;

export const selectTrashIds = (state: { sweep: SweepState }) =>
  Object.entries(state.sweep.decisions)
    .filter(([, d]) => d === 'trash')
    .map(([id]) => id);

export const selectStats = (state: { sweep: SweepState }) => {
  const decisions = Object.values(state.sweep.decisions);
  return {
    total: state.sweep.photos.length,
    kept: decisions.filter((d) => d === 'keep').length,
    trashed: decisions.filter((d) => d === 'trash').length,
    skipped: decisions.filter((d) => d === 'skip').length,
    remaining: state.sweep.photos.length - state.sweep.currentIndex,
  };
};
