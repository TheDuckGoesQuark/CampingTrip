# Workout Tracker

A PWA for tracking workouts, served at [workout.jordanscamp.site](https://workout.jordanscamp.site). Designed for offline-first use — log workouts without connectivity and sync when back online.

**Status**: Phase 2 (core workout flow). Set-by-set logging, ladder progressions, weekly plan scheduling, and offline sync are all working. See `docs/planning/TODO.md` for remaining items.

## Running locally

```bash
pnpm --filter workout dev       # frontend on localhost:5174
cd backend && docker compose up  # backend + postgres
```

## Tech stack

- React + TypeScript + Vite
- Mantine — component library (dark theme, orange accent)
- Redux Toolkit + RTK Query — state management and API caching, code-generated from OpenAPI schema
- redux-persist + IndexedDB — offline state persistence
- vite-plugin-pwa — service worker generation with workbox runtime caching
- React Router — client-side routing
- @xyflow/react — ladder tech-tree visualisation

## Key concepts

**Exercises** — a movement (e.g. "Pull-up", "Running"). Owned per user, seeded from defaults on first login.

**Ladders** — progression paths modelled as tech trees (Civ 5 style). Each ladder contains nodes at increasing levels, with optional prerequisites enabling branching. A ladder's display name is derived from its highest-level node's exercise — there's no separate name field.

**Criteria** — rules attached to ladder nodes that must all pass before the node is achieved. Four types:
- `min_reps_sets` — N sets of M reps in a single session
- `min_weight` — any set at or above a target weight
- `sustained_sessions` — hit a rep target across N separate sessions
- `min_duration` — hold for at least N seconds

**Weekly plans** — templates mapping exercises or ladders to days of the week. One active plan per user. When a slot references a ladder, the session generator auto-picks the current progression level.

**Sessions** — a single workout instance (planned → in_progress → completed/skipped). Generated from the active weekly plan via `POST /api/workout/sessions/generate/`. Completing a session (`POST /api/workout/sessions/{id}/complete/`) triggers automatic ladder progression evaluation.

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Dashboard | Today's workout, stats grid, quick-start |
| `/workout` | Log Workout | Set-by-set logging with rest timer countdown |
| `/workout/:id` | Log Workout | Resume/review a specific session |
| `/plan` | Weekly Plan | CRUD editor for weekly templates (day × exercise/ladder slots) |
| `/ladders` | Ladders | List and create progression ladders |
| `/ladders/:id` | Ladder Detail | Tech-tree visualisation with node/criteria management |
| `/exercises` | Exercises | Exercise library (stub) |
| `/history` | History | Paginated session list with status badges |

Login is handled via Google OAuth — unauthenticated users see the login page instead of the app shell.

## Backend

Django app at `backend/apps/workout/`. All endpoints live under `/api/workout/`.

**Models**: WorkoutUser, Exercise, Ladder, LadderNode, Criterion, UserNodeProgress, WeeklyPlan, PlanSlot, WorkoutSession, SessionExercise, ExerciseSet.

**Key endpoints**:
- `POST /api/workout/sessions/generate/` — create a session from the active weekly plan for a given date
- `POST /api/workout/sessions/{id}/complete/` — mark completed + evaluate ladder progression
- `GET /api/workout/dashboard/` — aggregate view (today's plan, session status, stats)
- Standard CRUD on exercises, ladders, ladder-nodes, plans, sessions

**Progression engine** (`progression.py`): when a session is completed, each exercise linked to a ladder node has its criteria evaluated against the user's full history of completed sets. If all criteria pass, the node is marked as achieved.

**Seed data**: `python manage.py seed_default_ladders` populates 5 ladders (Pull, Chin-up, Push, Row, Carry) and 4 standalone exercises from a defaults user. Data is copied to each new user on first login via a Django signal.

## Offline strategy

The app persists the entire Redux store to IndexedDB via redux-persist. When a mutation fails due to network error, custom middleware queues it in IndexedDB and replays queued mutations in order when connectivity returns. A `SyncStatus` component in the app header shows offline/pending state.

The service worker (vite-plugin-pwa) precaches the app shell and uses a NetworkFirst strategy for API calls, falling back to cached responses when offline.

## Directory structure

```
src/
├── api/           # RTK Query base config + generated API hooks
├── design-system/ # Mantine theme and component library
├── hooks/         # useOfflineSync and other custom hooks
├── pages/         # Route-level page components
├── store/         # Redux store, auth slice, offline middleware
├── App.tsx        # Shell with routing, bottom nav, sync status
└── main.tsx       # Entry point with providers
```
