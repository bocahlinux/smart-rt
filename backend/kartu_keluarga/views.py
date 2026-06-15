from django.utils import timezone
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin

from accounts.models import WargaProfile
from accounts.permissions import has_perm
from accounts.utils import error_response, success_response
from notifications.services import notify_user, notify_admins

from .models import (
    KartuKeluarga,
    PengajuanAnggotaBaru,
    PengajuanPenghapusanAnggota,
    PengajuanPerubahanWarga,
)
from .serializers import (
    KartuKeluargaSerializer,
    KartuKeluargaWriteSerializer,
    PengajuanAnggotaBaruSerializer,
    PengajuanPenghapusanSerializer,
    PengajuanPerubahanSerializer,
)

def _is_approver(user):
    return has_perm(user, "kelola_kartu_keluarga")


def _warga_kk(user):
    try:
        return user.profile.kartu_keluarga
    except Exception:
        return None


# ── KartuKeluarga ─────────────────────────────────────────────────────────────

class KartuKeluargaViewSet(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if _is_approver(user):
            return KartuKeluarga.objects.prefetch_related("anggota").all()
        kk = _warga_kk(user)
        if kk:
            return KartuKeluarga.objects.prefetch_related("anggota").filter(pk=kk.pk)
        return KartuKeluarga.objects.none()

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = KartuKeluargaSerializer(qs, many=True)
        return success_response(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = KartuKeluargaSerializer(instance)
        return success_response(data=serializer.data)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return KartuKeluargaWriteSerializer
        return KartuKeluargaSerializer

    def create(self, request, *args, **kwargs):
        if not _is_approver(request.user):
            return error_response("PERMISSION_DENIED", "Hanya admin/sekretaris/pengurus yang dapat membuat KK.", status_code=403)
        ser = KartuKeluargaWriteSerializer(data=request.data, context={"request": request})
        if not ser.is_valid():
            return error_response("VALIDATION_ERROR", "Data tidak valid.", errors=[
                {"field": f, "message": str(m[0])} for f, m in ser.errors.items()
            ], status_code=400)
        kk = ser.save()
        return success_response(
            data=KartuKeluargaSerializer(kk).data,
            message="Kartu Keluarga berhasil dibuat.",
            status_code=201,
        )

    def update(self, request, *args, **kwargs):
        if not _is_approver(request.user):
            return error_response("PERMISSION_DENIED", "Hanya admin/sekretaris/pengurus yang dapat mengubah KK.", status_code=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not has_perm(request.user, "kelola_kartu_keluarga"):
            return error_response("PERMISSION_DENIED", "Anda tidak memiliki izin untuk menghapus KK.", status_code=403)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["get"], url_path=r"cari/(?P<no_kk>[0-9]{16})")
    def cari_by_no_kk(self, request, no_kk=None):
        try:
            kk = KartuKeluarga.objects.get(no_kk=no_kk)
            return success_response(data=KartuKeluargaSerializer(kk).data)
        except KartuKeluarga.DoesNotExist:
            return error_response("NOT_FOUND", "Nomor KK tidak ditemukan.", status_code=404)

    @action(detail=False, methods=["get"], url_path="saya")
    def kk_saya(self, request):
        kk = _warga_kk(request.user)
        if not kk:
            return error_response("NOT_FOUND", "Anda belum terhubung ke Kartu Keluarga.", status_code=404)
        return success_response(data=KartuKeluargaSerializer(kk).data)


# ── Pengajuan Tambah Anggota ──────────────────────────────────────────────────

class PengajuanAnggotaBaruViewSet(
    CreateModelMixin, ListModelMixin, RetrieveModelMixin, GenericViewSet
):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PengajuanAnggotaBaruSerializer

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = PengajuanAnggotaBaruSerializer(qs, many=True, context={"request": request})
        return success_response(data=serializer.data)

    def get_queryset(self):
        user = self.request.user
        if _is_approver(user):
            qs = PengajuanAnggotaBaru.objects.select_related(
                "kartu_keluarga", "pengaju", "reviewed_by"
            ).all()
            status_filter = self.request.query_params.get("status")
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs
        kk = _warga_kk(user)
        if kk:
            return PengajuanAnggotaBaru.objects.filter(kartu_keluarga=kk).select_related(
                "kartu_keluarga", "pengaju", "reviewed_by"
            )
        return PengajuanAnggotaBaru.objects.none()

    def create(self, request, *args, **kwargs):
        kk_id = request.data.get("kartuKeluargaId")
        user = request.user
        if not _is_approver(user):
            kk = _warga_kk(user)
            if not kk or str(kk.id) != str(kk_id):
                return error_response("PERMISSION_DENIED", "Anda hanya dapat mengajukan untuk KK Anda sendiri.", status_code=403)

        ser = PengajuanAnggotaBaruSerializer(data=request.data, context={"request": request})
        if not ser.is_valid():
            return error_response("VALIDATION_ERROR", "Data tidak valid.", errors=[
                {"field": f, "message": str(m[0])} for f, m in ser.errors.items()
            ], status_code=400)
        pengajuan = ser.save()

        notify_admins(
            judul="Pengajuan Tambah Anggota KK",
            isi=f"{user.email} mengajukan penambahan anggota KK {pengajuan.kartu_keluarga.no_kk}.",
            url="/pengajuan",
        )
        return success_response(
            data=PengajuanAnggotaBaruSerializer(pengajuan, context={"request": request}).data,
            message="Pengajuan berhasil dikirim. Menunggu persetujuan admin.",
            status_code=201,
        )

    @action(detail=True, methods=["post"], url_path="review")
    def review(self, request, pk=None):
        if not _is_approver(request.user):
            return error_response("PERMISSION_DENIED", "Tidak memiliki akses.", status_code=403)

        pengajuan = self.get_object()
        if pengajuan.status != "pending":
            return error_response("ALREADY_REVIEWED", "Pengajuan sudah diproses.", status_code=400)

        aksi = request.data.get("aksi")
        catatan = request.data.get("catatan", "")
        if aksi not in ("setujui", "tolak"):
            return error_response("VALIDATION_ERROR", "Aksi harus 'setujui' atau 'tolak'.", status_code=400)

        pengajuan.status = "disetujui" if aksi == "setujui" else "ditolak"
        pengajuan.catatan_admin = catatan
        pengajuan.reviewed_by = request.user
        pengajuan.reviewed_at = timezone.now()
        pengajuan.save()

        if aksi == "setujui":
            _buat_warga_dari_pengajuan(pengajuan.data_anggota, pengajuan.kartu_keluarga, request.user)

        status_label = "disetujui" if aksi == "setujui" else "ditolak"
        notify_user(
            user=pengajuan.pengaju,
            judul=f"Pengajuan Tambah Anggota {status_label.capitalize()}",
            isi=(
                f"Pengajuan penambahan anggota KK {pengajuan.kartu_keluarga.no_kk} telah {status_label}."
                + (f" Catatan: {catatan}" if catatan else "")
            ),
            url="/kk/saya",
        )
        return success_response(message=f"Pengajuan berhasil {status_label}.")


def _buat_warga_dari_pengajuan(data: dict, kk: KartuKeluarga, admin_user):
    allowed = {
        "nama_lengkap", "nik", "tempat_lahir", "tanggal_lahir",
        "jenis_kelamin", "agama", "status_perkawinan", "pendidikan",
        "pekerjaan", "blok", "no_rumah", "alamat", "status",
    }
    profile_data = {k: v for k, v in data.items() if k in allowed}
    profile_data.setdefault("status", "aktif")
    hubungan = data.get("hubungan_keluarga", "lainnya")

    try:
        WargaProfile.objects.create(
            user=None,
            kartu_keluarga=kk,
            hubungan_keluarga=hubungan,
            **profile_data,
        )
    except Exception:
        pass


# ── Pengajuan Penghapusan ─────────────────────────────────────────────────────

class PengajuanPenghapusanViewSet(
    CreateModelMixin, ListModelMixin, RetrieveModelMixin, GenericViewSet
):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PengajuanPenghapusanSerializer

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = PengajuanPenghapusanSerializer(qs, many=True, context={"request": request})
        return success_response(data=serializer.data)

    def get_queryset(self):
        user = self.request.user
        if _is_approver(user):
            qs = PengajuanPenghapusanAnggota.objects.select_related(
                "kartu_keluarga", "warga_target", "pengaju", "reviewed_by"
            ).all()
            status_filter = self.request.query_params.get("status")
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs
        kk = _warga_kk(user)
        if kk:
            return PengajuanPenghapusanAnggota.objects.filter(
                kartu_keluarga=kk
            ).select_related("kartu_keluarga", "warga_target", "pengaju", "reviewed_by")
        return PengajuanPenghapusanAnggota.objects.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if not _is_approver(user):
            kk = _warga_kk(user)
            kk_id = request.data.get("kartuKeluargaId")
            if not kk or str(kk.id) != str(kk_id):
                return error_response("PERMISSION_DENIED", "Anda hanya dapat mengajukan untuk KK Anda sendiri.", status_code=403)

        ser = PengajuanPenghapusanSerializer(data=request.data, context={"request": request})
        if not ser.is_valid():
            return error_response("VALIDATION_ERROR", "Data tidak valid.", errors=[
                {"field": f, "message": str(m[0])} for f, m in ser.errors.items()
            ], status_code=400)
        pengajuan = ser.save()

        notify_admins(
            judul="Pengajuan Penghapusan Anggota KK",
            isi=f"{user.email} mengajukan penghapusan {pengajuan.warga_target.nama_lengkap} dari KK {pengajuan.kartu_keluarga.no_kk}.",
            url="/pengajuan",
        )
        return success_response(
            data=PengajuanPenghapusanSerializer(pengajuan, context={"request": request}).data,
            message="Pengajuan penghapusan berhasil dikirim.",
            status_code=201,
        )

    @action(detail=True, methods=["post"], url_path="review")
    def review(self, request, pk=None):
        if not _is_approver(request.user):
            return error_response("PERMISSION_DENIED", "Tidak memiliki akses.", status_code=403)

        pengajuan = self.get_object()
        if pengajuan.status != "pending":
            return error_response("ALREADY_REVIEWED", "Pengajuan sudah diproses.", status_code=400)

        aksi = request.data.get("aksi")
        catatan = request.data.get("catatan", "")
        if aksi not in ("setujui", "tolak"):
            return error_response("VALIDATION_ERROR", "Aksi harus 'setujui' atau 'tolak'.", status_code=400)

        pengajuan.status = "disetujui" if aksi == "setujui" else "ditolak"
        pengajuan.catatan_admin = catatan
        pengajuan.reviewed_by = request.user
        pengajuan.reviewed_at = timezone.now()
        pengajuan.save()

        if aksi == "setujui":
            target = pengajuan.warga_target
            target.is_deleted = True
            target.deleted_at = timezone.now()
            target.deleted_by = request.user
            target.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

        status_label = "disetujui" if aksi == "setujui" else "ditolak"
        notify_user(
            user=pengajuan.pengaju,
            judul=f"Pengajuan Penghapusan {status_label.capitalize()}",
            isi=(
                f"Pengajuan penghapusan {pengajuan.warga_target.nama_lengkap} telah {status_label}."
                + (f" Catatan: {catatan}" if catatan else "")
            ),
            url="/kk/saya",
        )
        return success_response(message=f"Pengajuan berhasil {status_label}.")


# ── Pengajuan Perubahan Data ──────────────────────────────────────────────────

class PengajuanPerubahanViewSet(
    CreateModelMixin, ListModelMixin, RetrieveModelMixin, GenericViewSet
):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PengajuanPerubahanSerializer

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = PengajuanPerubahanSerializer(qs, many=True, context={"request": request})
        return success_response(data=serializer.data)

    def get_queryset(self):
        user = self.request.user
        if _is_approver(user):
            qs = PengajuanPerubahanWarga.objects.select_related(
                "warga_target", "pengaju", "reviewed_by"
            ).all()
            status_filter = self.request.query_params.get("status")
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs
        kk = _warga_kk(user)
        if kk:
            return PengajuanPerubahanWarga.objects.filter(
                warga_target__kartu_keluarga=kk
            ).select_related("warga_target", "pengaju", "reviewed_by")
        return PengajuanPerubahanWarga.objects.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if not _is_approver(user):
            kk = _warga_kk(user)
            target_id = request.data.get("wargaTargetId")
            if not kk:
                return error_response("PERMISSION_DENIED", "Anda belum terhubung ke KK.", status_code=403)
            if not WargaProfile.objects.filter(id=target_id, kartu_keluarga=kk, is_deleted=False).exists():
                return error_response("PERMISSION_DENIED", "Target bukan anggota KK Anda.", status_code=403)

        ser = PengajuanPerubahanSerializer(data=request.data, context={"request": request})
        if not ser.is_valid():
            return error_response("VALIDATION_ERROR", "Data tidak valid.", errors=[
                {"field": f, "message": str(m[0])} for f, m in ser.errors.items()
            ], status_code=400)
        pengajuan = ser.save()

        notify_admins(
            judul="Pengajuan Perubahan Data Warga",
            isi=f"{user.email} mengajukan perubahan data {pengajuan.warga_target.nama_lengkap}.",
            url="/pengajuan",
        )
        return success_response(
            data=PengajuanPerubahanSerializer(pengajuan, context={"request": request}).data,
            message="Pengajuan perubahan data berhasil dikirim.",
            status_code=201,
        )

    @action(detail=True, methods=["post"], url_path="review")
    def review(self, request, pk=None):
        if not _is_approver(request.user):
            return error_response("PERMISSION_DENIED", "Tidak memiliki akses.", status_code=403)

        pengajuan = self.get_object()
        if pengajuan.status != "pending":
            return error_response("ALREADY_REVIEWED", "Pengajuan sudah diproses.", status_code=400)

        aksi = request.data.get("aksi")
        catatan = request.data.get("catatan", "")
        if aksi not in ("setujui", "tolak"):
            return error_response("VALIDATION_ERROR", "Aksi harus 'setujui' atau 'tolak'.", status_code=400)

        pengajuan.status = "disetujui" if aksi == "setujui" else "ditolak"
        pengajuan.catatan_admin = catatan
        pengajuan.reviewed_by = request.user
        pengajuan.reviewed_at = timezone.now()
        pengajuan.save()

        if aksi == "setujui":
            target = pengajuan.warga_target
            allowed = {
                "nama_lengkap", "nik", "tempat_lahir", "tanggal_lahir",
                "jenis_kelamin", "agama", "status_perkawinan", "pendidikan",
                "pekerjaan", "blok", "no_rumah", "alamat", "hubungan_keluarga",
            }
            changes = {k: v for k, v in pengajuan.field_changes.items() if k in allowed}
            for field, value in changes.items():
                setattr(target, field, value)
            if changes:
                target.save(update_fields=list(changes.keys()))

        status_label = "disetujui" if aksi == "setujui" else "ditolak"
        notify_user(
            user=pengajuan.pengaju,
            judul=f"Pengajuan Perubahan Data {status_label.capitalize()}",
            isi=(
                f"Pengajuan perubahan data {pengajuan.warga_target.nama_lengkap} telah {status_label}."
                + (f" Catatan: {catatan}" if catatan else "")
            ),
            url="/kk/saya",
        )
        return success_response(message=f"Pengajuan berhasil {status_label}.")
