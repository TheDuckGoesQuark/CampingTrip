from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'items', views.ExampleItemViewSet)

urlpatterns = router.urls
