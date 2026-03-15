from rest_framework import serializers
from .models import CampsiteUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampsiteUser
        fields = ['id', 'username', 'email']
        read_only_fields = ['id']
