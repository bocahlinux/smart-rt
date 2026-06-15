from django.contrib import admin

from .models import (
    KartuKeluarga,
    PengajuanAnggotaBaru,
    PengajuanPenghapusanAnggota,
    PengajuanPerubahanWarga,
)


@admin.register(KartuKeluarga)
class KartuKeluargaAdmin(admin.ModelAdmin):
    list_display = ["no_kk", "alamat", "created_by", "created_at"]
    search_fields = ["no_kk"]


@admin.register(PengajuanAnggotaBaru)
class PengajuanAnggotaBaruAdmin(admin.ModelAdmin):
    list_display = ["kartu_keluarga", "pengaju", "status", "created_at"]
    list_filter = ["status"]


@admin.register(PengajuanPenghapusanAnggota)
class PengajuanPenghapusanAdmin(admin.ModelAdmin):
    list_display = ["warga_target", "kartu_keluarga", "pengaju", "status", "created_at"]
    list_filter = ["status"]


@admin.register(PengajuanPerubahanWarga)
class PengajuanPerubahanAdmin(admin.ModelAdmin):
    list_display = ["warga_target", "pengaju", "status", "created_at"]
    list_filter = ["status"]
