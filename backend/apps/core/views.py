import os

from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


def health_check(request):
    """Simple health check endpoint for deploy verification."""
    return JsonResponse({'status': 'healthy'})


class StatusView(APIView):
    """Authenticated status endpoint with version info."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'status': 'healthy',
            'version': os.getenv('COMMIT_HASH', 'dev'),
        })
