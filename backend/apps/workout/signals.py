from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import WorkoutUser


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_workout_user(sender, instance, created, **kwargs):
    """Auto-create a WorkoutUser and copy default ladders when a new user is created."""
    if created:
        workout_user = WorkoutUser.objects.create(user=instance)
        # Copy seed data (ladders, exercises, weekly plan) if it exists
        from .management.commands.seed_default_ladders import copy_defaults_to_user

        copy_defaults_to_user(workout_user)
