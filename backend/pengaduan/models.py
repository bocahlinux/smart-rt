import uuid

from django.db import models

from accounts.models import User


def pengaduan_foto_upload_path(instance, filename):
    """Upload path untuk foto pengaduan — UUID-based filename untuk keamanan."""
    ext = filename.rsplit(".", 1)[-1].lower()
    return f"pengaduan/{uuid.uuid4()}.{ext}"


class Pengaduan(models.Model):
    """Pengaduan warga ke pengurus RT."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Kategori(models.TextChoices):
        INFRASTRUKTUR = "infrastruktur", "Infrastruktur"
        KEAMANAN = "keamanan", "Keamanan"
        KEBERSIHAN = "kebersihan", "Kebersihan"
        SOSIAL = "sosial", "Sosial"
        LAINNYA = "lainnya", "Lainnya"

    class Status(models.TextChoices):
        DIAJUKAN = "diajukan", "Diajukan"
        DIPROSES = "diproses", "Diproses"
        SELESAI = "selesai", "Selesai"
        DITOLAK = "ditolak", "Ditolak"

    # Relasi — FK ke User (pelapor)
    warga = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="pengaduan",
        db_column="warga_id",
    )

    judul = models.CharField(max_length=255)
    deskripsi = models.TextField()
    kategori = models.CharField(
        max_length=20,
        choices=Kategori.choices,
        default=Kategori.LAINNYA,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DIAJUKAN,
    )

    # Foto bukti pengaduan — opsional, validasi di serializer
    foto = models.FileField(
        upload_to=pengaduan_foto_upload_path,
        null=True,
        blank=True,
    )

    # Status history — disimpan sebagai JSON untuk timeline tracking
    # Format: [{"status": "diajukan", "keterangan": "...", "updatedBy": "email", "updatedAt": "iso"}]
    status_history = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pengaduan"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["warga"], name="idx_pengaduan_warga"),
            models.Index(fields=["status"], name="idx_pengaduan_status"),
            models.Index(fields=["kategori"], name="idx_pengaduan_kategori"),
            models.Index(fields=["created_at"], name="idx_pengaduan_created_at"),
        ]

    def __str__(self):
        return f"{self.judul} ({self.status})"
