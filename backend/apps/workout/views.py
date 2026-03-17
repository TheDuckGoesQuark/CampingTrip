from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as drf_serializers
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Exercise,
    Ladder,
    LadderNode,
    UserNodeProgress,
    WeeklyPlan,
    WorkoutSession,
    WorkoutUser,
)
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


class DashboardView(viewsets.ViewSet):
    """Aggregated stats computed from session logs."""

    @extend_schema(responses=inline_serializer(
        name='DashboardResponse',
        fields={
            'total_sessions': drf_serializers.IntegerField(),
            'completed_sessions': drf_serializers.IntegerField(),
            'total_ladders': drf_serializers.IntegerField(),
            'achieved_nodes': drf_serializers.IntegerField(),
        },
    ))
    def list(self, request):
        workout_user = get_workout_user(request)
        sessions = WorkoutSession.objects.filter(user=workout_user)

        total_sessions = sessions.count()
        completed_sessions = sessions.filter(status='completed').count()
        total_ladders = Ladder.objects.filter(owner=workout_user).count()
        achieved_nodes = UserNodeProgress.objects.filter(
            user=workout_user, achieved=True
        ).count()

        return Response({
            'total_sessions': total_sessions,
            'completed_sessions': completed_sessions,
            'total_ladders': total_ladders,
            'achieved_nodes': achieved_nodes,
        })
