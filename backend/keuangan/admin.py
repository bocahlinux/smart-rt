from django.contrib import admin

from .models import IuranWarga, KategoriTransaksi, Transaksi


@admin.register(KategoriTransaksi)
class KategoriTransaksiAdmin(admin.ModelAdmin):
    list_display = ["nama", "tipe", "created_at"]
    list_filter = ["tipe"]


@admin.register(Transaksi)
class TransaksiAdmin(admin.ModelAdmin):
    list_display = ["kategori", "jumlah", "tipe", "tanggal", "status", "created_by"]
    list_filter = ["tipe", "status"]
    date_hierarchy = "tanggal"


@admin.register(IuranWarga)
class IuranWargaAdmin(admin.ModelAdmin):
    list_display = ["warga", "bulan", "tahun", "jumlah", "status", "confirmed_by"]
    list_filter = ["status", "tahun", "bulan"]
