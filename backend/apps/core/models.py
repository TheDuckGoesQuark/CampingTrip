from django.contrib.auth.models import AbstractUser
from django.db import models


class CampsiteUser(AbstractUser):
    """
    Custom user model for campsite.
    Extends Django's AbstractUser to allow for future customizations.
    """

    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username

    class Meta:
        db_table = 'campsite_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
