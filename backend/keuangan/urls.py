"""URL patterns untuk modul keuangan RT.

Endpoints:
  /keuangan/              — List & create transaksi
  /keuangan/<id>/         — Retrieve, update, delete transaksi
  /keuangan/laporan/      — Laporan PDF/JSON
  /keuangan/dashboard/    — Dashboard saldo
  /keuangan/kategori/     — CRUD kategori
  /iuran/upload/          — Upload bukti iuran (warga)
  /iuran/<id>/confirm/    — Konfirmasi/tolak iuran (bendahara)
  /iuran/saya/            — Riwayat iuran milik warga
  /iuran/                 — List semua iuran (bendahara/admin)
  /iuran/<id>/            — Detail iuran
"""

import re

from django.urls import path, re_path

from .views import BukuKasView, DashboardKeuanganView, IuranWargaViewSet, JenisIuranViewSet, KategoriTransaksiViewSet, PengaturanIuranView, TransaksiViewSet

UUID = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

app_name = "keuangan"

transaksi_list = TransaksiViewSet.as_view({"get": "list", "post": "create"})
transaksi_detail = TransaksiViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"})
transaksi_laporan = TransaksiViewSet.as_view({"get": "laporan"})

kategori_list = KategoriTransaksiViewSet.as_view({"get": "list", "post": "create"})
kategori_detail = KategoriTransaksiViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"})

iuran_list = IuranWargaViewSet.as_view({"get": "list"})
iuran_upload = IuranWargaViewSet.as_view({"post": "upload"})
iuran_saya = IuranWargaViewSet.as_view({"get": "saya"})
iuran_pending_count = IuranWargaViewSet.as_view({"get": "pending_count"})
iuran_detail = IuranWargaViewSet.as_view({"get": "retrieve"})
iuran_confirm = IuranWargaViewSet.as_view({"put": "confirm"})

jenis_iuran_list = JenisIuranViewSet.as_view({"get": "list", "post": "create"})
jenis_iuran_detail = JenisIuranViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"})

urlpatterns = [
    # Buku Kas (semua user login)
    path("keuangan/buku-kas/", BukuKasView.as_view(), name="buku-kas"),

    # Transaksi
    path("keuangan/", transaksi_list, name="transaksi-list"),
    path("keuangan/laporan/", transaksi_laporan, name="transaksi-laporan"),
    path("keuangan/dashboard/", DashboardKeuanganView.as_view(), name="dashboard-keuangan"),
    path("keuangan/kategori/", kategori_list, name="kategori-list"),
    path("keuangan/pengaturan-iuran/", PengaturanIuranView.as_view(), name="pengaturan-iuran"),
    re_path(rf"^keuangan/kategori/(?P<pk>{UUID})/$", kategori_detail, name="kategori-detail"),
    re_path(rf"^keuangan/(?P<pk>{UUID})/$", transaksi_detail, name="transaksi-detail"),

    # Jenis Iuran
    path("iuran/jenis/", jenis_iuran_list, name="jenis-iuran-list"),
    re_path(rf"^iuran/jenis/(?P<pk>{UUID})/$", jenis_iuran_detail, name="jenis-iuran-detail"),

    # Iuran
    path("iuran/", iuran_list, name="iuran-list"),
    path("iuran/upload/", iuran_upload, name="iuran-upload"),
    path("iuran/saya/", iuran_saya, name="iuran-saya"),
    path("iuran/pending-count/", iuran_pending_count, name="iuran-pending-count"),
    re_path(rf"^iuran/(?P<pk>{UUID})/$", iuran_detail, name="iuran-detail"),
    re_path(rf"^iuran/(?P<pk>{UUID})/confirm/$", iuran_confirm, name="iuran-confirm"),
]
