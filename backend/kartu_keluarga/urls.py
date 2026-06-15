from rest_framework.routers import DefaultRouter

from .views import (
    KartuKeluargaViewSet,
    PengajuanAnggotaBaruViewSet,
    PengajuanPenghapusanViewSet,
    PengajuanPerubahanViewSet,
)

router = DefaultRouter()
router.register("kk", KartuKeluargaViewSet, basename="kartu-keluarga")
router.register("kk/pengajuan/tambah", PengajuanAnggotaBaruViewSet, basename="pengajuan-tambah")
router.register("kk/pengajuan/hapus", PengajuanPenghapusanViewSet, basename="pengajuan-hapus")
router.register("kk/pengajuan/ubah", PengajuanPerubahanViewSet, basename="pengajuan-ubah")

urlpatterns = router.urls
