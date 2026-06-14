"""Views polling — CRUD poll dan voting."""

from django.db import IntegrityError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.services import log_action
from .filters import PollFilter
from .models import Poll, Vote
from .permissions import IsPengurusOrAdmin
from .serializers import (
    PollCreateSerializer,
    PollDetailSerializer,
    PollListSerializer,
    VoteSerializer,
)


class PollListCreateView(APIView):
    """
    GET  /polling/  — Daftar poll (semua user ter-auth, dengan filter status)
    POST /polling/  — Buat poll baru (hanya pengurus/sekretaris/admin)

    Sesuai API contract §9.1 dan §9.3.
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsPengurusOrAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        qs = Poll.objects.select_related("created_by", "created_by__profile").prefetch_related(
            "votes"
        )

        filterset = PollFilter(request.GET, queryset=qs)
        if not filterset.is_valid():
            return Response(
                {"status": "error", "message": "Parameter filter tidak valid.", "errors": filterset.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = filterset.qs

        serializer = PollListSerializer(qs, many=True, context={"request": request})
        return Response({"status": "success", "data": serializer.data})

    def post(self, request):
        serializer = PollCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        log_action(
            user=request.user,
            action="create",
            table_name="polls",
            record_id=instance.id,
            new_data={"pertanyaan": instance.pertanyaan, "deadline": str(instance.deadline)},
            request=request,
        )
        return Response(
            {
                "status": "success",
                "data": PollDetailSerializer(instance, context={"request": request}).data,
                "message": "Poll berhasil dibuat.",
            },
            status=status.HTTP_201_CREATED,
        )


class PollDetailView(APIView):
    """
    GET    /polling/:id/  — Detail poll + hasil (dengan akses kontrol hasil)
    PUT    /polling/:id/  — Update poll (hanya pengurus/sekretaris/admin)
    DELETE /polling/:id/  — Hapus poll (hanya pengurus/sekretaris/admin)

    Sesuai API contract §9.2.
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsPengurusOrAdmin()]

    def _get_object(self, pk):
        try:
            return Poll.objects.select_related(
                "created_by", "created_by__profile"
            ).prefetch_related("votes", "votes__user").get(pk=pk)
        except Poll.DoesNotExist:
            return None

    def get(self, request, pk):
        poll = self._get_object(pk)
        if not poll:
            return Response(
                {"status": "error", "message": "Poll tidak ditemukan."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = PollDetailSerializer(poll, context={"request": request})
        return Response({"status": "success", "data": serializer.data})

    def put(self, request, pk):
        poll = self._get_object(pk)
        if not poll:
            return Response(
                {"status": "error", "message": "Poll tidak ditemukan."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = PollCreateSerializer(
            poll, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        log_action(
            user=request.user,
            action="update",
            table_name="polls",
            record_id=instance.id,
            new_data={"pertanyaan": instance.pertanyaan},
            request=request,
        )
        return Response(
            {
                "status": "success",
                "data": PollDetailSerializer(instance, context={"request": request}).data,
                "message": "Poll berhasil diperbarui.",
            }
        )

    def delete(self, request, pk):
        poll = self._get_object(pk)
        if not poll:
            return Response(
                {"status": "error", "message": "Poll tidak ditemukan."},
                status=status.HTTP_404_NOT_FOUND,
            )
        log_action(
            user=request.user,
            action="delete",
            table_name="polls",
            record_id=poll.id,
            old_data={"pertanyaan": poll.pertanyaan},
            request=request,
        )
        poll.delete()
        return Response({"status": "success", "message": "Poll berhasil dihapus."})


class PollVoteView(APIView):
    """
    POST /polling/:id/vote/
    Vote pada sebuah poll.

    Rules:
    - User sudah vote → 409 Conflict (double vote tidak diizinkan)
    - Poll sudah expired → 400 Bad Request
    - opsiIndex out of range → 400 Bad Request

    Sesuai API contract §9.4 dan task 8.8.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            poll = Poll.objects.prefetch_related("votes").get(pk=pk)
        except Poll.DoesNotExist:
            return Response(
                {"status": "error", "message": "Poll tidak ditemukan."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Cek apakah poll masih aktif
        if poll.is_expired:
            return Response(
                {"status": "error", "message": "Poll sudah berakhir. Tidak dapat vote."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = VoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        opsi_index = serializer.validated_data["opsi_index"]

        # Validasi index dalam range opsi yang tersedia
        if opsi_index < 0 or opsi_index >= len(poll.opsi):
            return Response(
                {
                    "status": "error",
                    "message": f"opsiIndex tidak valid. Harus antara 0 dan {len(poll.opsi) - 1}.",
                    "code": "POLLING_INVALID_OPTION",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            Vote.objects.create(poll=poll, user=request.user, opsi_index=opsi_index)
        except IntegrityError:
            # unique_together constraint: poll + user
            return Response(
                {
                    "status": "error",
                    "message": "Anda sudah melakukan vote pada poll ini.",
                    "code": "POLLING_ALREADY_VOTED",
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {
                "status": "success",
                "message": "Vote berhasil.",
                "data": {"opsiIndex": opsi_index, "opsi": poll.opsi[opsi_index]},
            }
        )
