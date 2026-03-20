# Workout Tracker — Data Flow

How data moves from user signup through the weekly workout cycle.

## Two Timescales

**Setup (once):** Signup → defaults copied → user has ladders, exercises, weekly plan

**Weekly cycle (repeats):** Generate session → complete session → progress updated → next generation uses updated state

---

## Signup → First Workout

```
User signs up
    │
    ▼
Signal creates WorkoutUser
    │
    ▼
copy_defaults_to_user()
    ├── Exercises (including warm-up exercises)
    ├── Ladders with Nodes + Criteria
    └── Default WeeklyPlan + PlanSlots

    (No UserNodeProgress yet — created on demand)
    (No working_weight yet — user sets it on ladder detail page, or it stays null)
```

## Session Generation (POST generate/)

```
Active WeeklyPlan
    │
    ▼
Filter PlanSlots by today's weekday
    │
    ▼
For each slot:
    ├── Slot has ladder? ──► resolve_ladder_exercise()
    │       │
    │       ▼
    │   Query UserNodeProgress.achieved for this ladder's nodes
    │       │
    │       ▼
    │   First unachieved node = current working level
    │   (all achieved? → use highest node)
    │       │
    │       ▼
    │   Returns (exercise, ladder_node)
    │
    └── Slot has exercise? ──► (exercise, node=None)

               │
               ▼
    Collect all main exercises
               │
               ▼
    select_warmups(exercises)
       │  Gather muscle_group IDs from all exercises
       │  Query WarmUpExercise by coverage
       │  Return up to 5, ordered by coverage count
       │
       ▼
    Create SessionExercises:
       ├── Warm-ups first (is_warmup=True, no sets)
       └── Main exercises (is_warmup=False)
              │
              ▼
        generate_sets_for_exercise(se, node, user)
              │
              ├── node.criteria.first() → extract target reps/sets/type
              │
              ├── UserNodeProgress.working_weight ──┐
              │   (fallback: last completed session  │
              │    heaviest working set weight)       │
              │                                       │
              ▼                                       ▼
        Warm-up sets                          Working sets
        ├── weight curve: exponential         ├── prefilled reps from criterion
        │   start_pct% → 80%                  ├── prefilled weight from working_weight
        ├── rep curve: ~1.8x → 1x target     └── rest_seconds=90
        ├── min weight 2.5kg
        └── rest_seconds=60
```

## During Workout (PATCH session/)

```
User logs each set in guided flow
    │
    ▼
Frontend PATCHes session with updated ExerciseSet values
    │
    ▼
Serializer matches exercises by (exercise_id, order)
Updates in-place (preserves is_warmup, warmup_duration_seconds)
Replaces sets on each exercise
```

## Session Completion (POST complete/)

```
Mark session completed
    │
    ▼
For each non-warmup, ladder-based exercise:
    │
    ├── Extract max weight from completed working sets
    │       │
    │       ▼
    │   UserNodeProgress.working_weight = max_weight  ◄── KEY FEEDBACK
    │
    └── update_user_progress(node, user)
            │
            ▼
        For each criterion on this node:
            evaluate_criterion()
            │
            ├── min_reps_sets: any session where ≥N sets hit ≥M reps?
            ├── min_weight: any set hit weight ≥W?
            ├── sustained_sessions: ≥S sessions where reps ≥R?
            └── min_duration: any set hit ≥D seconds?
            │
            ▼
        All criteria pass?
            ├── Yes → achieved=True, achieved_at=now()
            └── No  → stays achieved=False
    │
    ▼
Return progression_updates to frontend
```

## The Feedback Loop (Next Week)

```
                    ┌──────────────────────────────────┐
                    │                                    │
                    ▼                                    │
            Generate session                             │
                    │                                    │
                    ▼                                    │
        resolve_ladder_exercise()                        │
        sees achieved=True on node X                     │
        → advances to node X+1                           │
                    │                                    │
                    ▼                                    │
        generate_sets_for_exercise()                     │
        uses working_weight from                         │
        UserNodeProgress (updated                        │
        at last completion)                              │
                    │                                    │
                    ▼                                    │
            User completes session                       │
                    │                                    │
                    ▼                                    │
            working_weight updated ──────────────────────┘
            progression evaluated
```

## Key State Entities

| Entity | Mutable state | Who writes it | Who reads it |
|---|---|---|---|
| `UserNodeProgress.achieved` | `false → true` (one-way) | `complete` action | `resolve_ladder_exercise()` |
| `UserNodeProgress.working_weight` | Decimal, updated each completion | `complete` action | `generate_sets_for_exercise()` |
| `WeeklyPlan.active` | boolean | User via API | `generate` action |
| `WorkoutSession.status` | `in_progress → completed` | `complete` action | Frontend display |
| `ExerciseSet.completed` | `false → true` | User via PATCH | `complete` progression eval |

The two pieces of state that create the loop are **`working_weight`** (drives prefill values) and **`achieved`** (drives which node you're on). Everything else is either template data (plan, ladders, criteria) or ephemeral session data.

## Key Files

| File | Role in the flow |
|---|---|
| `backend/apps/workout/signals.py` | WorkoutUser creation + default copy on signup |
| `backend/apps/workout/views.py` | `generate` and `complete` actions — the two main state transitions |
| `backend/apps/workout/set_generation.py` | Prefill algorithm: UserNodeProgress → ExerciseSets |
| `backend/apps/workout/progression.py` | Criterion evaluation: ExerciseSets → achieved flag |
| `backend/apps/workout/warmups.py` | Warm-up selection by muscle group coverage |
| `backend/apps/workout/models.py` | All entity definitions and relationships |
| `apps/workout/src/pages/GuidedWorkout.tsx` | Frontend state machine: countdown → warmup → exercise → rest → complete |
