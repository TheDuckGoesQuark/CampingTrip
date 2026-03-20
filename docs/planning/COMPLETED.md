# Completed Work

History of what's been built, key decisions made, and what was deferred along the way.

---

## Workout tracker — guided workout UX: progress bar, postpone, dashboard charts

**Date**: 2026-03-20

**What was done**:

Frontend — Guided Workout (`GuidedWorkout.tsx`):
- **Progress bar**: workout-spanning progress indicator at top of guided flow showing percentage complete, current exercise label, and "Next: {exercise}" preview. Tracks warm-ups done + sets completed across all exercises.
- **Postpone button**: "Postpone — someone's using this" button on exercise screen. Swaps current exercise with the next one in the queue (not move-to-end). Only shown when there's a next exercise available. Resets set index on swap.

Frontend — Dashboard (`Dashboard.tsx`):
- Replaced boring stat cards with two progress charts using `@mantine/charts` (Recharts wrapper)
- **Session Volume bar chart**: orange bars showing total weight moved per session (reps x kg)
- **Weight Progression line chart**: multi-series line chart with per-exercise color coding, exercise selector dropdown, monotone curves
- `formatDate` helper for readable date labels (e.g. "20 Mar")
- Fallback message when no chart data yet

Backend — Dashboard charts endpoint (`views.py`):
- Added `GET /api/workout/dashboard/charts/` action on `DashboardView`
- `volume_per_session`: sum of (reps * weight) for completed working sets per session
- `weight_per_exercise`: max working weight per exercise per completed session
- OpenAPI schema regenerated, RTK Query hooks regenerated (`useWorkoutDashboardChartsRetrieveQuery`)

Infrastructure:
- Added `@mantine/charts` and `recharts@2` dependencies
- Imported `@mantine/charts/styles.css` in `main.tsx`
- Fixed stale RTK Query cache bug: removed `baseApi.reducerPath` from redux-persist whitelist (API cache was persisted in IndexedDB, causing new endpoints to get stuck in pending state)

**Key decisions**:
- Postpone swaps with next exercise (not move-to-end) — simpler, predictable behavior per user preference
- Charts use `@mantine/charts` (Mantine's Recharts wrapper) for consistency with design system
- API cache no longer persisted in IndexedDB — it refetches on mount anyway, and stale persisted state was causing new query endpoints to break
- Volume chart uses bar chart (good for comparing days), weight progression uses line chart (good for seeing trends/plateaus)

**Deferred**:
- Dashboard date range filtering → Phase 4
- Better handling of multiple sessions on the same date → Phase 4

---

## Workout tracker — guided workout flow with tailored warm-ups

**Date**: 2026-03-20

**What was done**:

Backend:
- Added `MuscleGroup` model (9 groups: lats, biceps, chest, triceps, shoulders, forearms, core, legs, general)
- Added `WarmUpExercise` model with M2M to `MuscleGroup` and `duration_seconds` field
- Added `muscle_groups` M2M field to `Exercise` model
- Added `is_warmup` and `warmup_duration_seconds` fields to `SessionExercise`
- Created `warmups.py` — warm-up selection algorithm: collects muscle groups from today's exercises, queries `WarmUpExercise` records targeting those groups, annotates by coverage count, returns up to 5
- Updated session `generate` action to call `select_warmups()` and insert warm-up `SessionExercise` records before main exercises
- Updated `complete` action to filter `is_warmup=False` for progression evaluation
- Seeded 12 warm-up exercises (Arm Circles, Shoulder Dislocates, Dead Hang, Scapular Pull-ups, Cat-Cow Stretch, Inchworms, Downward Dog, Wrist Circles, Push-up Plus, Leg Swings, Hip Circles, Light Jogging) with muscle group mappings
- Assigned muscle groups to all existing seeded exercises
- Updated `copy_defaults_to_user()` to copy muscle group assignments

Frontend:
- **Audio module** (`audio/audioContext.ts`, `audio/sounds.ts`) — Web Audio API singleton with 4 sound functions: `playCountdownBeep` (880Hz), `playGoSound` (880→1320Hz ascending), `playTimerWarning` (660Hz gentle), `playCompleteSound` (two-tone chime)
- **Timer hook** (`hooks/useTimer.ts`) — countdown timer with audio integration, plays warning beep in last 5 seconds, returns `{ remaining, isActive, progress, start, pause, skip }`
- **GuidedWorkout page** (`pages/GuidedWorkout.tsx`) — full-screen overlay at `/workout/:id/guided` with state machine via `useReducer`:
  - **Countdown phase**: 3, 2, 1, GO! with audio beeps
  - **Warm-up phase**: exercise name + RingProgress timer, auto-transitions between warm-ups, skip button
  - **Exercise phase**: set-by-set logging with typed inputs (reps/weight, reps only, duration, distance), type selector, "Log Set" saves via PATCH
  - **Rest phase**: RingProgress countdown with "Skip Rest" button, shows next exercise name
  - **Complete phase**: summary with completion chime
- Dashboard `handleStartWorkout` now navigates to `/workout/:id/guided`
- "Exit to Log View" button on guided flow navigates to `/workout/:id` (unguided LogWorkout)
- Both modes available: guided interactive mode for live workouts, log mode for editing data after the fact

**Key decisions**:
- Muscle groups modelled as separate model (not enum) for extensibility
- Warm-up selection uses annotation/ordering rather than manual scoring — leverages Django ORM for efficient coverage-based ranking
- Guided workout uses `useReducer` for phase transitions + `useState` for exercise/set indices — reducer handles phase logic, local state handles mutable exercise data
- Audio uses Web Audio API oscillators (no audio files) for small bundle size and instant playback
- GuidedWorkout is a fixed-position overlay (zIndex 1000) that covers the AppShell, rather than a separate route layout

**Deferred**:
- Exercise demo videos/images in guided workout screens → Phase 4
- Warm-up duration customisation per user → Future

---

## Workout tracker — prefilled sets, warm-up sets within exercises, working weight onboarding

**Date**: 2026-03-20

**What was done**:

Backend:
- Added `warmup_sets_count` and `warmup_start_pct` fields to `LadderNode` — configures how many warm-up sets before working sets and the starting weight percentage
- Added `working_weight` (DecimalField) to `UserNodeProgress` — tracks the user's current working weight for weighted exercises
- Added `is_warmup_set` (BooleanField) to `ExerciseSet` — distinguishes warm-up sets from working sets
- Created `set_generation.py` — generates prefilled ExerciseSet records during session generation:
  - Extracts target reps/sets from ladder criteria
  - Generates warm-up sets with exponential weight curve (`start_pct * (end_pct/start_pct)^(i/(n-1))`) and descending rep curve (~1.8x working reps down to working reps)
  - Rounds weights to nearest 2.5kg with 2.5kg minimum
  - Generates working sets with prefilled reps and working weight
- Updated session `generate` action to call `generate_sets_for_exercise()` for each main exercise
- Updated `complete` action to track max weight from completed working sets and update `UserNodeProgress.working_weight`
- Updated progression engine to exclude warm-up sets (`is_warmup_set=False` filter)
- Fixed session update serializer to preserve `is_warmup` and `warmup_duration_seconds` on PATCH — matches existing exercises by (exercise_id, order) key instead of deleting and recreating
- Seed data: weighted exercises (Weighted Pull-ups, Weighted Chin-ups, Weighted Dips, Weighted Rows) get 2-3 warm-up sets; bodyweight exercises get 0

Frontend:
- GuidedWorkout: warm-up sets show "Warm-up Set N" badge (gray) instead of working set counter; type selector hidden for warm-up sets; `is_warmup_set` propagated in all save/complete payloads
- Ladder detail page: added NumberInput for "Working wt" (kg) on each node card, saves on blur via create/patch UserNodeProgress

**Key decisions**:
- Warm-up set configuration lives on LadderNode (not a separate model) — simple, per-exercise control
- Exponential weight curve (not linear) gives more time at lighter weights, matching standard gym warm-up practice
- Working weight is set during onboarding on ladder detail page, then auto-updated from max logged weight after session completion
- Session update serializer matches exercises by (exercise_id, order) composite key to preserve server-generated read-only fields

**Deferred**:
- Full onboarding flow for initial working weight → Future
- Warm-up set reps curve customisation → Future

---

## Digital Twins — interactive scheduling simulator

**Date**: 2026-03-19

**What was done**:

Simulation engine (`simulation.ts`):
- Pure headless tick-based simulation: 1 tick = 1 minute, 1440 ticks/day
- Task generation with per-queue configurable distributions (size 1-180min, priority 1-5) using Box-Muller transform
- Selector algorithms: round-robin and priority-based
- Executor policies: run-to-completion and time-boxed with configurable cycle length + per-project allocation
- Interruption system: configurable frequency (0-24/day) and cost distribution, cooldown lockout
- Context switching cost: configurable warmup ticks before productive work begins
- Efficiency parameter: ticks of real time per tick of work (1-4×)
- Progress tracking on tasks: preempted tasks retain progress when returned to queue
- Rich metrics snapshot per tick: queue depths, executor state, throughput, context switching, interruption status, oldest task age per queue
- `resampleQueues()` with z-score rescaling: proportionally adjusts task properties when distributions change, preserving relative positions

React visual layer:
- `SimulatorPanel.tsx` — full pipeline visualization: queues → allocation bar → selector → executor → done area
- `TaskChip` — sized by duration (44-120px), star ratings for priority, progress fill (left-to-right color fill as work completes)
- `ExecutorDisplay` — 4 states: working (chip filling up), context switching (orange warmup), interrupted (red countdown), idle
- `DoneArea` — stacked bar showing proportion by project, recently completed chips with glow animation
- `QueueRow` — queue box with overflow count, inline DistributionEditor controls for task size and priority
- `DistributionEditor` — interactive canvas bell curve, drag horizontal=mean, vertical=spread
- `AllocationBar` — vertical stacked bar with draggable segment boundaries for time-boxed allocation
- `useSimulation` hook — play/pause/step/reset/speed, refs for stable interval callbacks, live rescaling on distribution changes
- 7 preset configurations: Balanced day, Open office chaos, Deep work, Structured time-boxing, Fire-fighting day, One big project, Slow & steady

MetricsPanel — 6 canvas charts with axes, gridlines, legends:
- Queue depth per project
- Backlog vs completed (combined)
- Throughput rate (rolling 30-min average, tasks/hr)
- Executor utilisation (rolling % working, interrupted, switching)
- Actual vs target allocation (solid = actual, dashed = target per project)
- Oldest task age per queue

**Key decisions**:
- Pure JS simulation engine with no React dependency — can run headless for batch experiments
- Z-score rescaling instead of random resampling: changing a distribution slider proportionally rescales existing tasks rather than re-rolling random values
- Progress stored on SimTask (not just ExecutorSlot) so preempted tasks show partial fill in queues
- Canvas-based charts with niceStep axis algorithm, rolling averages for smooth throughput/utilisation curves
- CSS border task chips instead of rough.js SVG (rough.js unreliable at small sizes)
- Grid layout with conditional columns (allocation bar only in time-boxed mode)
- Metrics panel scrollable independently with minHeight per chart

**Deferred**:
- Scroll-driven animation engine for storytelling (Phase 1 in plan file)
- Wait time and per-project throughput breakdown charts
- Scrollytelling narrative content

---

## Digital Twins — project scaffolding & scrollytelling framework

**Date**: 2026-03-18

**What was done**:
- Created `apps/digitaltwins/` as a new frontend-only app (Vite + React + Mantine + Framer Motion)
- Set up app shell with BrowserRouter, Mantine dark theme, minimal header
- Built scrollytelling framework: `useScrollyProgress` hook (Intersection Observer), `ScrollySection`, `ScrollyLayout` components
- Wired up placeholder scheduling post with 7 narrative steps and sticky visualization slot
- Home page with blog post index card
- Added root workspace scripts (dev/build/test:digitaltwins)
- Infrastructure: Route53 DNS record, Caddyfile server block, EC2 user_data template, deploy workflow (build + artifact + SSM extract)
- Updated README with Digital Twins in the apps table

**Key decisions**:
- No external scrollytelling library — custom ~30-line hook using Intersection Observer with rootMargin midpoint trigger
- No PWA, Redux, or backend API — frontend-only, simpler than workout app
- Framer Motion for queue animations (to be built)
- Scrollytelling layout: sticky viz fills viewport, narrative sections scroll over with semi-transparent dark cards

**Deferred**:
- Simulation engine (algorithms, task generator, playback) — to be built hands-on
- Narrative content and wording — to be crafted manually
- Interactive controls and metrics panel

---

## Workout tracker — data model & offline sync design (Phase 1 foundation)

**Date**: 2026-03-16

**What was done**:
- Designed and implemented 11 Django models: WorkoutUser, Exercise, Ladder, LadderNode, Criterion, UserNodeProgress, WeeklyPlan, PlanSlot, WorkoutSession, SessionExercise, ExerciseSet
- Created DRF serializers with nested creates (sessions include exercises + sets, plans include slots)
- Created DRF viewsets for all models + Dashboard aggregate view
- Wired URLs under `/api/workout/`
- Added Google OAuth provider config (allauth + `SOCIALACCOUNT_PROVIDERS`)
- Set up Mantine + Storybook design system with dark theme (#0a0612 / #ffb347)
- Set up Redux + RTK Query with OpenAPI codegen pipeline (same pattern as catmaps)
- Set up redux-persist with IndexedDB adapter for offline data persistence
- Built nav shell with bottom navigation and updated routes
- Created `Makefile` for schema generation + API codegen
- Created `docs/planning/design-decisions.md` documenting architecture choices

**Key decisions** (see `docs/planning/design-decisions.md` for full rationale):
- React PWA over React Native
- Mantine + Storybook over Tailwind
- Redux/RTKQ + codegen over Zustand
- redux-persist + IndexedDB for offline (not Dexie)
- WorkoutUser model isolating workout domain from auth
- Typed JSON fields for flexible criteria and exercise set data
- Ladders named by highest exercise (no name field)
- No denormalization — compute from session logs

**Deferred**:
- Equipment/muscle group tracking on exercises → Backlog
- Strava integration → Backlog
- Default ladder seeding from Notion → Phase 3
- Offline mutation queue middleware → Phase 2
- Batch sync endpoint → Phase 2

---

## Workout tracker — core workout flow (Phase 2)

**Date**: 2026-03-17

**What was done**:

Backend:
- Added `POST /api/workout/sessions/generate/` — generates a workout session from the user's active weekly plan for a given date
- `resolve_ladder_exercise()` picks the current exercise from a ladder based on user progress (first unachieved node, or highest if all achieved)
- Enhanced Dashboard endpoint with `today_session` and `today_plan_exercises` fields
- Regenerated OpenAPI schema with new endpoints
- 5 new tests: generate session from plan, from ladder with progression, no plan, no exercises today, dashboard today plan

Frontend:
- **Weekly Plan editor** — full CRUD: create/edit plans with per-day exercise slots. Supports both direct exercise and ladder assignments. Full-screen modal editor with searchable dropdowns.
- **Dashboard** — shows today's planned exercises (from active weekly plan), quick-start workout button, generates session from plan or continues existing one. Stats grid (total sessions, completed, ladders, achievements).
- **Active Workout UI** — set-by-set logging with typed data inputs (reps+weight, reps only, duration, distance). Rest timer with countdown ring. Per-exercise progress bars. Save/Finish controls. Auto-copies last set values when adding new sets.
- **History page** — paginated session list with status badges, tap to review a session.
- **Offline mutation queue** — Redux middleware catches FETCH_ERROR rejections, queues failed mutations in IndexedDB, replays in order when back online. Online/offline detection with auto-replay.
- **Sync status bar** — shows offline badge and pending mutation count in the app shell.
- Updated router with `/workout/:id` route for session-specific workout view.
- Bottom nav active state now matches prefix routes (e.g. `/workout/123` highlights Workout tab).

**Key decisions**:
- Session generation is a POST action on the sessions viewset, not a separate endpoint
- Offline queue uses a separate IndexedDB store from redux-persist to avoid coupling
- Rest timer is per-set (starts automatically after logging a set), with skip option
- Exercise type (reps_weight, duration, etc.) is set per-exercise, not per-set — all sets in an exercise use the same type
- Dashboard response is cast from the codegen array type since inline_serializer produces a ViewSet list action

**Deferred**:
- Batch sync endpoint (`POST /api/workout/sync/`) → Phase 2 remaining
- Rest timer sounds/vibration → Phase 2 remaining
- End-to-end offline workflow testing → Phase 2 remaining

---

## Workout tracker — ladders & progression (Phase 3)

**Date**: 2026-03-17

**What was done**:

Backend:
- Created `progression.py` — criterion evaluation engine that checks session logs against ladder node criteria
  - `evaluate_criterion()` dispatches to type-specific checkers: `_check_min_reps_sets`, `_check_min_weight`, `_check_sustained_sessions`, `_check_min_duration`
  - `check_node_progress()` evaluates all criteria on a node, returns achievement status
  - `update_user_progress()` persists achievement to `UserNodeProgress` when all criteria met
- Added `GET /api/workout/ladder-nodes/{id}/check-progress/` — check progression status for a single node
- Added `GET /api/workout/ladders/{id}/progress/` — ladder-wide progress for all nodes
- Added `POST /api/workout/sessions/{id}/complete/` — completes session and auto-evaluates ladder progression for any ladder-linked exercises
- 12 new tests: criterion evaluation (min_reps_sets met/not met, min_weight, sustained_sessions met/not met, min_duration, node progress all met, update_user_progress marks achieved, incomplete session ignored), API tests (check-progress endpoint, ladder progress endpoint, complete session evaluates progression)

Frontend:
- **Ladder list page** — CRUD for ladders with create modal, delete button, click-to-detail navigation. Shows node count badges.
- **Ladder detail page** — tech tree visualization using @xyflow/react with:
  - Custom `LadderTreeNode` component: green (achieved), orange/pulsing (current level), grey (locked)
  - Automatic layout by level grouping with horizontal centering
  - Animated edges for current level, implicit level-based edges when no explicit prerequisites
  - Criteria progress display per node
- **Node management** — add/delete nodes with exercise picker, level selector, prerequisite selection
- **Criterion management** — add criteria to nodes with type-specific param forms (sets+reps, weight, sessions+reps, seconds)
- **Session completion** — "Finish" button now calls the `complete` endpoint which evaluates progression, instead of just patching status
- Added `/ladders/:id` route for ladder detail view
- Regenerated OpenAPI schema and RTKQ hooks with all new endpoints

**Key decisions**:
- Progression evaluation only counts sets from completed sessions (in_progress sessions are ignored)
- The `complete` endpoint both marks the session completed AND evaluates progression in one call, avoiding race conditions
- Tech tree uses implicit level-based edges when no explicit prerequisites are set, giving a sensible default visualization
- Criteria forms are type-specific: each criterion type has its own parameter inputs matching the JSON schema

**Deferred**:
- Advancement notifications (toast/badge when achieved) → Phase 4

---

## Workout tracker — default ladder seeding (Phase 3 completion)

**Date**: 2026-03-17

**What was done**:

Backend:
- Created `seed_default_ladders` management command that seeds all ladder/exercise/plan data from Jordan's Notion
  - 5 ladders: Pull (7 nodes), Chin-up (4 nodes), Push (7 nodes), Row (3 nodes), Carry (5 nodes)
  - 4 standalone exercises: Running, Yoga, Swimming, Parkrun 5k
  - Default weekly plan matching Notion schedule (Mon-Sun with pull/push/run/swim/yoga slots)
  - Each node has a criterion (min_reps_sets or min_duration) matching the Notion "Target" column
  - Prerequisites are linear within each ladder (level 1 → 2 → 3 etc.)
  - Uses a special `_workout_defaults` user to own canonical seed data
  - Idempotent (skips if data exists), supports `--clear` flag for re-seeding
- Extended `create_workout_user` signal to call `copy_defaults_to_user()` on new user creation
  - Copies all exercises, ladders (with nodes, criteria, prerequisites), and weekly plan
  - Each user gets independent copies they can freely edit/delete
- 9 new tests (40 total): seed creates correct counts, weekly plan, idempotency, clear+reseed, linear prerequisites, copy to user, independence check, no-seed noop, signal integration

**Key decisions**:
- Seed data owned by a dedicated inactive user (`_workout_defaults`), not tied to any real account
- Copy happens in the existing `post_save` signal — no separate signal needed
- Carry ladder uses `min_duration` criterion (target is time-based: 4x30m, 4x20m) while all others use `min_reps_sets`
- Weekly plan slots reference ladders where applicable (auto-pick current level) and standalone exercises for cardio/yoga
