from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import WorkoutUser


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_workout_user(sender, instance, created, **kwargs):
    """Auto-create a WorkoutUser when a new CampsiteUser is created."""
    if created:
        WorkoutUser.objects.create(user=instance)
