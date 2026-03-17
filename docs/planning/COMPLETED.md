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
