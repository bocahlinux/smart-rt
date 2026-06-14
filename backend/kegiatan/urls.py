from django.urls import path

from .views import KegiatanDetailView, KegiatanListCreateView, RSVPView

app_name = "kegiatan"

urlpatterns = [
    # PENTING: path literal (rsvp) setelah list, SEBELUM <uuid:pk>
    path("", KegiatanListCreateView.as_view(), name="kegiatan-list"),
    path("<uuid:pk>/rsvp/", RSVPView.as_view(), name="kegiatan-rsvp"),
    path("<uuid:pk>/", KegiatanDetailView.as_view(), name="kegiatan-detail"),
]
