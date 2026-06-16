from rest_framework import serializers

from .models import Notification, PushSubscription


class NotificationSerializer(serializers.ModelSerializer):
    isRead = serializers.BooleanField(source="is_read", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    pengumumanId = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ["id", "judul", "isi", "tipe", "isRead", "createdAt", "pengumumanId", "link"]

    def get_pengumumanId(self, obj):  # noqa: N802
        return str(obj.pengumuman_id) if obj.pengumuman_id else None


class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ["endpoint", "p256dh", "auth"]

    def validate_endpoint(self, value):
        if not value.startswith("https://"):
            raise serializers.ValidationError("Endpoint harus HTTPS.")
        return value
