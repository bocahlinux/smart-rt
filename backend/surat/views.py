from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import has_perm
from .models import JenisSurat, PermohonanSurat, PengaturanRT
from .serializers import JenisSuratSerializer, PermohonanSuratSerializer, PengaturanRTSerializer


def _ok(data, status_code=200, pagination=None):
    body = {"status": "success", "data": data}
    if pagination:
        body["pagination"] = pagination
    return Response(body, status=status_code)


def _err(msg, code=400):
    return Response({"status": "error", "message": msg}, status=code)


# ── Jenis Surat ────────────────────────────────────────────────

class JenisSuratListView(APIView):
    """GET /surat/jenis/ — list jenis surat aktif."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if has_perm(request.user, "kelola_surat"):
            qs = JenisSurat.objects.all()
        else:
            qs = JenisSurat.objects.filter(is_active=True)
        return _ok(JenisSuratSerializer(qs, many=True).data)


# ── Permohonan Surat ───────────────────────────────────────────

class PermohonanSuratListCreateView(APIView):
    """
    GET  /surat/permohonan/      — list permohonan (milik sendiri / semua jika kelola_surat)
    POST /surat/permohonan/      — warga ajukan permohonan surat
    """
    permission_classes = [permissions.IsAuthenticated]

    def _qs(self, request):
        qs = PermohonanSurat.objects.select_related("pemohon", "jenis", "reviewed_by")
        if not has_perm(request.user, "kelola_surat"):
            qs = qs.filter(pemohon=request.user)
        if s := request.query_params.get("status"):
            qs = qs.filter(status=s)
        if j := request.query_params.get("jenis"):
            qs = qs.filter(jenis__kode=j)
        return qs

    def get(self, request):
        qs = self._qs(request)
        # simple pagination
        from rest_framework.pagination import PageNumberPagination
        pager = PageNumberPagination()
        pager.page_size = 20
        page = pager.paginate_queryset(qs, request)
        data = PermohonanSuratSerializer(page if page is not None else qs, many=True).data
        if page is not None:
            p = pager.page
            return _ok(data, pagination={
                "page": p.number,
                "limit": pager.page_size,
                "total": p.paginator.count,
                "totalPages": p.paginator.num_pages,
            })
        return _ok(data)

    def post(self, request):
        ser = PermohonanSuratSerializer(data=request.data, context={"request": request})
        if not ser.is_valid():
            return Response({"status": "error", "errors": ser.errors}, status=400)
        instance = ser.save()
        return _ok(PermohonanSuratSerializer(instance).data, status_code=201)


class PermohonanSuratDetailView(APIView):
    """
    GET    /surat/permohonan/{id}/          — detail
    DELETE /surat/permohonan/{id}/          — hapus (pemohon/admin)
    PATCH  /surat/permohonan/{id}/review/  — update status (kelola_surat)
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_obj(self, request, pk):
        try:
            qs = PermohonanSurat.objects.select_related("pemohon", "jenis", "reviewed_by")
            if not has_perm(request.user, "kelola_surat"):
                qs = qs.filter(pemohon=request.user)
            return qs.get(pk=pk)
        except PermohonanSurat.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get_obj(request, pk)
        if obj is None:
            return _err("Tidak ditemukan.", 404)
        return _ok(PermohonanSuratSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get_obj(request, pk)
        if obj is None:
            return _err("Tidak ditemukan.", 404)
        if not has_perm(request.user, "kelola_surat") and obj.status != PermohonanSurat.Status.DIAJUKAN:
            return _err("Hanya permohonan berstatus 'Diajukan' yang bisa dibatalkan.", 400)
        obj.delete()
        return Response({"status": "success", "message": "Permohonan dibatalkan."}, status=204)


class PermohonanReviewView(APIView):
    """PATCH /surat/permohonan/{pk}/review/ — ubah status oleh pengurus."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not has_perm(request.user, "kelola_surat"):
            return _err("Tidak memiliki izin.", 403)
        try:
            obj = PermohonanSurat.objects.select_related("pemohon", "jenis", "reviewed_by").get(pk=pk)
        except PermohonanSurat.DoesNotExist:
            return _err("Tidak ditemukan.", 404)
        new_status = request.data.get("status")
        valid = [
            PermohonanSurat.Status.DIPROSES,
            PermohonanSurat.Status.DISETUJUI,
            PermohonanSurat.Status.DITOLAK,
            PermohonanSurat.Status.SELESAI,
        ]
        if new_status not in valid:
            return _err("Status tidak valid.")
        obj.status = new_status
        obj.catatan_admin = request.data.get("catatan_admin", obj.catatan_admin)
        if no_surat := request.data.get("no_surat"):
            obj.no_surat = no_surat
        obj.reviewed_by = request.user
        obj.reviewed_at = timezone.now()
        obj.save()
        return _ok(PermohonanSuratSerializer(obj).data)


# ── PDF Download ───────────────────────────────────────────────

class SuratPDFView(APIView):
    """
    GET /surat/permohonan/{pk}/pdf/
    Download surat dalam bentuk PDF.
    Hanya tersedia jika status = disetujui / selesai.
    Pemohon hanya bisa download miliknya sendiri; kelola_surat bisa semua.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            qs = PermohonanSurat.objects.select_related("pemohon__profile", "jenis", "reviewed_by")
            if not has_perm(request.user, "kelola_surat"):
                qs = qs.filter(pemohon=request.user)
            obj = qs.get(pk=pk)
        except PermohonanSurat.DoesNotExist:
            return _err("Tidak ditemukan.", 404)

        if obj.status not in (PermohonanSurat.Status.DISETUJUI, PermohonanSurat.Status.SELESAI):
            return _err("Surat belum disetujui dan tidak dapat diunduh.", 400)

        try:
            from .pdf import generate_pdf
            pdf_bytes = generate_pdf(obj)
        except Exception as exc:
            return _err(f"Gagal membuat PDF: {exc}", 500)

        safe_nama = obj.jenis.kode.replace("_", "-")
        filename = f"surat-{safe_nama}-{obj.id}.pdf"
        resp = HttpResponse(pdf_bytes, content_type="application/pdf")
        resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        return resp


# ── Pengaturan RT ──────────────────────────────────────────────

class PengaturanRTView(APIView):
    """
    GET  /surat/pengaturan/        — ambil konfigurasi RT (semua yang login)
    PATCH /surat/pengaturan/       — update konfigurasi RT (ketua_rt / admin)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        obj = PengaturanRT.get_instance()
        return _ok(PengaturanRTSerializer(obj).data)

    def patch(self, request):
        if request.user.role not in ("admin", "ketua_rt", "sekretaris"):
            return _err("Tidak memiliki izin.", 403)
        obj = PengaturanRT.get_instance()
        ser = PengaturanRTSerializer(obj, data=request.data, partial=True)
        if not ser.is_valid():
            return Response({"status": "error", "errors": ser.errors}, status=400)
        ser.save(updated_by=request.user)
        return _ok(PengaturanRTSerializer(obj).data)


class PengaturanRTTTDView(APIView):
    """
    POST /surat/pengaturan/ttd/    — upload tanda tangan digital (image)
    DELETE /surat/pengaturan/ttd/  — hapus tanda tangan
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        if request.user.role not in ("admin", "ketua_rt"):
            return _err("Hanya Ketua RT atau Admin yang dapat mengunggah TTD.", 403)
        file = request.FILES.get("tanda_tangan")
        if not file:
            return _err("File tanda_tangan wajib dikirim.")
        if not file.content_type.startswith("image/"):
            return _err("File harus berupa gambar (PNG/JPG).")
        if file.size > 2 * 1024 * 1024:
            return _err("Ukuran file maksimal 2 MB.")
        obj = PengaturanRT.get_instance()
        if obj.tanda_tangan:
            try:
                obj.tanda_tangan.delete(save=False)
            except Exception:
                pass
        obj.tanda_tangan = file
        obj.updated_by = request.user
        obj.save()
        return _ok({"hasTTD": True, "message": "Tanda tangan berhasil diunggah."})

    def delete(self, request):
        if request.user.role not in ("admin", "ketua_rt"):
            return _err("Hanya Ketua RT atau Admin yang dapat menghapus TTD.", 403)
        obj = PengaturanRT.get_instance()
        if obj.tanda_tangan:
            obj.tanda_tangan.delete(save=False)
            obj.tanda_tangan = None
            obj.save()
        return _ok({"hasTTD": False, "message": "Tanda tangan dihapus."})


class PengaturanRTLogoView(APIView):
    """
    POST   /surat/pengaturan/logo/  — upload logo RT (image)
    DELETE /surat/pengaturan/logo/  — hapus logo
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        if request.user.role not in ("admin", "ketua_rt"):
            return _err("Hanya Ketua RT atau Admin yang dapat mengunggah logo.", 403)
        file = request.FILES.get("logo")
        if not file:
            return _err("File logo wajib dikirim.")
        if not file.content_type.startswith("image/"):
            return _err("File harus berupa gambar (PNG/JPG/SVG).")
        if file.size > 2 * 1024 * 1024:
            return _err("Ukuran file maksimal 2 MB.")
        obj = PengaturanRT.get_instance()
        if obj.logo:
            try:
                obj.logo.delete(save=False)
            except Exception:
                pass
        obj.logo = file
        obj.updated_by = request.user
        obj.save()
        return _ok({"hasLogo": True, "message": "Logo berhasil diunggah."})

    def delete(self, request):
        if request.user.role not in ("admin", "ketua_rt"):
            return _err("Hanya Ketua RT atau Admin yang dapat menghapus logo.", 403)
        obj = PengaturanRT.get_instance()
        if obj.logo:
            obj.logo.delete(save=False)
            obj.logo = None
            obj.save()
        return _ok({"hasLogo": False, "message": "Logo dihapus."})
