"""
Generate prefilled ExerciseSet records for session generation.

Handles:
- Working sets: prefilled from ladder node criteria + user's working weight
- Warm-up sets: exponential weight curve, descending reps
"""

import math
from decimal import Decimal

from .models import (
    ExerciseSet,
    LadderNode,
    SessionExercise,
    UserNodeProgress,
    WorkoutUser,
)


def _get_target_from_criteria(node: LadderNode) -> dict:
    """Extract target reps, sets, and type from a node's criterion."""
    criterion = node.criteria.first()
    if not criterion:
        return {}

    params = criterion.params
    ctype = criterion.type

    if ctype == 'min_reps_sets':
        return {
            'set_type': 'reps_weight',
            'target_reps': params.get('reps', 8),
            'target_sets': params.get('sets', 3),
        }
    elif ctype == 'min_weight':
        return {
            'set_type': 'reps_weight',
            'target_reps': 8,
            'target_sets': 3,
        }
    elif ctype == 'min_duration':
        return {
            'set_type': 'duration',
            'target_seconds': params.get('seconds', 60),
            'target_sets': params.get('sets', 1),
        }
    elif ctype == 'sustained_sessions':
        return {
            'set_type': 'reps_weight',
            'target_reps': params.get('reps', 8),
            'target_sets': 3,
        }
    return {}


def _get_working_weight(node: LadderNode, workout_user: WorkoutUser) -> Decimal | None:
    """Get user's working weight for a node. Falls back to last session data."""
    progress = UserNodeProgress.objects.filter(
        user=workout_user, ladder_node=node,
    ).first()

    if progress and progress.working_weight:
        return progress.working_weight

    # Fallback: check last completed session for this exercise
    last_set = ExerciseSet.objects.filter(
        session_exercise__exercise=node.exercise,
        session_exercise__session__user=workout_user,
        session_exercise__session__status='completed',
        completed=True,
        is_warmup_set=False,
    ).order_by('-session_exercise__session__date', '-set_number').first()

    if last_set:
        weight = last_set.value.get('weight')
        if weight is not None:
            return Decimal(str(weight))

    return None


def _warmup_weight_curve(start_pct: int, n_sets: int) -> list[float]:
    """
    Generate exponential weight percentages for warm-up sets.
    E.g. 3 sets at 20% start → [0.20, 0.40, 0.80]
    """
    if n_sets <= 0:
        return []
    if n_sets == 1:
        return [0.5]

    start = start_pct / 100.0
    end = 0.80  # Last warm-up set at 80% of working weight

    percentages = []
    for i in range(n_sets):
        t = i / (n_sets - 1)
        # Exponential interpolation: start * (end/start)^t
        pct = start * math.pow(end / start, t)
        percentages.append(round(pct, 2))
    return percentages


def _warmup_reps_curve(working_reps: int, n_sets: int) -> list[int]:
    """
    Generate descending reps for warm-up sets.
    Starts at ~2x working reps, decreases to working reps.
    E.g. working_reps=8, 3 sets → [15, 10, 8]
    """
    if n_sets <= 0:
        return []
    if n_sets == 1:
        return [working_reps]

    start_reps = max(working_reps, round(working_reps * 1.8))
    reps = []
    for i in range(n_sets):
        t = i / (n_sets - 1)
        r = round(start_reps + (working_reps - start_reps) * t)
        reps.append(max(r, working_reps))
    return reps


def _round_weight(weight: float, increment: float = 2.5) -> float:
    """Round weight to nearest increment (default 2.5kg)."""
    return round(round(weight / increment) * increment, 1)


def generate_sets_for_exercise(
    session_exercise: SessionExercise,
    node: LadderNode | None,
    workout_user: WorkoutUser,
) -> None:
    """
    Create prefilled ExerciseSet records for a session exercise.
    Uses ladder node criteria for targets and user progress for weight.
    """
    if not node:
        # No ladder node — create one empty set for manual entry
        ExerciseSet.objects.create(
            session_exercise=session_exercise,
            set_number=1,
            type='reps_weight',
            value={},
            rest_seconds=90,
        )
        return

    targets = _get_target_from_criteria(node)
    if not targets:
        ExerciseSet.objects.create(
            session_exercise=session_exercise,
            set_number=1,
            type='reps_weight',
            value={},
            rest_seconds=90,
        )
        return

    set_type = targets.get('set_type', 'reps_weight')
    working_weight = _get_working_weight(node, workout_user)
    set_number = 1

    # --- Warm-up sets ---
    if node.warmup_sets_count > 0 and working_weight and working_weight > 0:
        weight_pcts = _warmup_weight_curve(node.warmup_start_pct, node.warmup_sets_count)

        if set_type == 'reps_weight':
            working_reps = targets.get('target_reps', 8)
            rep_curve = _warmup_reps_curve(working_reps, node.warmup_sets_count)

            for pct, reps in zip(weight_pcts, rep_curve):
                warmup_weight = max(_round_weight(float(working_weight) * pct), 2.5)
                ExerciseSet.objects.create(
                    session_exercise=session_exercise,
                    set_number=set_number,
                    is_warmup_set=True,
                    type='reps_weight',
                    value={'reps': reps, 'weight': warmup_weight},
                    rest_seconds=60,
                )
                set_number += 1

    # --- Working sets ---
    if set_type == 'reps_weight':
        target_sets = targets.get('target_sets', 3)
        target_reps = targets.get('target_reps', 8)
        value = {'reps': target_reps}
        if working_weight:
            value['weight'] = float(working_weight)

        for _ in range(target_sets):
            ExerciseSet.objects.create(
                session_exercise=session_exercise,
                set_number=set_number,
                type='reps_weight',
                value=value,
                rest_seconds=90,
            )
            set_number += 1

    elif set_type == 'duration':
        target_sets = targets.get('target_sets', 1)
        target_seconds = targets.get('target_seconds', 60)

        for _ in range(target_sets):
            ExerciseSet.objects.create(
                session_exercise=session_exercise,
                set_number=set_number,
                type='duration',
                value={'seconds': target_seconds},
                rest_seconds=90,
            )
            set_number += 1
