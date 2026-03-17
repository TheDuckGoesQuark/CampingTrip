"""
Seed default ladders, exercises, and weekly plan from Jordan's Notion data.

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
    PlanSlot,
    WeeklyPlan,
    WorkoutUser,
)

DEFAULTS_USERNAME = "_workout_defaults"

# --- Ladder definitions from Notion ---
# Each ladder: list of (exercise_name, level, criterion_type, criterion_params)
# Levels go from 1 (easiest) upward. Each node's prerequisite is the previous level.

LADDERS = {
    "Pull Ladder": [
        ("Jumping Pull-ups", 1, "min_reps_sets", {"sets": 4, "reps": 10}),
        ("Band-Assisted Pull-ups", 2, "min_reps_sets", {"sets": 4, "reps": 10}),
        ("Pull-ups", 3, "min_reps_sets", {"sets": 4, "reps": 10}),
        ("Weighted Pull-ups (5kg)", 4, "min_reps_sets", {"sets": 4, "reps": 8}),
        ("Weighted Pull-ups (10kg)", 5, "min_reps_sets", {"sets": 4, "reps": 8}),
        ("Archer Pull-ups", 6, "min_reps_sets", {"sets": 4, "reps": 6}),
        ("One-Arm Negatives", 7, "min_reps_sets", {"sets": 4, "reps": 4}),
    ],
    "Chin-up Ladder": [
        ("Chin-ups", 1, "min_reps_sets", {"sets": 4, "reps": 10}),
        ("Weighted Chin-ups (5kg)", 2, "min_reps_sets", {"sets": 4, "reps": 8}),
        ("Weighted Chin-ups (10kg)", 3, "min_reps_sets", {"sets": 4, "reps": 8}),
        ("Close-Grip Weighted", 4, "min_reps_sets", {"sets": 4, "reps": 8}),
    ],
    "Push Ladder": [
        ("Push-ups", 1, "min_reps_sets", {"sets": 4, "reps": 15}),
        ("Close-Grip Push-ups", 2, "min_reps_sets", {"sets": 4, "reps": 12}),
        ("Archer Push-ups", 3, "min_reps_sets", {"sets": 4, "reps": 8}),
        ("Pike Push-ups", 4, "min_reps_sets", {"sets": 4, "reps": 10}),
        ("Bar Dips", 5, "min_reps_sets", {"sets": 4, "reps": 12}),
        ("Weighted Dips (5kg)", 6, "min_reps_sets", {"sets": 4, "reps": 8}),
        ("Pseudo-Planche Push-ups", 7, "min_reps_sets", {"sets": 4, "reps": 6}),
    ],
    "Row Ladder": [
        ("Australian Rows", 1, "min_reps_sets", {"sets": 4, "reps": 10}),
        ("Feet-Elevated Rows", 2, "min_reps_sets", {"sets": 4, "reps": 10}),
        ("Weighted Rows (backpack)", 3, "min_reps_sets", {"sets": 4, "reps": 8}),
    ],
    "Carry Ladder": [
        ("Farmer Carry (bodyweight pack)", 1, "min_duration", {"seconds": 1800}),
        ("Farmer Carry (heavy)", 2, "min_duration", {"seconds": 1800}),
        ("Zercher Carry (light)", 3, "min_duration", {"seconds": 1200}),
        ("Zercher Carry (heavy)", 4, "min_duration", {"seconds": 1200}),
        ("Zercher Carry + incline", 5, "min_duration", {"seconds": 1200}),
    ],
}

# Standalone exercises used in weekly plan but not part of a ladder
STANDALONE_EXERCISES = [
    "Running",
    "Yoga",
    "Swimming",
    "Parkrun 5k",
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


def seed_ladders(workout_user):
    """Create exercises, ladders, nodes, and criteria from Notion data."""
    exercise_cache = {}
    ladder_cache = {}

    for ladder_name, nodes in LADDERS.items():
        ladder = Ladder.objects.create(owner=workout_user)
        ladder_cache[ladder_name] = ladder
        prev_node = None

        for exercise_name, level, crit_type, crit_params in nodes:
            # Get or create the exercise
            if exercise_name not in exercise_cache:
                exercise = Exercise.objects.create(
                    owner=workout_user, name=exercise_name
                )
                exercise_cache[exercise_name] = exercise

            node = LadderNode.objects.create(
                ladder=ladder,
                exercise=exercise_cache[exercise_name],
                level=level,
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
            exercise_cache[name] = exercise

    return exercise_cache, ladder_cache


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

    # Copy exercises
    for exercise in defaults_user.exercises.all():
        new_exercise = Exercise.objects.create(
            owner=workout_user,
            name=exercise.name,
            description=exercise.description,
        )
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
    help = "Seed default ladders, exercises, and weekly plan from Jordan's Notion data"

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

        exercise_cache, ladder_cache = seed_ladders(workout_user)
        seed_weekly_plan(workout_user, exercise_cache, ladder_cache)

        total_exercises = Exercise.objects.filter(owner=workout_user).count()
        total_ladders = Ladder.objects.filter(owner=workout_user).count()
        total_nodes = LadderNode.objects.filter(ladder__owner=workout_user).count()
        total_criteria = Criterion.objects.filter(
            ladder_node__ladder__owner=workout_user
        ).count()

        self.stdout.write(self.style.SUCCESS(
            f"Seeded: {total_exercises} exercises, {total_ladders} ladders, "
            f"{total_nodes} nodes, {total_criteria} criteria, 1 weekly plan"
        ))
