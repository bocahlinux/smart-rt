"""URL configuration for the Smart-RT project.

Base URL API: /api/v1/ — lihat docs/06-API-CONTRACT.md §1.1.
"""

from django.contrib import admin
from django.urls import include, path

from .views import healthz

api_v1_patterns = [
    path("healthz/", healthz, name="healthz"),
    # Routing per modul (auth, warga, keuangan, dst.) ditambahkan pada phase terkait
    # mengikuti docs/06-API-CONTRACT.md, mis.:
    # path("auth/", include("accounts.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1_patterns)),
]
