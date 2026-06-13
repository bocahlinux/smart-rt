from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification, PushSubscription
from .serializers import NotificationSerializer, PushSubscriptionSerializer


def _ok(data=None, message="", status_code=status.HTTP_200_OK, pagination=None):
    body = {"status": "success", "data": data}
    if message:
        body["message"] = message
    if pagination:
        body["pagination"] = pagination
    return Response(body, status=status_code)


class NotificationListView(APIView):
    """GET /notifications — list notifikasi milik user yang login."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user)

        is_read = request.GET.get("isRead")
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() in {"true", "1"})

        page_size = max(1, int(request.GET.get("limit", 20)))
        page = max(1, int(request.GET.get("page", 1)))
        total = qs.count()
        total_pages = max(1, (total + page_size - 1) // page_size)
        start = (page - 1) * page_size
        qs_page = qs[start : start + page_size]

        serializer = NotificationSerializer(qs_page, many=True)
        return _ok(
            serializer.data,
            pagination={
                "page": page,
                "limit": page_size,
                "total": total,
                "totalPages": total_pages,
            },
        )


class NotificationMarkReadView(APIView):
    """PUT /notifications/:id/read — tandai satu notifikasi sebagai telah dibaca."""

    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({"status": "error", "message": "Tidak ditemukan."}, status=404)
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return _ok(None, "Notifikasi ditandai dibaca.")


class NotificationMarkAllReadView(APIView):
    """PUT /notifications/read-all — tandai semua notifikasi user sebagai dibaca."""

    permission_classes = [IsAuthenticated]

    def put(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return _ok({"updated": count}, f"{count} notifikasi ditandai dibaca.")


class PushSubscribeView(APIView):
    """POST /notifications/push/subscribe — simpan push subscription dari browser."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PushSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sub, created = PushSubscription.objects.update_or_create(
            endpoint=serializer.validated_data["endpoint"],
            defaults={
                "user": request.user,
                "p256dh": serializer.validated_data["p256dh"],
                "auth": serializer.validated_data["auth"],
            },
        )
        msg = "Subscription berhasil didaftarkan." if created else "Subscription diperbarui."
        return _ok(None, msg, status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class PushUnsubscribeView(APIView):
    """DELETE /notifications/push/unsubscribe — hapus push subscription."""

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        endpoint = request.data.get("endpoint")
        if not endpoint:
            return Response({"status": "error", "message": "endpoint wajib diisi."}, status=400)
        PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        return _ok(None, "Subscription dihapus.")


class VapidPublicKeyView(APIView):
    """GET /notifications/push/vapid-public-key — kembalikan VAPID public key ke frontend."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return _ok({"vapidPublicKey": getattr(settings, "VAPID_PUBLIC_KEY", "")})
