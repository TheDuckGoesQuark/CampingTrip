"""
URL configuration for campsite project.

Root URL config — includes each app's URLs.
"""
from apps.core.views import health_check
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Health check (no auth, used by deploy verification)
    path('health/', health_check, name='health_check'),

    # Django admin
    path('manage-campsite/', admin.site.urls),

    # Authentication
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('accounts/', include('allauth.urls')),

    # Core API (status, etc.)
    path('api/', include('apps.core.urls')),

    # Workout tracker
    path('api/workout/', include('apps.workout.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
