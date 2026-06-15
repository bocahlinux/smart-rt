"""Views pengaduan warga — CRUD, status update, filter, dan pengaduan saya."""

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.services import log_action
from .filters import PengaduanFilter
from .models import Pengaduan
from accounts.permissions import has_perm
from .permissions import CanUpdateStatus, IsOwnerOrPengurus
from .serializers import (
    PengaduanCreateSerializer,
    PengaduanDetailSerializer,
    PengaduanListSerializer,
    PengaduanStatusUpdateSerializer,
)
from .services import notify_status_change


class PengaduanListCreateView(APIView):
    """
    GET  /pengaduan/  — List pengaduan (role-scoped)
    POST /pengaduan/  — Buat pengaduan baru (semua user ter-auth)

    Queryset scoping sesuai docs/11-SECURITY.md §5.3:
    - Admin/sekretaris/pengurus → semua pengaduan
    - Warga/bendahara         → pengaduan miliknya saja
    """

    permission_classes = [IsAuthenticated]

    def _get_queryset(self, request):
        """Filter queryset berdasarkan role pengguna."""
        qs = Pengaduan.objects.select_related("warga", "warga__profile")
        if has_perm(request.user, "update_pengaduan"):
            return qs
        return qs.filter(warga=request.user)

    def get(self, request):
        """List pengaduan dengan filter dan pagination."""
        qs = self._get_queryset(request)

        # Apply filters (status, kategori)
        filterset = PengaduanFilter(request.GET, queryset=qs)
        if not filterset.is_valid():
            return Response(
                {"status": "error", "message": "Parameter filter tidak valid.", "errors": filterset.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = filterset.qs

        # Pagination manual (konsisten dengan endpoint lain)
        try:
            page = int(request.GET.get("page", 1))
            limit = int(request.GET.get("limit", 20))
            if page < 1:
                page = 1
            if limit < 1 or limit > 100:
                limit = 20
        except (ValueError, TypeError):
            page = 1
            limit = 20

        total = qs.count()
        total_pages = max(1, (total + limit - 1) // limit)
        offset = (page - 1) * limit
        qs = qs[offset : offset + limit]

        serializer = PengaduanListSerializer(qs, many=True, context={"request": request})
        return Response(
            {
                "status": "success",
                "data": serializer.data,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "totalPages": total_pages,
                },
            }
        )

    def post(self, request):
        """Buat pengaduan baru — semua user ter-auth bisa mengajukan."""
        serializer = PengaduanCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        # Audit log
        log_action(
            user=request.user,
            action="create",
            table_name="pengaduan",
            record_id=instance.id,
            new_data={
                "judul": instance.judul,
                "kategori": instance.kategori,
                "status": instance.status,
            },
            request=request,
        )

        return Response(
            {
                "status": "success",
                "data": PengaduanDetailSerializer(instance, context={"request": request}).data,
                "message": "Pengaduan berhasil diajukan.",
            },
            status=status.HTTP_201_CREATED,
        )

    # Parser untuk form multipart (upload foto)
    parser_classes = [MultiPartParser, FormParser]


class PengaduanDetailView(APIView):
    """
    GET    /pengaduan/:id/  — Detail pengaduan
    DELETE /pengaduan/:id/  — Hapus pengaduan (hanya pemilik / admin)

    Object-level permission: sesuai docs/11-SECURITY.md §5.2.
    Return 403 (bukan 404) untuk object yang ada tapi user tidak berhak.
    """

    permission_classes = [IsAuthenticated]

    def _get_object(self, pk, request):
        """Ambil pengaduan, terapkan object-level permission."""
        try:
            pengaduan = Pengaduan.objects.select_related(
                "warga", "warga__profile"
            ).get(pk=pk)
        except Pengaduan.DoesNotExist:
            return None, Response(
                {"status": "error", "message": "Pengaduan tidak ditemukan.", "code": "NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Object-level permission check
        perm = IsOwnerOrPengurus()
        if not perm.has_object_permission(request, self, pengaduan):
            return None, Response(
                {"status": "error", "message": "Akses ditolak.", "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        return pengaduan, None

    def get(self, request, pk):
        """Detail pengaduan termasuk status history."""
        pengaduan, err = self._get_object(pk, request)
        if err:
            return err
        serializer = PengaduanDetailSerializer(pengaduan, context={"request": request})
        return Response({"status": "success", "data": serializer.data})

    def delete(self, request, pk):
        """Hapus pengaduan — hanya pemilik atau admin."""
        pengaduan, err = self._get_object(pk, request)
        if err:
            return err

        # Hanya pemilik atau yang punya izin update_pengaduan yang bisa hapus
        if not has_perm(request.user, "update_pengaduan") and pengaduan.warga != request.user:
            return Response(
                {"status": "error", "message": "Hanya pemilik atau pengurus yang bisa menghapus pengaduan.", "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        log_action(
            user=request.user,
            action="delete",
            table_name="pengaduan",
            record_id=pengaduan.id,
            old_data={"judul": pengaduan.judul, "status": pengaduan.status},
            request=request,
        )
        pengaduan.delete()
        return Response(
            {"status": "success", "message": "Pengaduan berhasil dihapus."},
            status=status.HTTP_200_OK,
        )


class PengaduanStatusUpdateView(APIView):
    """
    PUT /pengaduan/:id/status/
    Update status pengaduan — hanya pengurus/sekretaris/admin.
    Sesuai task 7.3 & 7.4 di 07-TASK-BREAKDOWN.md.
    """

    permission_classes = [IsAuthenticated, CanUpdateStatus]

    def put(self, request, pk):
        try:
            pengaduan = Pengaduan.objects.select_related(
                "warga", "warga__profile"
            ).get(pk=pk)
        except Pengaduan.DoesNotExist:
            return Response(
                {"status": "error", "message": "Pengaduan tidak ditemukan.", "code": "NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PengaduanStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status_val = serializer.validated_data["status"]
        keterangan = serializer.validated_data.get("keterangan", "")
        old_status = pengaduan.status

        # Update status
        pengaduan.status = new_status_val

        # Append ke status_history
        history_entry = {
            "status": new_status_val,
            "keterangan": keterangan,
            "updatedBy": request.user.email,
            "updatedAt": timezone.now().isoformat(),
        }
        pengaduan.status_history = (pengaduan.status_history or []) + [history_entry]
        pengaduan.save(update_fields=["status", "status_history", "updated_at"])

        # Audit log — sesuai task 7.9
        log_action(
            user=request.user,
            action="update",
            table_name="pengaduan",
            record_id=pengaduan.id,
            old_data={"status": old_status},
            new_data={"status": new_status_val, "keterangan": keterangan},
            request=request,
        )

        # Kirim notifikasi ke pelapor — sesuai task 7.4
        notify_status_change(pengaduan, new_status_val, keterangan)

        return Response(
            {
                "status": "success",
                "message": "Status pengaduan diperbarui.",
                "data": {"id": str(pengaduan.id), "status": new_status_val},
            }
        )


class PengaduanSayaView(APIView):
    """
    GET /pengaduan/saya/
    List pengaduan milik user yang login.
    Sesuai API contract 7.5 di docs/06-API-CONTRACT.md.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Pengaduan.objects.filter(warga=request.user).select_related(
            "warga", "warga__profile"
        )

        # Pagination
        try:
            page = int(request.GET.get("page", 1))
            limit = int(request.GET.get("limit", 20))
            if page < 1:
                page = 1
            if limit < 1 or limit > 100:
                limit = 20
        except (ValueError, TypeError):
            page = 1
            limit = 20

        total = qs.count()
        total_pages = max(1, (total + limit - 1) // limit)
        offset = (page - 1) * limit
        qs = qs[offset : offset + limit]

        serializer = PengaduanListSerializer(qs, many=True, context={"request": request})
        return Response(
            {
                "status": "success",
                "data": serializer.data,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "totalPages": total_pages,
                },
            }
        )
