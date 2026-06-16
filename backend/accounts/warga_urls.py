"""URL routing untuk Warga endpoints — lihat docs/06-API-CONTRACT.md §3.

Pola URL didaftarkan secara eksplisit (tanpa router) agar tidak ada ambigu
antara non-detail actions (export/import) dan pola {pk} UUID.
"""

from django.urls import path, re_path

from .warga_views import WargaViewSet, ProfilSayaView

_UUID = r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"

warga_list    = WargaViewSet.as_view({"get": "list", "post": "create"})
warga_detail  = WargaViewSet.as_view(
    {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
)
warga_verify  = WargaViewSet.as_view({"put": "verify"})
warga_export  = WargaViewSet.as_view({"get": "export"})
warga_import  = WargaViewSet.as_view({"post": "import_excel"})
warga_deleted = WargaViewSet.as_view({"get": "deleted"})
warga_restore = WargaViewSet.as_view({"put": "restore"})
warga_unlink  = WargaViewSet.as_view({"post": "unlink"})
warga_link    = WargaViewSet.as_view({"post": "link"})

# Non-detail actions dulu — sebelum pola {pk} — agar string literal tidak
# salah di-resolve sebagai UUID.
urlpatterns = [
    path("profil-saya/", ProfilSayaView.as_view(), name="warga-profil-saya"),
    path("export/",  warga_export,  name="warga-export"),
    path("import/",  warga_import,  name="warga-import"),
    path("deleted/", warga_deleted, name="warga-deleted"),
    re_path(rf"^(?P<pk>{_UUID})/verify/$",  warga_verify,  name="warga-verify"),
    re_path(rf"^(?P<pk>{_UUID})/restore/$", warga_restore, name="warga-restore"),
    re_path(rf"^(?P<pk>{_UUID})/unlink/$",  warga_unlink,  name="warga-unlink"),
    re_path(rf"^(?P<pk>{_UUID})/link/$",    warga_link,    name="warga-link"),
    re_path(rf"^(?P<pk>{_UUID})/$",         warga_detail,  name="warga-detail"),
    path("", warga_list, name="warga-list"),
]
