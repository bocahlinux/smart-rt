from django.contrib import admin

from .models import Pengaduan


@admin.register(Pengaduan)
class PengaduanAdmin(admin.ModelAdmin):
    """Django admin untuk Pengaduan warga."""

    list_display = ["judul", "kategori", "status", "warga", "created_at"]
    list_filter = ["kategori", "status", "created_at"]
    search_fields = ["judul", "deskripsi", "warga__email"]
    readonly_fields = ["id", "status_history", "created_at", "updated_at"]
    ordering = ["-created_at"]
