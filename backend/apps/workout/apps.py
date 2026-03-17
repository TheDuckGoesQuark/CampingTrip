from django.apps import AppConfig


class WorkoutConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.workout'
    verbose_name = 'Workout Tracker'

    def ready(self):
        import apps.workout.signals  # noqa: F401
