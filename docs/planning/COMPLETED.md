# Completed Work

History of what's been built, key decisions made, and what was deferred along the way.

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
