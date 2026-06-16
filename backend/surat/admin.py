from django.contrib import admin

from .models import JenisSurat, PermohonanSurat


@admin.register(JenisSurat)
class JenisSuratAdmin(admin.ModelAdmin):
    list_display = ["kode", "nama", "is_active", "urutan"]
    list_editable = ["is_active", "urutan"]
    ordering = ["urutan", "nama"]


@admin.register(PermohonanSurat)
class PermohonanSuratAdmin(admin.ModelAdmin):
    list_display = ["pemohon", "jenis", "status", "created_at"]
    list_filter = ["status", "jenis"]
    search_fields = ["pemohon__email", "jenis__nama"]
    raw_id_fields = ["pemohon", "reviewed_by"]
