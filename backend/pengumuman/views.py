from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.models import AuditLog

from .filters import PengumumanFilter
from .models import Pengumuman
from .permissions import IsPengurusOrAdmin
from .serializers import PengumumanCreateSerializer, PengumumanListSerializer

PENGURUS_ROLES = {"admin", "pengurus", "sekretaris"}


def _build_response(data, message="", status_code=status.HTTP_200_OK, pagination=None):
    body = {"status": "success", "data": data}
    if message:
        body["message"] = message
    if pagination:
        body["pagination"] = pagination
    return Response(body, status=status_code)


class PengumumanListCreateView(APIView):
    """
    GET  /pengumuman  — list pengumuman
    POST /pengumuman  — buat pengumuman baru (pengurus/admin only)
    """

    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        return [IsAuthenticated(), IsPengurusOrAdmin()]

    def get(self, request):
        qs = Pengumuman.objects.select_related("created_by__profile").all()

        # Warga hanya lihat yang sudah published dan jadwalnya sudah tiba
        if request.user.role not in PENGURUS_ROLES:
            now = timezone.now()
            qs = qs.filter(is_published=True).filter(
                Q(scheduled_at__isnull=True) | Q(scheduled_at__lte=now)
            )

        filterset = PengumumanFilter(request.GET, queryset=qs)
        qs = filterset.qs

        page_size = max(1, int(request.GET.get("limit", 10)))
        page = max(1, int(request.GET.get("page", 1)))
        total = qs.count()
        total_pages = max(1, (total + page_size - 1) // page_size)
        start = (page - 1) * page_size
        qs_page = qs[start : start + page_size]

        serializer = PengumumanListSerializer(
            qs_page, many=True, context={"request": request}
        )
        return _build_response(
            serializer.data,
            pagination={
                "page": page,
                "limit": page_size,
                "total": total,
                "totalPages": total_pages,
            },
        )

    def post(self, request):
        serializer = PengumumanCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        scheduled_at = serializer.validated_data.get("scheduled_at")
        is_published = True
        if scheduled_at and scheduled_at > timezone.now():
            is_published = False

        pengumuman = serializer.save(
            created_by=request.user,
            is_published=is_published,
        )

        AuditLog.objects.create(
            user=request.user,
            action="create",
            table_name="pengumuman",
            record_id=str(pengumuman.id),
            new_data={"judul": pengumuman.judul, "kategori": pengumuman.kategori},
        )

        from notifications.services import broadcast_pengumuman  # noqa: PLC0415

        broadcast_pengumuman(pengumuman)

        out = PengumumanListSerializer(pengumuman, context={"request": request})
        return _build_response(out.data, "Pengumuman berhasil dibuat.", status.HTTP_201_CREATED)


class PengumumanDetailView(APIView):
    """
    GET    /pengumuman/:id
    PUT    /pengumuman/:id  (pengurus/admin)
    DELETE /pengumuman/:id  (pengurus/admin)
    """

    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        return [IsAuthenticated(), IsPengurusOrAdmin()]

    def _get_object(self, pk):
        try:
            return Pengumuman.objects.select_related("created_by__profile").get(pk=pk)
        except Pengumuman.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get_object(pk)
        if obj is None:
            return Response({"status": "error", "message": "Tidak ditemukan."}, status=404)

        if request.user.role not in PENGURUS_ROLES:
            now = timezone.now()
            if not obj.is_published:
                return Response({"status": "error", "message": "Tidak ditemukan."}, status=404)
            if obj.scheduled_at and obj.scheduled_at > now:
                return Response({"status": "error", "message": "Tidak ditemukan."}, status=404)

        serializer = PengumumanListSerializer(obj, context={"request": request})
        return _build_response(serializer.data)

    def put(self, request, pk):
        obj = self._get_object(pk)
        if obj is None:
            return Response({"status": "error", "message": "Tidak ditemukan."}, status=404)

        serializer = PengumumanCreateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        scheduled_at = serializer.validated_data.get("scheduled_at", obj.scheduled_at)
        is_published = True
        if scheduled_at and scheduled_at > timezone.now():
            is_published = False

        obj = serializer.save(is_published=is_published)

        AuditLog.objects.create(
            user=request.user,
            action="update",
            table_name="pengumuman",
            record_id=str(obj.id),
            new_data={"judul": obj.judul},
        )

        out = PengumumanListSerializer(obj, context={"request": request})
        return _build_response(out.data, "Pengumuman berhasil diperbarui.")

    def delete(self, request, pk):
        obj = self._get_object(pk)
        if obj is None:
            return Response({"status": "error", "message": "Tidak ditemukan."}, status=404)

        AuditLog.objects.create(
            user=request.user,
            action="delete",
            table_name="pengumuman",
            record_id=str(obj.id),
            new_data={"judul": obj.judul},
        )
        obj.delete()
        return _build_response(None, "Pengumuman berhasil dihapus.")
