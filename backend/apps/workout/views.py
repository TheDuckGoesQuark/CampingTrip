import datetime

from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as drf_serializers
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Exercise,
    Ladder,
    LadderNode,
    SessionExercise,
    UserNodeProgress,
    WeeklyPlan,
    WorkoutSession,
    WorkoutUser,
)
from .progression import check_node_progress, update_user_progress
from .serializers import (
    CriterionSerializer,
    ExerciseSerializer,
    LadderDetailSerializer,
    LadderListSerializer,
    LadderNodeSerializer,
    UserNodeProgressSerializer,
    WeeklyPlanDetailSerializer,
    WeeklyPlanListSerializer,
    WorkoutSessionDetailSerializer,
    WorkoutSessionListSerializer,
)


def get_workout_user(request):
    """Get or create the WorkoutUser for the authenticated user."""
    workout_user, _ = WorkoutUser.objects.get_or_create(user=request.user)
    return workout_user


class ExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer

    def get_queryset(self):
        return Exercise.objects.filter(owner=get_workout_user(self.request))

    def perform_create(self, serializer):
        serializer.save(owner=get_workout_user(self.request))


class LadderViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Ladder.objects.filter(
            owner=get_workout_user(self.request)
        ).prefetch_related('nodes__exercise', 'nodes__criteria')

    def get_serializer_class(self):
        if self.action == 'list':
            return LadderListSerializer
        return LadderDetailSerializer

    def perform_create(self, serializer):
        serializer.save(owner=get_workout_user(self.request))

    @extend_schema(responses=inline_serializer(
        name='LadderProgressResponse',
        fields={
            'nodes': drf_serializers.ListField(
                child=drf_serializers.DictField()
            ),
        },
    ))
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Get progression status for all nodes in a ladder."""
        ladder = self.get_object()
        workout_user = get_workout_user(request)
        nodes = ladder.nodes.order_by('level').select_related('exercise')

        results = []
        for node in nodes:
            node_progress = check_node_progress(node, workout_user)
            user_progress = UserNodeProgress.objects.filter(
                user=workout_user, ladder_node=node,
            ).first()
            results.append({
                'node_id': node.id,
                'exercise_name': node.exercise.name,
                'level': node.level,
                'achieved': user_progress.achieved if user_progress else False,
                'achieved_at': user_progress.achieved_at if user_progress else None,
                'criteria': node_progress['criteria_met'],
                'criteria_total': node_progress['criteria_total'],
            })

        return Response({'nodes': results})


class LadderNodeViewSet(viewsets.ModelViewSet):
    serializer_class = LadderNodeSerializer

    def get_queryset(self):
        return LadderNode.objects.filter(
            ladder__owner=get_workout_user(self.request)
        ).select_related('exercise').prefetch_related('criteria', 'prerequisites')

    @action(detail=True, methods=['post'])
    def criteria(self, request, pk=None):
        node = self.get_object()
        serializer = CriterionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(ladder_node=node)
        return Response(serializer.data, status=201)

    @extend_schema(responses=inline_serializer(
        name='NodeProgressResponse',
        fields={
            'achieved': drf_serializers.BooleanField(),
            'criteria_met': drf_serializers.ListField(
                child=drf_serializers.DictField()
            ),
            'criteria_total': drf_serializers.IntegerField(),
        },
    ))
    @action(detail=True, methods=['get'], url_path='check-progress')
    def check_progress(self, request, pk=None):
        """Check progression status for a single node."""
        node = self.get_object()
        workout_user = get_workout_user(request)
        progress = check_node_progress(node, workout_user)
        return Response(progress)


class UserNodeProgressViewSet(viewsets.ModelViewSet):
    serializer_class = UserNodeProgressSerializer

    def get_queryset(self):
        return UserNodeProgress.objects.filter(
            user=get_workout_user(self.request)
        ).select_related('ladder_node__exercise')

    def perform_create(self, serializer):
        serializer.save(user=get_workout_user(self.request))


class WeeklyPlanViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return WeeklyPlan.objects.filter(
            owner=get_workout_user(self.request)
        ).prefetch_related('slots__ladder', 'slots__exercise')

    def get_serializer_class(self):
        if self.action == 'list':
            return WeeklyPlanListSerializer
        return WeeklyPlanDetailSerializer

    def perform_create(self, serializer):
        serializer.save(owner=get_workout_user(self.request))


def resolve_ladder_exercise(ladder, workout_user):
    """Pick the current exercise from a ladder based on user's progress.

    Returns the exercise from the highest achieved node + 1 level,
    or the first node if no progress exists.
    """
    nodes = ladder.nodes.order_by('level')
    if not nodes.exists():
        return None, None

    achieved_ids = set(
        UserNodeProgress.objects.filter(
            user=workout_user, achieved=True,
            ladder_node__ladder=ladder,
        ).values_list('ladder_node_id', flat=True)
    )

    # Find first unachieved node (current working level)
    for node in nodes:
        if node.id not in achieved_ids:
            return node.exercise, node

    # All achieved — use the highest node
    last = nodes.last()
    return last.exercise, last


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return WorkoutSession.objects.filter(
            user=get_workout_user(self.request)
        ).prefetch_related(
            'exercises__exercise',
            'exercises__sets',
            'exercises__ladder_node',
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkoutSessionListSerializer
        return WorkoutSessionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(user=get_workout_user(self.request))

    @extend_schema(responses=inline_serializer(
        name='CompleteSessionResponse',
        fields={
            'session': WorkoutSessionDetailSerializer(),
            'progression_updates': drf_serializers.ListField(
                child=drf_serializers.DictField()
            ),
        },
    ))
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete a session and evaluate ladder progression."""
        session = self.get_object()
        session.status = 'completed'
        session.completed_at = datetime.datetime.now(tz=datetime.timezone.utc)
        session.save()

        workout_user = get_workout_user(request)
        progression_updates = []
        for se in session.exercises.filter(
            ladder_node__isnull=False
        ).select_related('ladder_node__exercise'):
            progress = update_user_progress(se.ladder_node, workout_user)
            if progress.achieved:
                progression_updates.append({
                    'node_id': se.ladder_node.id,
                    'exercise_name': se.ladder_node.exercise.name,
                    'achieved': True,
                })

        session = self.get_queryset().get(pk=session.pk)
        serializer = WorkoutSessionDetailSerializer(session)
        return Response({
            'session': serializer.data,
            'progression_updates': progression_updates,
        })

    @extend_schema(
        request=inline_serializer(
            name='GenerateSessionRequest',
            fields={
                'date': drf_serializers.DateField(required=False),
            },
        ),
        responses={201: WorkoutSessionDetailSerializer},
    )
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a workout session from the active weekly plan."""
        workout_user = get_workout_user(request)
        target_date = request.data.get('date')
        if target_date:
            target_date = datetime.date.fromisoformat(target_date)
        else:
            target_date = datetime.date.today()

        plan = WeeklyPlan.objects.filter(
            owner=workout_user, active=True
        ).prefetch_related(
            'slots__ladder__nodes__exercise',
            'slots__exercise',
        ).first()

        if not plan:
            return Response(
                {'detail': 'No active weekly plan found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        day_of_week = target_date.weekday()
        slots = plan.slots.filter(day_of_week=day_of_week).order_by('order')

        if not slots.exists():
            return Response(
                {'detail': f'No exercises planned for {target_date.strftime("%A")}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = WorkoutSession.objects.create(
            user=workout_user,
            date=target_date,
            status='in_progress',
            started_at=datetime.datetime.now(tz=datetime.timezone.utc),
        )

        for i, slot in enumerate(slots):
            if slot.ladder:
                exercise, ladder_node = resolve_ladder_exercise(
                    slot.ladder, workout_user
                )
                if not exercise:
                    continue
            else:
                exercise = slot.exercise
                ladder_node = None

            SessionExercise.objects.create(
                session=session,
                exercise=exercise,
                ladder_node=ladder_node,
                order=i + 1,
            )

        # Re-fetch with prefetches for serialization
        session = self.get_queryset().get(pk=session.pk)
        serializer = WorkoutSessionDetailSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DashboardView(viewsets.ViewSet):
    """Aggregated stats computed from session logs."""

    @extend_schema(responses=inline_serializer(
        name='DashboardResponse',
        fields={
            'total_sessions': drf_serializers.IntegerField(),
            'completed_sessions': drf_serializers.IntegerField(),
            'total_ladders': drf_serializers.IntegerField(),
            'achieved_nodes': drf_serializers.IntegerField(),
            'today_session': WorkoutSessionDetailSerializer(required=False, allow_null=True),
            'today_plan_exercises': drf_serializers.ListField(
                child=drf_serializers.DictField(), required=False
            ),
        },
    ))
    def list(self, request):
        workout_user = get_workout_user(request)
        today = datetime.date.today()
        sessions = WorkoutSession.objects.filter(user=workout_user)

        total_sessions = sessions.count()
        completed_sessions = sessions.filter(status='completed').count()
        total_ladders = Ladder.objects.filter(owner=workout_user).count()
        achieved_nodes = UserNodeProgress.objects.filter(
            user=workout_user, achieved=True
        ).count()

        # Today's active/in-progress session
        today_session = sessions.filter(
            date=today, status__in=['in_progress', 'planned']
        ).prefetch_related(
            'exercises__exercise', 'exercises__sets', 'exercises__ladder_node',
        ).first()

        today_session_data = None
        if today_session:
            today_session_data = WorkoutSessionDetailSerializer(today_session).data

        # Today's planned exercises from active plan
        today_plan_exercises = []
        plan = WeeklyPlan.objects.filter(
            owner=workout_user, active=True
        ).prefetch_related('slots__ladder__nodes__exercise', 'slots__exercise').first()

        if plan:
            day_of_week = today.weekday()
            for slot in plan.slots.filter(day_of_week=day_of_week).order_by('order'):
                if slot.ladder:
                    exercise, node = resolve_ladder_exercise(slot.ladder, workout_user)
                    if exercise:
                        today_plan_exercises.append({
                            'exercise_name': exercise.name,
                            'exercise_id': exercise.id,
                            'ladder_name': slot.ladder.name,
                            'ladder_node_id': node.id if node else None,
                            'from_ladder': True,
                        })
                elif slot.exercise:
                    today_plan_exercises.append({
                        'exercise_name': slot.exercise.name,
                        'exercise_id': slot.exercise.id,
                        'from_ladder': False,
                        'exercise_params': slot.exercise_params,
                    })

        return Response({
            'total_sessions': total_sessions,
            'completed_sessions': completed_sessions,
            'total_ladders': total_ladders,
            'achieved_nodes': achieved_nodes,
            'today_session': today_session_data,
            'today_plan_exercises': today_plan_exercises,
        })
