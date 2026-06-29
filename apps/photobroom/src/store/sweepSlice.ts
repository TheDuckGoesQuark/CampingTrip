import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Decision, DeleteResult, ScrapedPhoto } from '../types';

interface SweepState {
  /** Photos fetched from the extension. */
  photos: ScrapedPhoto[];
  /** User decisions keyed by photo ID. */
  decisions: Record<string, Decision>;
  /** Index of the current card in the swipe deck. */
  currentIndex: number;
  /** Whether we're currently fetching photos from the extension. */
  loading: boolean;
  /** Whether we're currently deleting photos via the extension. */
  deleting: boolean;
  /** Progress of the deletion operation. */
  deleteProgress: { done: number; total: number };
  /** Results from the last deletion operation. */
  deleteResults: DeleteResult[];
  /** Error message, if any. */
  error: string | null;
  /** The date string that was searched. */
  searchDate: string | null;
}

const initialState: SweepState = {
  photos: [],
  decisions: {},
  currentIndex: 0,
  loading: false,
  deleting: false,
  deleteProgress: { done: 0, total: 0 },
  deleteResults: [],
  error: null,
  searchDate: null,
};

export const sweepSlice = createSlice({
  name: 'sweep',
  initialState,
  reducers: {
    /** Start loading photos for a date. */
    fetchStart(state, action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
      state.searchDate = action.payload;
      state.photos = [];
      state.decisions = {};
      state.currentIndex = 0;
      state.deleteResults = [];
    },

    /** Photos loaded successfully. */
    fetchSuccess(state, action: PayloadAction<ScrapedPhoto[]>) {
      state.loading = false;
      state.photos = action.payload;
    },

    /** Photo fetch failed. */
    fetchError(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    /** Record a keep/trash/skip decision for a photo and advance. */
    decide(
      state,
      action: PayloadAction<{ id: string; decision: Decision }>
    ) {
      state.decisions[action.payload.id] = action.payload.decision;
      state.currentIndex = Math.min(
        state.currentIndex + 1,
        state.photos.length
      );
    },

    /** Undo the last decision (go back one card). */
    undo(state) {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
        const photo = state.photos[state.currentIndex];
        if (photo) {
          delete state.decisions[photo.id];
        }
      }
    },

    /** Flip a decision in the review screen. */
    flipDecision(state, action: PayloadAction<string>) {
      const id = action.payload;
      const current = state.decisions[id];
      if (current === 'trash') {
        state.decisions[id] = 'keep';
      } else if (current === 'keep') {
        state.decisions[id] = 'trash';
      }
    },

    /** Start the deletion process. */
    deleteStart(state) {
      const trashCount = Object.values(state.decisions).filter(
        (d) => d === 'trash'
      ).length;
      state.deleting = true;
      state.deleteProgress = { done: 0, total: trashCount };
      state.deleteResults = [];
      state.error = null;
    },

    /** One photo was processed during deletion. */
    deleteProgress(state, action: PayloadAction<DeleteResult>) {
      state.deleteProgress.done += 1;
      state.deleteResults.push(action.payload);
    },

    /** Deletion process completed. */
    deleteComplete(state) {
      state.deleting = false;
    },

    /** Deletion failed. */
    deleteError(state, action: PayloadAction<string>) {
      state.deleting = false;
      state.error = action.payload;
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

export const selectNextPhoto = (state: { sweep: SweepState }) => {
  const { photos, currentIndex } = state.sweep;
  return photos[currentIndex + 1] ?? null;
};

export const selectIsComplete = (state: { sweep: SweepState }) =>
  state.sweep.currentIndex >= state.sweep.photos.length &&
  state.sweep.photos.length > 0;

export const selectTrashIds = (state: { sweep: SweepState }) =>
  Object.entries(state.sweep.decisions)
    .filter(([, d]) => d === 'trash')
    .map(([id]) => id);

export const selectKeepIds = (state: { sweep: SweepState }) =>
  Object.entries(state.sweep.decisions)
    .filter(([, d]) => d === 'keep')
    .map(([id]) => id);

export const selectStats = (state: { sweep: SweepState }) => {
  const decisions = Object.values(state.sweep.decisions);
  return {
    total: state.sweep.photos.length,
    kept: decisions.filter((d) => d === 'keep').length,
    trashed: decisions.filter((d) => d === 'trash').length,
    skipped: decisions.filter((d) => d === 'skip').length,
    remaining:
      state.sweep.photos.length - state.sweep.currentIndex,
  };
};
