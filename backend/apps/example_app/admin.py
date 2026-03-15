from django.contrib import admin
from .models import ExampleItem


@admin.register(ExampleItem)
class ExampleItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
