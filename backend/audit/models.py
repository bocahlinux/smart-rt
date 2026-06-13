import uuid

from django.db import models

from accounts.models import User


class AuditLog(models.Model):
    """Audit log — RESTRICTED.

    Aturan (lihat docs/05-DATABASE.md §4.6 dan §10.4):
    - Tidak boleh menyimpan password, token, secret, atau file content.
    - Field sensitif (NIK, no KK, no HP, email, alamat) di-mask di old_data/new_data.
    - Akses hanya untuk admin (lihat docs/11-SECURITY.md).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="audit_logs")
    action = models.CharField(max_length=50)  # create/update/delete/verify/view/export
    table_name = models.CharField(max_length=50)
    record_id = models.UUIDField()
    old_data = models.JSONField(null=True, blank=True)  # RESTRICTED — field sensitif di-mask
    new_data = models.JSONField(null=True, blank=True)  # RESTRICTED — field sensitif di-mask
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user"], name="idx_audit_user"),
            models.Index(fields=["table_name"], name="idx_audit_table"),
            models.Index(fields=["created_at"], name="idx_audit_created"),
        ]

    def __str__(self):
        return f"{self.action} on {self.table_name} by {self.user_id}"
