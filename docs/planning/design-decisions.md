# Design Decisions

Architecture decisions for the workout tracker and why they were made.

---

## React PWA (not React Native)

**Decision**: Build as a React PWA with service worker caching.

**Why**: The primary use case is logging workouts at the gym with weak/no wifi. PWA gives offline support, add-to-homescreen, and full-screen mode without app store overhead. The scaffold was already in place with `vite-plugin-pwa`.

**Trade-off**: No access to native APIs (health kit, etc.). Acceptable — Strava integration is the planned bridge for that.

---

## Mantine + Storybook (not Tailwind)

**Decision**: Mantine component library with an isolated Storybook design system.

**Why**: Preference for component-library-driven development over utility classes. Components are themed and built in isolation (Storybook), then consumed by pages. Dark theme with orange accent (#0a0612 / #ffb347).

---

## Redux + RTK Query + OpenAPI Codegen (not Zustand)

**Decision**: Redux Toolkit with RTK Query, generated from the Django OpenAPI schema via `@rtk-query/codegen-openapi`. Same pattern as the catmaps project.

**Why**: Type-safe API hooks auto-generated from the backend schema. Single source of truth for API types. Familiar DX from catmaps. Zustand removed in favour of Redux for consistency.

**Pipeline**: `manage.py spectacular` → `schema.yml` → `@rtk-query/codegen-openapi` → `generated-api.ts`

**Isolation**: Each frontend app filters the schema to only its own endpoints via `filterEndpoints` in the codegen config. Workout app includes `/api/workout/*` and `/api/auth/*`.

---

## redux-persist + IndexedDB for Offline

**Decision**: Persist the entire Redux store (including RTKQ cache) to IndexedDB via `redux-persist` + `idb-keyval`.

**Why**: Cached API data survives app restarts. Offline mutations are queued and replayed on reconnect. The app behaves optimistically — UI updates immediately, sync happens in the background.

**Trade-off**: Chose this over Dexie.js to avoid managing two data stores. RTKQ cache IS the local data.

---

## WorkoutUser Model (not direct CampsiteUser FK)

**Decision**: A `WorkoutUser` model with OneToOne to `CampsiteUser`. All workout models FK to `WorkoutUser`.

**Why**: Isolates the workout domain from auth. If we add another app, it gets its own user profile model. Auto-created via Django signal on user creation.

---

## Flexible Data Shapes (Typed JSON)

**Decision**: `Criterion` and `ExerciseSet` use a `type` enum + `params`/`value` JSONField. The type determines the JSON schema.

**Why**: Different exercises produce different data (reps+weight, duration, distance). Different criteria evaluate differently (min reps, sustained sessions, min weight). A typed JSON approach is flexible without needing a model per data shape. Like form question types.

---

## Ladder Naming

**Decision**: Ladders have no `name` field. Display name is derived from the highest-level node's exercise name.

**Why**: Avoids name drift. The ladder IS its progression — naming it after the pinnacle exercise is always accurate.

---

## No Denormalization

**Decision**: Current bests, streak counts, etc. are computed from session logs, not stored.

**Why**: Single source of truth. No risk of derived data getting out of sync. Queries are slightly more expensive but data is always correct.
