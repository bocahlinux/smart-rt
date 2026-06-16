from django.urls import path

from .views import (
    JenisSuratListView,
    PermohonanSuratDetailView,
    PermohonanSuratListCreateView,
    PermohonanReviewView,
    SuratPDFView,
    PengaturanRTView,
    PengaturanRTTTDView,
)

urlpatterns = [
    path("surat/jenis/", JenisSuratListView.as_view(), name="jenis-surat-list"),
    path("surat/permohonan/", PermohonanSuratListCreateView.as_view(), name="permohonan-surat-list"),
    path("surat/permohonan/<uuid:pk>/", PermohonanSuratDetailView.as_view(), name="permohonan-surat-detail"),
    path("surat/permohonan/<uuid:pk>/review/", PermohonanReviewView.as_view(), name="permohonan-surat-review"),
    path("surat/permohonan/<uuid:pk>/pdf/", SuratPDFView.as_view(), name="permohonan-surat-pdf"),
    path("surat/pengaturan/", PengaturanRTView.as_view(), name="pengaturan-rt"),
    path("surat/pengaturan/ttd/", PengaturanRTTTDView.as_view(), name="pengaturan-rt-ttd"),
]
