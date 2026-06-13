from django.contrib import admin

from .models import Pengumuman


@admin.register(Pengumuman)
class PengumumanAdmin(admin.ModelAdmin):
    list_display = ["judul", "kategori", "is_published", "scheduled_at", "created_by", "created_at"]
    list_filter = ["kategori", "is_published"]
    search_fields = ["judul", "isi"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering = ["-created_at"]
