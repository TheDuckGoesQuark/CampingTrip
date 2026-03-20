"""
Warm-up selection — picks tailored warm-ups based on the muscle groups
targeted by a session's exercises.
"""

from django.db.models import Count, Q

from .models import Exercise, WarmUpExercise


def select_warmups(exercises: list[Exercise], max_warmups: int = 5) -> list[WarmUpExercise]:
    """Given today's exercises, select warm-ups that cover their muscle groups.

    Orders by coverage (warm-ups targeting more of the session's muscle groups
    come first), limited to max_warmups.
    """
    muscle_group_ids = set()
    for exercise in exercises:
        muscle_group_ids.update(
            exercise.muscle_groups.values_list('id', flat=True)
        )

    if not muscle_group_ids:
        return []

    return list(
        WarmUpExercise.objects.filter(
            muscle_groups__id__in=muscle_group_ids,
        ).annotate(
            coverage=Count(
                'muscle_groups',
                filter=Q(muscle_groups__id__in=muscle_group_ids),
            ),
        ).order_by('-coverage', 'name').distinct()[:max_warmups]
    )
