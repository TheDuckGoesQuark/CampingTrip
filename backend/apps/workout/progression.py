"""
Criterion evaluation — checks session logs against ladder node criteria
to determine if a user has met the requirements for progression.
"""

from .models import (
    Criterion,
    CriterionType,
    ExerciseSet,
    LadderNode,
    UserNodeProgress,
    WorkoutUser,
)


def evaluate_criterion(criterion: Criterion, workout_user: WorkoutUser) -> bool:
    """Evaluate a single criterion against a user's session logs."""
    node = criterion.ladder_node
    exercise = node.exercise

    # Get all completed sets for this exercise from completed sessions
    sets = ExerciseSet.objects.filter(
        session_exercise__exercise=exercise,
        session_exercise__session__user=workout_user,
        session_exercise__session__status='completed',
        completed=True,
    ).select_related('session_exercise__session')

    if criterion.type == CriterionType.MIN_REPS_SETS:
        return _check_min_reps_sets(sets, criterion.params)
    elif criterion.type == CriterionType.MIN_WEIGHT:
        return _check_min_weight(sets, criterion.params)
    elif criterion.type == CriterionType.SUSTAINED_SESSIONS:
        return _check_sustained_sessions(sets, criterion.params)
    elif criterion.type == CriterionType.MIN_DURATION:
        return _check_min_duration(sets, criterion.params)
    return False


def _check_min_reps_sets(sets, params: dict) -> bool:
    """Check if user has done at least N sets of M reps in a single session.
    params: {"sets": 3, "reps": 10}
    """
    required_sets = params.get('sets', 1)
    required_reps = params.get('reps', 1)

    # Group sets by session
    session_sets: dict[int, list] = {}
    for s in sets:
        session_id = s.session_exercise.session_id
        session_sets.setdefault(session_id, []).append(s)

    # Check if any session meets the requirement
    for session_id, session_set_list in session_sets.items():
        qualifying_sets = sum(
            1 for s in session_set_list
            if s.value.get('reps', 0) >= required_reps
        )
        if qualifying_sets >= required_sets:
            return True
    return False


def _check_min_weight(sets, params: dict) -> bool:
    """Check if user has lifted at least N weight.
    params: {"weight": 20}
    """
    required_weight = params.get('weight', 0)
    return any(
        s.value.get('weight', 0) >= required_weight
        for s in sets
    )


def _check_sustained_sessions(sets, params: dict) -> bool:
    """Check if user has met a rep target across N sessions.
    params: {"sessions": 3, "reps": 10}
    """
    required_sessions = params.get('sessions', 1)
    required_reps = params.get('reps', 1)

    # Get unique sessions where the rep target was met
    qualifying_sessions = set()
    for s in sets:
        if s.value.get('reps', 0) >= required_reps:
            qualifying_sessions.add(s.session_exercise.session_id)

    return len(qualifying_sessions) >= required_sessions


def _check_min_duration(sets, params: dict) -> bool:
    """Check if user has held for at least N seconds.
    params: {"seconds": 60}
    """
    required_seconds = params.get('seconds', 0)
    return any(
        s.value.get('seconds', 0) >= required_seconds
        for s in sets
    )


def check_node_progress(node: LadderNode, workout_user: WorkoutUser) -> dict:
    """Check all criteria for a node and return progress status."""
    criteria = node.criteria.all()
    if not criteria.exists():
        return {'achieved': False, 'criteria_met': [], 'criteria_total': 0}

    results = []
    for criterion in criteria:
        met = evaluate_criterion(criterion, workout_user)
        results.append({
            'criterion_id': criterion.id,
            'type': criterion.type,
            'params': criterion.params,
            'met': met,
        })

    all_met = all(r['met'] for r in results)
    return {
        'achieved': all_met,
        'criteria_met': results,
        'criteria_total': len(results),
    }


def update_user_progress(node: LadderNode, workout_user: WorkoutUser) -> UserNodeProgress:
    """Check criteria and update UserNodeProgress accordingly."""
    progress_data = check_node_progress(node, workout_user)
    progress, _ = UserNodeProgress.objects.get_or_create(
        user=workout_user,
        ladder_node=node,
    )

    if progress_data['achieved'] and not progress.achieved:
        from django.utils import timezone
        progress.achieved = True
        progress.achieved_at = timezone.now()
        progress.save()
    return progress
