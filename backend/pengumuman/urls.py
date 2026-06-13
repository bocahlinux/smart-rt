from django.urls import path

from .views import PengumumanDetailView, PengumumanListCreateView

app_name = "pengumuman"

urlpatterns = [
    path("pengumuman/", PengumumanListCreateView.as_view(), name="list-create"),
    path(
        "pengumuman/<uuid:pk>/",
        PengumumanDetailView.as_view(),
        name="detail",
    ),
]
