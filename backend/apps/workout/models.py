from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class WorkoutUser(models.Model):
    """Links auth user to workout domain. All workout models FK to this."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='workout_profile',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"WorkoutUser({self.user.username})"

    class Meta:
        db_table = 'workout_user'


class MuscleGroup(models.Model):
    """Movement category for matching exercises to warm-ups."""

    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'workout_muscle_group'
        ordering = ['name']


class Exercise(models.Model):
    """A movement/exercise. Minimal — just name and description."""

    owner = models.ForeignKey(
        WorkoutUser, on_delete=models.CASCADE, related_name='exercises'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    muscle_groups = models.ManyToManyField(
        MuscleGroup, blank=True, related_name='exercises',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'workout_exercise'
        ordering = ['name']


class WarmUpExercise(models.Model):
    """
    Global warm-up template. Timer-based, mapped to muscle groups.
    Used during session generation to select tailored warm-ups.
    """

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    duration_seconds = models.PositiveIntegerField(default=30)
    muscle_groups = models.ManyToManyField(
        MuscleGroup, related_name='warmup_exercises',
    )

    def __str__(self):
        return f"{self.name} ({self.duration_seconds}s)"

    class Meta:
        db_table = 'workout_warmup_exercise'
        ordering = ['name']


class Ladder(models.Model):
    """
    A progression path (e.g. pull-up progression).
    Display name is derived from the highest-level node's exercise.
    """

    owner = models.ForeignKey(
        WorkoutUser, on_delete=models.CASCADE, related_name='ladders'
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def name(self):
        top_node = self.nodes.order_by('-level').first()
        return top_node.exercise.name if top_node else 'Empty Ladder'

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'workout_ladder'


class LadderNode(models.Model):
    """A step in the tech tree. Prerequisites enable branching (Civ 5 style)."""

    ladder = models.ForeignKey(
        Ladder, on_delete=models.CASCADE, related_name='nodes'
    )
    exercise = models.ForeignKey(
        Exercise, on_delete=models.CASCADE, related_name='ladder_nodes'
    )
    level = models.PositiveIntegerField(
        help_text='Tier in the tree (for display ordering)'
    )
    prerequisites = models.ManyToManyField(
        'self', symmetrical=False, blank=True, related_name='unlocks'
    )
    warmup_sets_count = models.PositiveIntegerField(
        default=0,
        help_text='Number of warm-up sets before working sets (0 = none)',
    )
    warmup_start_pct = models.PositiveIntegerField(
        default=20,
        help_text='Starting weight percentage for warm-up sets (e.g. 20 = 20%)',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.exercise.name} (L{self.level})"

    class Meta:
        db_table = 'workout_ladder_node'
        ordering = ['ladder', 'level']


class CriterionType(models.TextChoices):
    MIN_REPS_SETS = 'min_reps_sets', 'Minimum reps & sets'
    MIN_WEIGHT = 'min_weight', 'Minimum weight'
    SUSTAINED_SESSIONS = 'sustained_sessions', 'Sustained over sessions'
    MIN_DURATION = 'min_duration', 'Minimum duration'


class Criterion(models.Model):
    """
    Flexible rule that must pass to progress past a LadderNode.
    Type determines how params are interpreted and evaluated.
    """

    ladder_node = models.ForeignKey(
        LadderNode, on_delete=models.CASCADE, related_name='criteria'
    )
    type = models.CharField(max_length=50, choices=CriterionType.choices)
    params = models.JSONField(
        help_text='Shape determined by type, e.g. {"sets": 3, "reps": 10}'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_type_display()} on {self.ladder_node}"

    class Meta:
        db_table = 'workout_criterion'
        verbose_name_plural = 'criteria'


class UserNodeProgress(models.Model):
    """Tracks achievement on ladder nodes. Bests computed from session logs."""

    user = models.ForeignKey(
        WorkoutUser, on_delete=models.CASCADE, related_name='node_progress'
    )
    ladder_node = models.ForeignKey(
        LadderNode, on_delete=models.CASCADE, related_name='user_progress'
    )
    achieved = models.BooleanField(default=False)
    achieved_at = models.DateTimeField(null=True, blank=True)
    working_weight = models.DecimalField(
        max_digits=6, decimal_places=1, null=True, blank=True,
        help_text='Current working weight in kg. Set during onboarding, updated after sessions.',
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        status = 'achieved' if self.achieved else 'in progress'
        return f"{self.user} - {self.ladder_node} ({status})"

    class Meta:
        db_table = 'workout_user_node_progress'
        unique_together = ['user', 'ladder_node']


class WeeklyPlan(models.Model):
    """Template for the week. One active plan at a time per user."""

    owner = models.ForeignKey(
        WorkoutUser, on_delete=models.CASCADE, related_name='weekly_plans'
    )
    name = models.CharField(max_length=200)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({'active' if self.active else 'inactive'})"

    class Meta:
        db_table = 'workout_weekly_plan'


class DayOfWeek(models.IntegerChoices):
    MONDAY = 0, 'Monday'
    TUESDAY = 1, 'Tuesday'
    WEDNESDAY = 2, 'Wednesday'
    THURSDAY = 3, 'Thursday'
    FRIDAY = 4, 'Friday'
    SATURDAY = 5, 'Saturday'
    SUNDAY = 6, 'Sunday'


class PlanSlot(models.Model):
    """
    Maps a day + order to a ladder (auto-pick current level) or a specific
    exercise. At least one of ladder or exercise must be set.
    """

    weekly_plan = models.ForeignKey(
        WeeklyPlan, on_delete=models.CASCADE, related_name='slots'
    )
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    order = models.PositiveIntegerField()
    ladder = models.ForeignKey(
        Ladder, on_delete=models.CASCADE, null=True, blank=True,
        related_name='plan_slots',
    )
    exercise = models.ForeignKey(
        Exercise, on_delete=models.CASCADE, null=True, blank=True,
        related_name='plan_slots',
    )
    exercise_params = models.JSONField(
        null=True, blank=True,
        help_text='Typed params, e.g. {"type": "reps_weight", "sets": 4, "reps": 8, "weight": 20}',
    )
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if not self.ladder and not self.exercise:
            raise ValidationError('At least one of ladder or exercise must be set.')

    def __str__(self):
        target = self.ladder or self.exercise
        return f"{self.get_day_of_week_display()} #{self.order}: {target}"

    class Meta:
        db_table = 'workout_plan_slot'
        ordering = ['weekly_plan', 'day_of_week', 'order']


class SessionStatus(models.TextChoices):
    PLANNED = 'planned', 'Planned'
    IN_PROGRESS = 'in_progress', 'In Progress'
    COMPLETED = 'completed', 'Completed'
    SKIPPED = 'skipped', 'Skipped'


class WorkoutSession(models.Model):
    """A single workout instance."""

    user = models.ForeignKey(
        WorkoutUser, on_delete=models.CASCADE, related_name='sessions'
    )
    date = models.DateField()
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=SessionStatus.choices, default=SessionStatus.PLANNED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Session {self.date} ({self.get_status_display()})"

    class Meta:
        db_table = 'workout_session'
        ordering = ['-date', '-started_at']


class SessionExercise(models.Model):
    """An exercise within a workout, ordered."""

    session = models.ForeignKey(
        WorkoutSession, on_delete=models.CASCADE, related_name='exercises'
    )
    exercise = models.ForeignKey(
        Exercise, on_delete=models.CASCADE, related_name='session_exercises'
    )
    ladder_node = models.ForeignKey(
        LadderNode, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='session_exercises',
    )
    order = models.PositiveIntegerField()
    is_warmup = models.BooleanField(default=False)
    warmup_duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.exercise.name} (#{self.order})"

    class Meta:
        db_table = 'workout_session_exercise'
        ordering = ['session', 'order']


class ExerciseSetType(models.TextChoices):
    REPS_WEIGHT = 'reps_weight', 'Reps & Weight'
    REPS_ONLY = 'reps_only', 'Reps Only'
    DURATION = 'duration', 'Duration'
    DISTANCE = 'distance', 'Distance'


class ExerciseSet(models.Model):
    """
    Core logging unit. Uses typed JSON for flexible data shapes.
    Type determines the shape of value, like form question types.
    """

    session_exercise = models.ForeignKey(
        SessionExercise, on_delete=models.CASCADE, related_name='sets'
    )
    set_number = models.PositiveIntegerField()
    is_warmup_set = models.BooleanField(default=False)
    type = models.CharField(max_length=30, choices=ExerciseSetType.choices)
    value = models.JSONField(
        help_text='Shape determined by type, e.g. {"reps": 10, "weight": 20}',
    )
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    rest_seconds = models.PositiveIntegerField(default=60)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        status = 'done' if self.completed else 'pending'
        return f"Set {self.set_number} ({status})"

    class Meta:
        db_table = 'workout_exercise_set'
        ordering = ['session_exercise', 'set_number']
