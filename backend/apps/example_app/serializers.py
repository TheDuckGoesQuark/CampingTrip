from rest_framework import serializers
from .models import ExampleItem


class ExampleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExampleItem
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
