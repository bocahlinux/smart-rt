from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import has_perm
from .models import JenisSurat, PermohonanSurat
from .serializers import JenisSuratSerializer, PermohonanSuratSerializer


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
