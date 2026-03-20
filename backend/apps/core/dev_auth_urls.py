"""Dev-only auth bypass — creates a test user and returns a token.
Only included in URL config when DEBUG=True."""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from rest_framework.authtoken.models import Token


def dev_login(request):
    if not settings.DEBUG:
        return JsonResponse({'detail': 'Not available'}, status=404)

    User = get_user_model()
    user, _ = User.objects.get_or_create(
        username='dev',
        defaults={'email': 'dev@localhost', 'first_name': 'Dev', 'last_name': 'User'},
    )
    token, _ = Token.objects.get_or_create(user=user)

    return JsonResponse({
        'key': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        },
    })


from django.urls import path

urlpatterns = [
    path('', dev_login, name='dev_login'),
]
