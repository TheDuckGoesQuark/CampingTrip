"""
Seed default ladders, exercises, warm-ups, and weekly plan from Jordan's Notion data.

Creates a "defaults" user who owns the canonical ladder/exercise data.
The signal in signals.py copies these to each new user on signup.

Usage:
    python manage.py seed_default_ladders
    python manage.py seed_default_ladders --clear  # wipe and re-seed
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.workout.models import (
    Criterion,
    Exercise,
    Ladder,
    LadderNode,
    MuscleGroup,
    PlanSlot,
    WarmUpExercise,
    WeeklyPlan,
    WorkoutUser,
)

DEFAULTS_USERNAME = "_workout_defaults"

# --- Ladder definitions from Notion ---
# Each ladder: list of (exercise_name, level, criterion_type, criterion_params)
# Levels go from 1 (easiest) upward. Each node's prerequisite is the previous level.

LADDERS = {
    # Each node: (exercise_name, level, criterion_type, criterion_params, warmup_sets_count)
    # warmup_sets_count: 0 for bodyweight, 2-3 for weighted exercises
    "Pull Ladder": [
        ("Jumping Pull-ups", 1, "min_reps_sets", {"sets": 4, "reps": 10}, 0),
        ("Band-Assisted Pull-ups", 2, "min_reps_sets", {"sets": 4, "reps": 10}, 0),
        ("Pull-ups", 3, "min_reps_sets", {"sets": 4, "reps": 10}, 0),
        ("Weighted Pull-ups (5kg)", 4, "min_reps_sets", {"sets": 4, "reps": 8}, 3),
        ("Weighted Pull-ups (10kg)", 5, "min_reps_sets", {"sets": 4, "reps": 8}, 3),
        ("Archer Pull-ups", 6, "min_reps_sets", {"sets": 4, "reps": 6}, 0),
        ("One-Arm Negatives", 7, "min_reps_sets", {"sets": 4, "reps": 4}, 0),
    ],
    "Chin-up Ladder": [
        ("Chin-ups", 1, "min_reps_sets", {"sets": 4, "reps": 10}, 0),
        ("Weighted Chin-ups (5kg)", 2, "min_reps_sets", {"sets": 4, "reps": 8}, 3),
        ("Weighted Chin-ups (10kg)", 3, "min_reps_sets", {"sets": 4, "reps": 8}, 3),
        ("Close-Grip Weighted", 4, "min_reps_sets", {"sets": 4, "reps": 8}, 3),
    ],
    "Push Ladder": [
        ("Push-ups", 1, "min_reps_sets", {"sets": 4, "reps": 15}, 0),
        ("Close-Grip Push-ups", 2, "min_reps_sets", {"sets": 4, "reps": 12}, 0),
        ("Archer Push-ups", 3, "min_reps_sets", {"sets": 4, "reps": 8}, 0),
        ("Pike Push-ups", 4, "min_reps_sets", {"sets": 4, "reps": 10}, 0),
        ("Bar Dips", 5, "min_reps_sets", {"sets": 4, "reps": 12}, 0),
        ("Weighted Dips (5kg)", 6, "min_reps_sets", {"sets": 4, "reps": 8}, 3),
        ("Pseudo-Planche Push-ups", 7, "min_reps_sets", {"sets": 4, "reps": 6}, 0),
    ],
    "Row Ladder": [
        ("Australian Rows", 1, "min_reps_sets", {"sets": 4, "reps": 10}, 0),
        ("Feet-Elevated Rows", 2, "min_reps_sets", {"sets": 4, "reps": 10}, 0),
        ("Weighted Rows (backpack)", 3, "min_reps_sets", {"sets": 4, "reps": 8}, 2),
    ],
    "Carry Ladder": [
        ("Farmer Carry (bodyweight pack)", 1, "min_duration", {"seconds": 1800}, 0),
        ("Farmer Carry (heavy)", 2, "min_duration", {"seconds": 1800}, 0),
        ("Zercher Carry (light)", 3, "min_duration", {"seconds": 1200}, 0),
        ("Zercher Carry (heavy)", 4, "min_duration", {"seconds": 1200}, 0),
        ("Zercher Carry + incline", 5, "min_duration", {"seconds": 1200}, 0),
    ],
}

# Standalone exercises used in weekly plan but not part of a ladder
STANDALONE_EXERCISES = [
    "Running",
    "Yoga",
    "Swimming",
    "Parkrun 5k",
]

# --- Muscle group assignments ---
# exercise name -> list of muscle group names

EXERCISE_MUSCLE_GROUPS = {
    # Pull ladder
    "Jumping Pull-ups": ["lats", "biceps"],
    "Band-Assisted Pull-ups": ["lats", "biceps"],
    "Pull-ups": ["lats", "biceps"],
    "Weighted Pull-ups (5kg)": ["lats", "biceps"],
    "Weighted Pull-ups (10kg)": ["lats", "biceps"],
    "Archer Pull-ups": ["lats", "biceps"],
    "One-Arm Negatives": ["lats", "biceps"],
    # Chin-up ladder
    "Chin-ups": ["biceps", "lats"],
    "Weighted Chin-ups (5kg)": ["biceps", "lats"],
    "Weighted Chin-ups (10kg)": ["biceps", "lats"],
    "Close-Grip Weighted": ["biceps", "lats"],
    # Push ladder
    "Push-ups": ["chest", "triceps"],
    "Close-Grip Push-ups": ["triceps", "chest"],
    "Archer Push-ups": ["chest", "triceps"],
    "Pike Push-ups": ["shoulders", "triceps"],
    "Bar Dips": ["chest", "triceps", "shoulders"],
    "Weighted Dips (5kg)": ["chest", "triceps", "shoulders"],
    "Pseudo-Planche Push-ups": ["shoulders", "chest", "triceps"],
    # Row ladder
    "Australian Rows": ["lats", "biceps"],
    "Feet-Elevated Rows": ["lats", "biceps"],
    "Weighted Rows (backpack)": ["lats", "biceps"],
    # Carry ladder
    "Farmer Carry (bodyweight pack)": ["forearms", "core"],
    "Farmer Carry (heavy)": ["forearms", "core"],
    "Zercher Carry (light)": ["forearms", "core", "biceps"],
    "Zercher Carry (heavy)": ["forearms", "core", "biceps"],
    "Zercher Carry + incline": ["forearms", "core", "biceps", "legs"],
    # Standalone
    "Running": ["legs"],
    "Swimming": ["full_body"],
    "Yoga": ["full_body"],
    "Parkrun 5k": ["legs"],
}

# --- Warm-up exercises (global, not per-user) ---
# (name, description, duration_seconds, [muscle_groups])

WARMUP_EXERCISES = [
    ("Arm Circles", "Forward and backward arm circles", 30, ["shoulders"]),
    ("Shoulder Dislocates", "Band or stick overhead pass-throughs", 30, ["shoulders", "chest"]),
    ("Scapular Pull-ups", "Dead hang, retract and depress scapulae", 30, ["lats"]),
    ("Dead Hang", "Passive hang from bar, relax shoulders", 30, ["lats", "forearms"]),
    ("Cat-Cow Stretch", "Alternate between cat and cow positions", 30, ["core"]),
    ("Inchworms", "Walk hands out to plank, walk feet to hands", 30, ["core", "chest", "shoulders"]),
    ("Downward Dog", "Hold downward-facing dog position", 30, ["shoulders", "lats"]),
    ("Wrist Circles", "Rotate wrists in both directions", 20, ["forearms"]),
    ("Push-up Plus", "Push-up position, protract and retract scapulae", 30, ["chest", "shoulders"]),
    ("Leg Swings", "Forward/back and side-to-side leg swings", 30, ["legs"]),
    ("Hip Circles", "Standing hip rotations, both directions", 30, ["legs", "core"]),
    ("Light Jogging", "Easy jog in place", 45, ["legs"]),
]

# Weekly plan from Notion
# (day_of_week, order, ladder_name_or_None, exercise_name_or_None)
# If ladder_name is set, the slot references the ladder (auto-pick current level).
# If exercise_name is set, the slot references the standalone exercise.
WEEKLY_PLAN = {
    "name": "Jordan's Default Plan",
    "slots": [
        # Monday — Pull + Swim
        (0, 1, "Pull Ladder", None),
        (0, 2, "Chin-up Ladder", None),
        (0, 3, "Row Ladder", None),
        (0, 4, None, "Swimming"),
        # Tuesday — Push + Run
        (1, 1, "Push Ladder", None),
        (1, 2, None, "Running"),
        # Wednesday — Run + Yoga
        (2, 1, None, "Running"),
        (2, 2, None, "Yoga"),
        # Thursday — Swim or Yoga
        (3, 1, None, "Swimming"),
        (3, 2, None, "Yoga"),
        # Friday — Pull + Push (Combined)
        (4, 1, "Pull Ladder", None),
        (4, 2, "Chin-up Ladder", None),
        (4, 3, "Push Ladder", None),
        # Saturday — Parkrun 5k
        (5, 1, None, "Parkrun 5k"),
        # Sunday — Long Run
        (6, 1, None, "Running"),
    ],
}


def get_or_create_defaults_user():
    """Get or create the special defaults user that owns seed data."""
    User = get_user_model()
    user, _ = User.objects.get_or_create(
        username=DEFAULTS_USERNAME,
        defaults={"is_active": False},  # not a real user
    )
    workout_user, _ = WorkoutUser.objects.get_or_create(user=user)
    return workout_user


def clear_defaults(workout_user):
    """Remove all seed data owned by the defaults user."""
    workout_user.ladders.all().delete()
    workout_user.exercises.all().delete()
    workout_user.weekly_plans.all().delete()
    WarmUpExercise.objects.all().delete()
    MuscleGroup.objects.all().delete()


def seed_muscle_groups():
    """Create muscle group records. Returns name->MuscleGroup dict."""
    all_groups = set()
    for groups in EXERCISE_MUSCLE_GROUPS.values():
        all_groups.update(groups)
    for _, _, _, groups in WARMUP_EXERCISES:
        all_groups.update(groups)

    mg_cache = {}
    for name in sorted(all_groups):
        mg, _ = MuscleGroup.objects.get_or_create(name=name)
        mg_cache[name] = mg
    return mg_cache


def seed_ladders(workout_user, mg_cache):
    """Create exercises, ladders, nodes, and criteria from Notion data."""
    exercise_cache = {}
    ladder_cache = {}

    for ladder_name, nodes in LADDERS.items():
        ladder = Ladder.objects.create(owner=workout_user)
        ladder_cache[ladder_name] = ladder
        prev_node = None

        for exercise_name, level, crit_type, crit_params, warmup_sets in nodes:
            # Get or create the exercise
            if exercise_name not in exercise_cache:
                exercise = Exercise.objects.create(
                    owner=workout_user, name=exercise_name
                )
                # Assign muscle groups
                for mg_name in EXERCISE_MUSCLE_GROUPS.get(exercise_name, []):
                    exercise.muscle_groups.add(mg_cache[mg_name])
                exercise_cache[exercise_name] = exercise

            node = LadderNode.objects.create(
                ladder=ladder,
                exercise=exercise_cache[exercise_name],
                level=level,
                warmup_sets_count=warmup_sets,
            )
            if prev_node:
                node.prerequisites.add(prev_node)

            Criterion.objects.create(
                ladder_node=node,
                type=crit_type,
                params=crit_params,
            )
            prev_node = node

    # Create standalone exercises
    for name in STANDALONE_EXERCISES:
        if name not in exercise_cache:
            exercise = Exercise.objects.create(owner=workout_user, name=name)
            for mg_name in EXERCISE_MUSCLE_GROUPS.get(name, []):
                exercise.muscle_groups.add(mg_cache[mg_name])
            exercise_cache[name] = exercise

    # Create warm-up movements as regular exercises (for SessionExercise linking)
    for wu_name, wu_desc, _, _ in WARMUP_EXERCISES:
        if wu_name not in exercise_cache:
            exercise = Exercise.objects.create(
                owner=workout_user, name=wu_name, description=wu_desc,
            )
            # Warm-up exercises don't need muscle groups on the Exercise record;
            # the WarmUpExercise model handles that mapping.
            exercise_cache[wu_name] = exercise

    return exercise_cache, ladder_cache


def seed_warmups(mg_cache):
    """Create global WarmUpExercise records with muscle group mappings."""
    for name, description, duration, groups in WARMUP_EXERCISES:
        wu = WarmUpExercise.objects.create(
            name=name,
            description=description,
            duration_seconds=duration,
        )
        for mg_name in groups:
            wu.muscle_groups.add(mg_cache[mg_name])


def seed_weekly_plan(workout_user, exercise_cache, ladder_cache):
    """Create the default weekly plan from Notion data."""
    plan = WeeklyPlan.objects.create(
        owner=workout_user,
        name=WEEKLY_PLAN["name"],
        active=True,
    )

    for day, order, ladder_name, exercise_name in WEEKLY_PLAN["slots"]:
        PlanSlot.objects.create(
            weekly_plan=plan,
            day_of_week=day,
            order=order,
            ladder=ladder_cache.get(ladder_name) if ladder_name else None,
            exercise=exercise_cache.get(exercise_name) if exercise_name else None,
        )

    return plan


def copy_defaults_to_user(workout_user):
    """
    Copy all seed data from the defaults user to a real user.
    Creates fresh exercises, ladders, nodes, criteria, and weekly plan.
    """
    defaults_user = get_or_create_defaults_user()

    # Skip if defaults haven't been seeded
    if not defaults_user.ladders.exists():
        return

    exercise_map = {}  # defaults exercise id -> new exercise
    ladder_map = {}  # defaults ladder id -> new ladder

    # Copy exercises (including warm-up exercises)
    for exercise in defaults_user.exercises.prefetch_related('muscle_groups'):
        new_exercise = Exercise.objects.create(
            owner=workout_user,
            name=exercise.name,
            description=exercise.description,
        )
        new_exercise.muscle_groups.set(exercise.muscle_groups.all())
        exercise_map[exercise.id] = new_exercise

    # Copy ladders with nodes and criteria
    for ladder in defaults_user.ladders.prefetch_related(
        'nodes__exercise', 'nodes__criteria', 'nodes__prerequisites'
    ):
        new_ladder = Ladder.objects.create(
            owner=workout_user,
            description=ladder.description,
        )
        ladder_map[ladder.id] = new_ladder

        node_map = {}  # old node id -> new node
        for node in ladder.nodes.order_by('level'):
            new_node = LadderNode.objects.create(
                ladder=new_ladder,
                exercise=exercise_map[node.exercise_id],
                level=node.level,
                warmup_sets_count=node.warmup_sets_count,
                warmup_start_pct=node.warmup_start_pct,
            )
            node_map[node.id] = new_node

            for criterion in node.criteria.all():
                Criterion.objects.create(
                    ladder_node=new_node,
                    type=criterion.type,
                    params=criterion.params,
                )

        # Wire prerequisites after all nodes exist
        for node in ladder.nodes.all():
            new_node = node_map[node.id]
            for prereq in node.prerequisites.all():
                new_node.prerequisites.add(node_map[prereq.id])

    # Copy weekly plan
    for plan in defaults_user.weekly_plans.prefetch_related('slots'):
        new_plan = WeeklyPlan.objects.create(
            owner=workout_user,
            name=plan.name,
            active=plan.active,
        )
        for slot in plan.slots.all():
            PlanSlot.objects.create(
                weekly_plan=new_plan,
                day_of_week=slot.day_of_week,
                order=slot.order,
                ladder=ladder_map.get(slot.ladder_id) if slot.ladder_id else None,
                exercise=exercise_map.get(slot.exercise_id) if slot.exercise_id else None,
                exercise_params=slot.exercise_params,
            )


class Command(BaseCommand):
    help = "Seed default ladders, exercises, warm-ups, and weekly plan"

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing seed data before re-seeding',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        workout_user = get_or_create_defaults_user()

        if options['clear']:
            clear_defaults(workout_user)
            self.stdout.write("Cleared existing seed data.")

        if workout_user.ladders.exists():
            self.stdout.write(
                "Seed data already exists. Use --clear to re-seed."
            )
            return

        mg_cache = seed_muscle_groups()
        exercise_cache, ladder_cache = seed_ladders(workout_user, mg_cache)
        seed_warmups(mg_cache)
        seed_weekly_plan(workout_user, exercise_cache, ladder_cache)

        total_exercises = Exercise.objects.filter(owner=workout_user).count()
        total_ladders = Ladder.objects.filter(owner=workout_user).count()
        total_nodes = LadderNode.objects.filter(ladder__owner=workout_user).count()
        total_criteria = Criterion.objects.filter(
            ladder_node__ladder__owner=workout_user
        ).count()
        total_warmups = WarmUpExercise.objects.count()
        total_mgs = MuscleGroup.objects.count()

        self.stdout.write(self.style.SUCCESS(
            f"Seeded: {total_exercises} exercises, {total_ladders} ladders, "
            f"{total_nodes} nodes, {total_criteria} criteria, "
            f"{total_warmups} warm-ups, {total_mgs} muscle groups, 1 weekly plan"
        ))
