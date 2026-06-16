from django.urls import path

from .views import (
    JenisSuratListView,
    PermohonanSuratDetailView,
    PermohonanSuratListCreateView,
    PermohonanReviewView,
)

urlpatterns = [
    path("surat/jenis/", JenisSuratListView.as_view(), name="jenis-surat-list"),
    path("surat/permohonan/", PermohonanSuratListCreateView.as_view(), name="permohonan-surat-list"),
    path("surat/permohonan/<uuid:pk>/", PermohonanSuratDetailView.as_view(), name="permohonan-surat-detail"),
    path("surat/permohonan/<uuid:pk>/review/", PermohonanReviewView.as_view(), name="permohonan-surat-review"),
]
