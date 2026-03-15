from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import ExampleItem
from .serializers import ExampleItemSerializer


class ExampleItemViewSet(viewsets.ModelViewSet):
    """Example ViewSet — replace or delete when building a real app."""
    queryset = ExampleItem.objects.all()
    serializer_class = ExampleItemSerializer
    permission_classes = [IsAuthenticated]
