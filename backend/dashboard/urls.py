from django.urls import path

from .views import DashboardPengurusView, DashboardWargaView

urlpatterns = [
    path("pengurus/", DashboardPengurusView.as_view()),
    path("warga/", DashboardWargaView.as_view()),
]
