/**
 * The PhotoBroom sweep as a pure state machine.
 *
 * `View` is a discriminated union keyed by `phase`, so each phase carries only
 * the data that's valid for it (no more "status" lingering on the review screen
 * or a half-populated deck on idle). Every transition — including "the deck is
 * exhausted, go to review" — happens here in the reducer, so the hook needs no
 * derived-state effects to keep phases in sync.
 *
 * IO (loading/saving memory, driving Google Photos) lives in the hook; this
 * module is pure and fully unit-tested.
 */
import type { Decision, ScrapedPhoto } from '../types';

export interface Deck {
  photos: ScrapedPhoto[];
  decisions: Record<string, Decision>;
  /** Index of the card under review. */
  index: number;
  /** How many collected photos were skipped as already-reviewed. */
  alreadyReviewed: number;
}

export type View =
  | { phase: 'idle' }
  | { phase: 'collecting'; status: string }
  | { phase: 'sweeping'; deck: Deck; dir: 1 | -1 }
  | { phase: 'review'; deck: Deck }
  | { phase: 'selecting'; deck: Deck; status: string }
  | { phase: 'deleting'; deck: Deck; status: string }
  | { phase: 'allseen'; collected: ScrapedPhoto[] }
  | { phase: 'done'; status: string }
  | { phase: 'error'; message: string };

export interface State {
  view: View;
  /** Photos reviewed on prior sweeps — used to filter the deck and count memory. */
  baseSeen: Set<string>;
  /** Last-observed page URL, for SPA-navigation resets. */
  href: string;
}

export type Action =
  | { type: 'collecting'; status: string }
  | { type: 'collected'; photos: ScrapedPhoto[] }
  | { type: 'sweepAll' } // "sweep them anyway" from the all-seen screen
  | { type: 'decide'; decision: Decision }
  | { type: 'undo' }
  | { type: 'toReview' }
  | { type: 'toSweeping' }
  | { type: 'selecting'; status: string }
  | { type: 'deleting'; status: string }
  | { type: 'done'; status: string }
  | { type: 'error'; message: string }
  | { type: 'reset' }
  | { type: 'seenLoaded'; baseSeen: Set<string> }
  | { type: 'urlTick'; href: string };

export const initialState: State = {
  view: { phase: 'idle' },
  baseSeen: new Set(),
  href: '',
};

const BUSY: ReadonlySet<View['phase']> = new Set(['collecting', 'selecting', 'deleting']);

const newDeck = (photos: ScrapedPhoto[], alreadyReviewed: number): Deck => ({
  photos,
  decisions: {},
  index: 0,
  alreadyReviewed,
});

/** The deck for phases that have one, else null. */
export function deckOf(view: View): Deck | null {
  return 'deck' in view ? view.deck : null;
}

export function currentPhoto(deck: Deck): ScrapedPhoto | null {
  return deck.photos[deck.index] ?? null;
}

export function trashIds(deck: Deck): string[] {
  return Object.entries(deck.decisions)
    .filter(([, d]) => d === 'trash')
    .map(([id]) => id);
}

export function deckStats(deck: Deck) {
  const decisions = Object.values(deck.decisions);
  return {
    total: deck.photos.length,
    reviewed: deck.index,
    kept: decisions.filter((d) => d === 'keep').length,
    trashed: decisions.filter((d) => d === 'trash').length,
    skipped: decisions.filter((d) => d === 'skip').length,
    remaining: deck.photos.length - deck.index,
  };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'seenLoaded':
      return { ...state, baseSeen: action.baseSeen };

    case 'collecting':
      return { ...state, view: { phase: 'collecting', status: action.status } };

    case 'collected': {
      const all = action.photos;
      if (all.length === 0) {
        return {
          ...state,
          view: { phase: 'error', message: 'No photos found on this page. Open a search/date first, then sweep.' },
        };
      }
      const fresh = all.filter((p) => !state.baseSeen.has(p.id));
      if (fresh.length === 0) {
        return { ...state, view: { phase: 'allseen', collected: all } };
      }
      return { ...state, view: { phase: 'sweeping', deck: newDeck(fresh, all.length - fresh.length), dir: 1 } };
    }

    case 'sweepAll':
      if (state.view.phase !== 'allseen') return state;
      return { ...state, view: { phase: 'sweeping', deck: newDeck(state.view.collected, 0), dir: 1 } };

    case 'decide': {
      if (state.view.phase !== 'sweeping') return state;
      const deck = state.view.deck;
      const cur = currentPhoto(deck);
      if (!cur) return state;
      const next: Deck = {
        ...deck,
        decisions: { ...deck.decisions, [cur.id]: action.decision },
        index: Math.min(deck.index + 1, deck.photos.length),
      };
      // The moment the deck is exhausted, move to review — no effect needed.
      return next.index >= next.photos.length
        ? { ...state, view: { phase: 'review', deck: next } }
        : { ...state, view: { phase: 'sweeping', deck: next, dir: 1 } };
    }

    case 'undo': {
      if (state.view.phase !== 'sweeping') return state;
      const deck = state.view.deck;
      if (deck.index === 0) return state;
      const index = deck.index - 1;
      const decisions = { ...deck.decisions };
      const photo = deck.photos[index];
      if (photo) delete decisions[photo.id];
      return { ...state, view: { phase: 'sweeping', deck: { ...deck, decisions, index }, dir: -1 } };
    }

    case 'toReview':
      if (state.view.phase !== 'sweeping') return state;
      return { ...state, view: { phase: 'review', deck: state.view.deck } };

    case 'toSweeping':
      if (state.view.phase !== 'review') return state;
      return { ...state, view: { phase: 'sweeping', deck: state.view.deck, dir: -1 } };

    case 'selecting': {
      const deck = deckOf(state.view);
      if (!deck) return state;
      return { ...state, view: { phase: 'selecting', deck, status: action.status } };
    }

    case 'deleting': {
      const deck = deckOf(state.view);
      if (!deck) return state;
      return { ...state, view: { phase: 'deleting', deck, status: action.status } };
    }

    case 'done':
      return { ...state, view: { phase: 'done', status: action.status } };

    case 'error':
      return { ...state, view: { phase: 'error', message: action.message } };

    case 'reset':
      return { ...state, view: { phase: 'idle' } };

    case 'urlTick': {
      if (action.href === state.href) return state;
      // Never interrupt in-flight automation; leave href stale so a genuine
      // navigation is still caught on the next tick once it finishes.
      if (BUSY.has(state.view.phase)) return state;
      return { ...state, href: action.href, view: { phase: 'idle' } };
    }

    default:
      return state;
  }
}
