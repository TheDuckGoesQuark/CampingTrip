"""
Celery application configuration for campsite.
"""
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campsite.settings')

app = Celery('campsite')

# Load config from Django settings; all Celery config keys must be prefixed CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks.py in each installed app
app.autodiscover_tasks()
