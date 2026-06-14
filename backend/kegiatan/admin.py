from django.contrib import admin

from .models import Kegiatan, RSVP


@admin.register(Kegiatan)
class KegiatanAdmin(admin.ModelAdmin):
    list_display = ["nama", "tanggal", "lokasi", "penanggung_jawab", "created_by", "created_at"]
    list_filter = ["tanggal"]
    search_fields = ["nama", "lokasi", "deskripsi"]
    readonly_fields = ["id", "created_at", "updated_at", "created_by"]
    ordering = ["tanggal"]

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(RSVP)
class RSVPAdmin(admin.ModelAdmin):
    list_display = ["kegiatan", "user", "status", "created_at"]
    list_filter = ["status", "kegiatan"]
    search_fields = ["user__email", "kegiatan__nama"]
    readonly_fields = ["id", "created_at"]
