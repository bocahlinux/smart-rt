"""Views kegiatan RT — CRUD kegiatan dan RSVP warga."""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.services import log_action
from .filters import KegiatanFilter
from .models import Kegiatan, RSVP
from .permissions import IsPengurusOrAdmin, PENGURUS_ROLES
from .serializers import (
    KegiatanCreateSerializer,
    KegiatanDetailSerializer,
    KegiatanListSerializer,
    RSVPCreateSerializer,
)


class KegiatanListCreateView(APIView):
    """
    GET  /kegiatan/  — Daftar kegiatan (semua user ter-auth, dengan filter tanggal)
    POST /kegiatan/  — Buat kegiatan baru (hanya pengurus/sekretaris/admin)

    Sesuai API contract §8.1 dan §8.3.
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsPengurusOrAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        qs = Kegiatan.objects.select_related(
            "penanggung_jawab", "penanggung_jawab__profile", "created_by"
        ).prefetch_related("rsvp")

        # Apply filter tanggal
        filterset = KegiatanFilter(request.GET, queryset=qs)
        if not filterset.is_valid():
            return Response(
                {"status": "error", "message": "Parameter filter tidak valid.", "errors": filterset.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = filterset.qs

        serializer = KegiatanListSerializer(qs, many=True, context={"request": request})
        return Response({"status": "success", "data": serializer.data})

    def post(self, request):
        serializer = KegiatanCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        log_action(
            user=request.user,
            action="create",
            table_name="kegiatan",
            record_id=instance.id,
            new_data={"nama": instance.nama, "tanggal": str(instance.tanggal)},
            request=request,
        )
        return Response(
            {
                "status": "success",
                "data": KegiatanDetailSerializer(instance, context={"request": request}).data,
                "message": "Kegiatan berhasil dibuat.",
            },
            status=status.HTTP_201_CREATED,
        )


class KegiatanDetailView(APIView):
    """
    GET    /kegiatan/:id/  — Detail kegiatan + daftar RSVP
    PUT    /kegiatan/:id/  — Update kegiatan (hanya pengurus/sekretaris/admin)
    DELETE /kegiatan/:id/  — Hapus kegiatan (hanya pengurus/sekretaris/admin)

    Sesuai API contract §8.2, §8.4, §8.5.
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsPengurusOrAdmin()]

    def _get_object(self, pk):
        try:
            return Kegiatan.objects.select_related(
                "penanggung_jawab", "penanggung_jawab__profile", "created_by"
            ).prefetch_related("rsvp", "rsvp__user", "rsvp__user__profile").get(pk=pk)
        except Kegiatan.DoesNotExist:
            return None

    def get(self, request, pk):
        kegiatan = self._get_object(pk)
        if not kegiatan:
            return Response(
                {"status": "error", "message": "Kegiatan tidak ditemukan."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = KegiatanDetailSerializer(kegiatan, context={"request": request})
        return Response({"status": "success", "data": serializer.data})

    def put(self, request, pk):
        kegiatan = self._get_object(pk)
        if not kegiatan:
            return Response(
                {"status": "error", "message": "Kegiatan tidak ditemukan."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = KegiatanCreateSerializer(
            kegiatan, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        log_action(
            user=request.user,
            action="update",
            table_name="kegiatan",
            record_id=instance.id,
            new_data={"nama": instance.nama},
            request=request,
        )
        return Response(
            {
                "status": "success",
                "data": KegiatanDetailSerializer(instance, context={"request": request}).data,
                "message": "Kegiatan berhasil diperbarui.",
            }
        )

    def delete(self, request, pk):
        kegiatan = self._get_object(pk)
        if not kegiatan:
            return Response(
                {"status": "error", "message": "Kegiatan tidak ditemukan."},
                status=status.HTTP_404_NOT_FOUND,
            )
        log_action(
            user=request.user,
            action="delete",
            table_name="kegiatan",
            record_id=kegiatan.id,
            old_data={"nama": kegiatan.nama},
            request=request,
        )
        kegiatan.delete()
        return Response({"status": "success", "message": "Kegiatan berhasil dihapus."})


class RSVPView(APIView):
    """
    POST /kegiatan/:id/rsvp/
    Upsert RSVP warga untuk kegiatan.
    - Jika belum RSVP → buat baru
    - Jika sudah RSVP → update status
    Semua user ter-auth bisa RSVP.
    Sesuai API contract §8.6.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            kegiatan = Kegiatan.objects.get(pk=pk)
        except Kegiatan.DoesNotExist:
            return Response(
                {"status": "error", "message": "Kegiatan tidak ditemukan."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = RSVPCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rsvp_status = serializer.validated_data["status"]

        # Upsert: update_or_create berdasarkan kegiatan + user
        rsvp, created = RSVP.objects.update_or_create(
            kegiatan=kegiatan,
            user=request.user,
            defaults={"status": rsvp_status},
        )

        action_msg = "RSVP berhasil didaftarkan." if created else "Status RSVP berhasil diperbarui."
        return Response(
            {
                "status": "success",
                "message": action_msg,
                "data": {"rsvpStatus": rsvp.status},
            }
        )
