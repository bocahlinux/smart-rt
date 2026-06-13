"""URL configuration for the Smart-RT project.

Base URL API: /api/v1/ — lihat docs/06-API-CONTRACT.md §1.1.
"""

from django.contrib import admin
from django.urls import include, path

from .views import healthz

api_v1_patterns = [
    path("healthz/", healthz, name="healthz"),
    path("auth/", include("accounts.urls")),
    path("warga/", include("accounts.warga_urls")),
    # Routing modul lain (keuangan, dst.) ditambahkan pada phase terkait
    # mengikuti docs/06-API-CONTRACT.md.
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1_patterns)),
]
