from celery import shared_task


@shared_task
def example_task():
    """Example Celery task — replace or delete when building a real app."""
    return {'status': 'done'}
