from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'exercises', views.ExerciseViewSet, basename='exercise')
router.register(r'ladders', views.LadderViewSet, basename='ladder')
router.register(r'ladder-nodes', views.LadderNodeViewSet, basename='ladder-node')
router.register(r'progress', views.UserNodeProgressViewSet, basename='progress')
router.register(r'plans', views.WeeklyPlanViewSet, basename='plan')
router.register(r'sessions', views.WorkoutSessionViewSet, basename='session')
router.register(r'dashboard', views.DashboardView, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
