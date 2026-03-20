from django.contrib import admin

from .models import (
    Criterion,
    Exercise,
    ExerciseSet,
    Ladder,
    LadderNode,
    MuscleGroup,
    PlanSlot,
    SessionExercise,
    UserNodeProgress,
    WarmUpExercise,
    WeeklyPlan,
    WorkoutSession,
    WorkoutUser,
)


@admin.register(WorkoutUser)
class WorkoutUserAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at']
    raw_id_fields = ['user']


@admin.register(MuscleGroup)
class MuscleGroupAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'created_at']
    search_fields = ['name']
    raw_id_fields = ['owner']
    filter_horizontal = ['muscle_groups']


@admin.register(WarmUpExercise)
class WarmUpExerciseAdmin(admin.ModelAdmin):
    list_display = ['name', 'duration_seconds']
    search_fields = ['name']
    filter_horizontal = ['muscle_groups']


@admin.register(Ladder)
class LadderAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'created_at']
    raw_id_fields = ['owner']


class LadderNodeInline(admin.TabularInline):
    model = LadderNode
    extra = 0
    raw_id_fields = ['exercise']


class CriterionInline(admin.TabularInline):
    model = Criterion
    extra = 0


@admin.register(LadderNode)
class LadderNodeAdmin(admin.ModelAdmin):
    list_display = ['exercise', 'ladder', 'level']
    list_filter = ['ladder']
    raw_id_fields = ['ladder', 'exercise']
    inlines = [CriterionInline]


@admin.register(Criterion)
class CriterionAdmin(admin.ModelAdmin):
    list_display = ['type', 'ladder_node', 'params']
    list_filter = ['type']


@admin.register(UserNodeProgress)
class UserNodeProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'ladder_node', 'achieved', 'achieved_at']
    list_filter = ['achieved']
    raw_id_fields = ['user', 'ladder_node']


@admin.register(WeeklyPlan)
class WeeklyPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'active', 'created_at']
    list_filter = ['active']
    raw_id_fields = ['owner']


@admin.register(PlanSlot)
class PlanSlotAdmin(admin.ModelAdmin):
    list_display = ['weekly_plan', 'day_of_week', 'order', 'ladder', 'exercise']
    list_filter = ['day_of_week']
    raw_id_fields = ['weekly_plan', 'ladder', 'exercise']


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'status', 'started_at', 'completed_at']
    list_filter = ['status', 'date']
    raw_id_fields = ['user']


class ExerciseSetInline(admin.TabularInline):
    model = ExerciseSet
    extra = 0


@admin.register(SessionExercise)
class SessionExerciseAdmin(admin.ModelAdmin):
    list_display = ['exercise', 'session', 'order', 'is_warmup']
    list_filter = ['is_warmup']
    raw_id_fields = ['session', 'exercise', 'ladder_node']
    inlines = [ExerciseSetInline]


@admin.register(ExerciseSet)
class ExerciseSetAdmin(admin.ModelAdmin):
    list_display = ['session_exercise', 'set_number', 'type', 'completed']
    list_filter = ['type', 'completed']
    raw_id_fields = ['session_exercise']
