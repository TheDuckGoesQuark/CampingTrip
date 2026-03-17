import pytest
from apps.core.models import CampsiteUser
from apps.workout.models import WorkoutUser


@pytest.fixture
def user(db):
    return CampsiteUser.objects.create_user(
        username='testuser', email='test@example.com', password='testpass123'
    )


@pytest.fixture
def workout_user(user):
    wu, _ = WorkoutUser.objects.get_or_create(user=user)
    return wu


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def auth_client(api_client, user):
    from rest_framework.authtoken.models import Token
    token, _ = Token.objects.get_or_create(user=user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return api_client
