"""URL patterns untuk app pengaduan.

Sesuai API contract §7 di docs/06-API-CONTRACT.md:
  GET/POST  /pengaduan/            → PengaduanListCreateView
  GET       /pengaduan/saya/       → PengaduanSayaView  (path literal HARUS sebelum <uuid:pk>)
  GET/DEL   /pengaduan/:id/        → PengaduanDetailView
  PUT       /pengaduan/:id/status/ → PengaduanStatusUpdateView
"""

app_name = "pengaduan"

from django.urls import path

from .views import (
    PengaduanDetailView,
    PengaduanListCreateView,
    PengaduanSayaView,
    PengaduanStatusUpdateView,
)

urlpatterns = [
    # Path literal HARUS sebelum <uuid:pk> untuk menghindari konflik routing
    path("pengaduan/saya/", PengaduanSayaView.as_view(), name="pengaduan-saya"),
    # CRUD utama
    path("pengaduan/", PengaduanListCreateView.as_view(), name="pengaduan-list-create"),
    path("pengaduan/<uuid:pk>/", PengaduanDetailView.as_view(), name="pengaduan-detail"),
    path("pengaduan/<uuid:pk>/status/", PengaduanStatusUpdateView.as_view(), name="pengaduan-status"),
]
