"""URL configuration for the Smart-RT project.

Base URL API: /api/v1/ — lihat docs/06-API-CONTRACT.md §1.1.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from .views import healthz

api_v1_patterns = [
    path("healthz/", healthz, name="healthz"),
    path("auth/", include("accounts.urls")),
    path("warga/", include("accounts.warga_urls")),
    path("", include("keuangan.urls")),
    path("", include("pengumuman.urls")),
    path("", include("notifications.urls")),
    path("", include("forum.urls")),
    path("", include("pengaduan.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1_patterns)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
