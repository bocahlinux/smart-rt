from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Comment, Thread, ThreadVote
from .permissions import IsModerator, IsOwnerOrModerator
from .serializers import (
    CommentCreateSerializer,
    CommentSerializer,
    ThreadCreateSerializer,
    ThreadDetailSerializer,
    ThreadListSerializer,
)

MODERATOR_ROLES = {"admin", "sekretaris", "pengurus"}


def _build_response(data, message="", status_code=status.HTTP_200_OK, pagination=None):
    body = {"status": "success", "data": data}
    if message:
        body["message"] = message
    if pagination:
        body["pagination"] = pagination
    return Response(body, status=status_code)


def _error(message, status_code=status.HTTP_400_BAD_REQUEST, code=None):
    body = {"status": "error", "message": message}
    if code:
        body["code"] = code
    return Response(body, status=status_code)


class ThreadListCreateView(APIView):
    """
    GET  /forum/   — list thread dengan pagination dan filter
    POST /forum/   — buat thread baru (semua user terotentikasi)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Thread.objects.select_related("created_by__profile").prefetch_related(
            "comments", "votes"
        )

        # Filter kategori
        kategori = request.GET.get("kategori")
        if kategori:
            qs = qs.filter(kategori=kategori)

        # Sort: pinned di atas, sisanya order by -created_at
        sort = request.GET.get("sort", "terbaru")
        if sort == "terlama":
            qs = qs.order_by("created_at")
        else:
            # Pinned threads di atas
            from django.db.models import Case, IntegerField, Value, When
            qs = qs.order_by(
                Case(
                    When(status=Thread.Status.PINNED, then=Value(0)),
                    default=Value(1),
                    output_field=IntegerField(),
                ),
                "-created_at",
            )

        page_size = max(1, int(request.GET.get("limit", 20)))
        page = max(1, int(request.GET.get("page", 1)))
        total = qs.count()
        total_pages = max(1, (total + page_size - 1) // page_size)
        start = (page - 1) * page_size
        qs_page = qs[start: start + page_size]

        serializer = ThreadListSerializer(qs_page, many=True, context={"request": request})
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
        serializer = ThreadCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        thread = serializer.save(created_by=request.user)
        out = ThreadDetailSerializer(thread, context={"request": request})
        return _build_response(out.data, "Thread berhasil dibuat.", status.HTTP_201_CREATED)


class ThreadDetailView(APIView):
    """
    GET    /forum/:id/  — detail thread + komentar
    PUT    /forum/:id/  — edit thread (owner/moderator)
    DELETE /forum/:id/  — hapus thread (moderator only)
    """

    permission_classes = [IsAuthenticated]

    def _get_thread(self, pk):
        try:
            return Thread.objects.select_related("created_by__profile").prefetch_related(
                "comments__created_by__profile",
                "comments__replies__created_by__profile",
                "votes",
            ).get(pk=pk)
        except Thread.DoesNotExist:
            return None

    def get(self, request, pk):
        thread = self._get_thread(pk)
        if thread is None:
            return _error("Thread tidak ditemukan.", status.HTTP_404_NOT_FOUND)
        serializer = ThreadDetailSerializer(thread, context={"request": request})
        return _build_response(serializer.data)

    def put(self, request, pk):
        thread = self._get_thread(pk)
        if thread is None:
            return _error("Thread tidak ditemukan.", status.HTTP_404_NOT_FOUND)

        # Object-level permission: owner atau moderator
        perm = IsOwnerOrModerator()
        if not perm.has_object_permission(request, self, thread):
            return _error(
                "Anda tidak berhak mengedit thread ini.",
                status.HTTP_403_FORBIDDEN,
                "PERMISSION_DENIED_OBJECT_LEVEL",
            )

        serializer = ThreadCreateSerializer(thread, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        thread = serializer.save()
        out = ThreadDetailSerializer(thread, context={"request": request})
        return _build_response(out.data, "Thread berhasil diperbarui.")

    def delete(self, request, pk):
        thread = self._get_thread(pk)
        if thread is None:
            return _error("Thread tidak ditemukan.", status.HTTP_404_NOT_FOUND)

        # Hanya moderator yang boleh hapus thread
        if request.user.role not in MODERATOR_ROLES:
            return _error(
                "Hanya moderator yang dapat menghapus thread.",
                status.HTTP_403_FORBIDDEN,
                "PERMISSION_DENIED",
            )

        thread.delete()
        return _build_response(None, "Thread berhasil dihapus.")


class ThreadModerationView(APIView):
    """
    PUT /forum/:id/pin/   — pin/unpin thread (moderator)
    PUT /forum/:id/lock/  — lock/unlock thread (moderator)
    """

    permission_classes = [IsAuthenticated, IsModerator]

    def _get_thread(self, pk):
        try:
            return Thread.objects.get(pk=pk)
        except Thread.DoesNotExist:
            return None

    def put(self, request, pk, action):
        thread = self._get_thread(pk)
        if thread is None:
            return _error("Thread tidak ditemukan.", status.HTTP_404_NOT_FOUND)

        if action == "pin":
            if thread.status == Thread.Status.PINNED:
                thread.status = Thread.Status.ACTIVE
                msg = "Thread berhasil di-unpin."
            else:
                thread.status = Thread.Status.PINNED
                msg = "Thread berhasil di-pin."
        elif action == "lock":
            if thread.status == Thread.Status.LOCKED:
                thread.status = Thread.Status.ACTIVE
                msg = "Thread berhasil di-unlock."
            else:
                thread.status = Thread.Status.LOCKED
                msg = "Thread berhasil di-lock."
        else:
            return _error("Aksi tidak valid.")

        thread.save(update_fields=["status", "updated_at"])
        return _build_response({"id": str(thread.id), "status": thread.status}, msg)


class CommentListCreateView(APIView):
    """
    POST /forum/:id/comments/  — tambah komentar/reply pada thread
    """

    permission_classes = [IsAuthenticated]

    def _get_thread(self, pk):
        try:
            return Thread.objects.get(pk=pk)
        except Thread.DoesNotExist:
            return None

    def post(self, request, pk):
        thread = self._get_thread(pk)
        if thread is None:
            return _error("Thread tidak ditemukan.", status.HTTP_404_NOT_FOUND)

        # Thread terkunci tidak bisa menerima komentar baru
        if thread.status == Thread.Status.LOCKED:
            return _error(
                "Thread terkunci, tidak bisa menambah komentar.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "FORUM_THREAD_LOCKED",
            )

        serializer = CommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Validasi parentId harus milik thread yang sama
        parent_id = request.data.get("parentId")
        if parent_id:
            try:
                parent = Comment.objects.get(pk=parent_id, thread=thread)
            except Comment.DoesNotExist:
                return _error(
                    "Parent comment tidak ditemukan pada thread ini.",
                    status.HTTP_400_BAD_REQUEST,
                )
            comment = Comment.objects.create(
                thread=thread,
                parent=parent,
                isi=serializer.validated_data["isi"],
                created_by=request.user,
            )
        else:
            comment = Comment.objects.create(
                thread=thread,
                parent=None,
                isi=serializer.validated_data["isi"],
                created_by=request.user,
            )

        comment_data = CommentSerializer(
            Comment.objects.select_related("created_by__profile")
            .prefetch_related("replies__created_by__profile")
            .get(pk=comment.pk)
        ).data
        return _build_response(comment_data, "Komentar berhasil ditambahkan.", status.HTTP_201_CREATED)


class CommentDetailView(APIView):
    """
    PUT    /forum/comments/:id/  — edit komentar (owner/moderator)
    DELETE /forum/comments/:id/  — hapus komentar (moderator)
    """

    permission_classes = [IsAuthenticated]

    def _get_comment(self, pk):
        try:
            return Comment.objects.select_related("created_by__profile").get(pk=pk)
        except Comment.DoesNotExist:
            return None

    def put(self, request, pk):
        comment = self._get_comment(pk)
        if comment is None:
            return _error("Komentar tidak ditemukan.", status.HTTP_404_NOT_FOUND)

        # Object-level permission: owner atau moderator
        perm = IsOwnerOrModerator()
        if not perm.has_object_permission(request, self, comment):
            return _error(
                "Anda tidak berhak mengedit komentar ini.",
                status.HTTP_403_FORBIDDEN,
                "PERMISSION_DENIED_OBJECT_LEVEL",
            )

        serializer = CommentCreateSerializer(comment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        isi = serializer.validated_data.get("isi")
        if isi:
            comment.isi = isi
            comment.save(update_fields=["isi", "updated_at"])

        out = CommentSerializer(
            Comment.objects.select_related("created_by__profile")
            .prefetch_related("replies__created_by__profile")
            .get(pk=comment.pk)
        )
        return _build_response(out.data, "Komentar berhasil diperbarui.")

    def delete(self, request, pk):
        comment = self._get_comment(pk)
        if comment is None:
            return _error("Komentar tidak ditemukan.", status.HTTP_404_NOT_FOUND)

        # Hanya moderator yang boleh hapus komentar
        if request.user.role not in MODERATOR_ROLES:
            return _error(
                "Hanya moderator yang dapat menghapus komentar.",
                status.HTTP_403_FORBIDDEN,
                "PERMISSION_DENIED",
            )

        comment.delete()
        return _build_response(None, "Komentar berhasil dihapus.")


class ThreadVoteView(APIView):
    """
    POST /forum/:id/vote/  — toggle upvote thread (tambah/cabut)
    """

    permission_classes = [IsAuthenticated]

    def _get_thread(self, pk):
        try:
            return Thread.objects.get(pk=pk)
        except Thread.DoesNotExist:
            return None

    def post(self, request, pk):
        thread = self._get_thread(pk)
        if thread is None:
            return _error("Thread tidak ditemukan.", status.HTTP_404_NOT_FOUND)

        vote, created = ThreadVote.objects.get_or_create(thread=thread, user=request.user)
        if not created:
            # Sudah vote sebelumnya → cabut vote
            vote.delete()
            return _build_response(
                {"voteCount": thread.votes.count(), "hasVoted": False},
                "Vote berhasil dicabut.",
            )

        return _build_response(
            {"voteCount": thread.votes.count(), "hasVoted": True},
            "Vote berhasil ditambahkan.",
        )
