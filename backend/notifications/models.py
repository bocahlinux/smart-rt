import uuid

from django.db import models


class Notification(models.Model):
    """Notifikasi in-app per user — dibuat otomatis saat ada pengumuman baru."""

    class Tipe(models.TextChoices):
        INFO = "info", "Info"
        PENTING = "penting", "Penting"
        ACARA = "acara", "Acara"
        KEAMANAN = "keamanan", "Keamanan"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    judul = models.CharField(max_length=200)
    isi = models.TextField()
    tipe = models.CharField(max_length=20, choices=Tipe.choices, default=Tipe.INFO)
    is_read = models.BooleanField(default=False)
    pengumuman = models.ForeignKey(
        "pengumuman.Pengumuman",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    link = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"], name="idx_notif_user_read"),
        ]

    def __str__(self):
        status = "read" if self.is_read else "unread"
        return f"[{status}] {self.judul} → {self.user.email}"


class PushSubscription(models.Model):
    """Web Push subscription endpoint per user-device."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="push_subscriptions",
    )
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "push_subscription"
        indexes = [
            models.Index(fields=["user"], name="idx_push_user"),
        ]

    def __str__(self):
        return f"Push sub {self.user.email} — {self.endpoint[:40]}..."
