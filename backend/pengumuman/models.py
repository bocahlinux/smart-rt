import uuid
from pathlib import Path

from django.db import models


def gambar_upload_path(instance, filename):
    """Simpan gambar pengumuman dengan nama UUID acak — original filename dibuang."""
    ext = Path(filename).suffix.lower()
    random_name = f"{uuid.uuid4()}{ext}"
    return f"pengumuman/{instance.id}/{random_name}"


class Pengumuman(models.Model):
    """Pengumuman RT — bisa dijadwalkan (scheduled_at) dan diberi gambar."""

    class Kategori(models.TextChoices):
        PENTING = "penting", "Penting"
        ACARA = "acara", "Acara"
        INFO = "info", "Informasi"
        KEAMANAN = "keamanan", "Keamanan"
        LAINNYA = "lainnya", "Lainnya"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    judul = models.CharField(max_length=200)
    isi = models.TextField()
    kategori = models.CharField(
        max_length=20,
        choices=Kategori.choices,
        default=Kategori.INFO,
    )
    gambar = models.FileField(
        upload_to=gambar_upload_path,
        null=True,
        blank=True,
    )
    scheduled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Jadwal publikasi. Kosong = segera dipublikasikan.",
    )
    is_published = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="pengumuman_dibuat",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pengumuman"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["kategori"], name="idx_pengumuman_kategori"),
            models.Index(fields=["is_published"], name="idx_pengumuman_published"),
            models.Index(fields=["scheduled_at"], name="idx_pengumuman_scheduled"),
            models.Index(fields=["created_by"], name="idx_pengumuman_created_by"),
        ]

    def __str__(self):
        return f"{self.judul} ({self.kategori})"
