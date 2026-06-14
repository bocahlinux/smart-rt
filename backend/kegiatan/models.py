import uuid

from django.db import models

from accounts.models import User


class Kegiatan(models.Model):
    """Kegiatan / acara RT yang bisa di-RSVP oleh warga."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nama = models.CharField(max_length=255)
    deskripsi = models.TextField(null=True, blank=True)
    tanggal = models.DateTimeField()
    lokasi = models.CharField(max_length=255, null=True, blank=True)

    # Opsional: batas maksimal peserta (null = tanpa batas)
    kuota_peserta = models.PositiveIntegerField(null=True, blank=True)

    # Waktu buka/tutup RSVP (null = langsung buka, tutup saat tanggal kegiatan)
    rsvp_buka_at = models.DateTimeField(null=True, blank=True)
    rsvp_tutup_at = models.DateTimeField(null=True, blank=True)

    # Penanggung jawab — SET_NULL jika user dihapus
    penanggung_jawab = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="kegiatan_penanggung_jawab",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="kegiatan_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "kegiatan"
        ordering = ["tanggal"]
        indexes = [
            models.Index(fields=["tanggal"], name="idx_kegiatan_tanggal"),
            models.Index(fields=["created_by"], name="idx_kegiatan_created_by"),
        ]

    def __str__(self):
        return self.nama

    def rsvp_count(self):
        """Jumlah RSVP dengan status hadir."""
        return self.rsvp.filter(status=RSVP.Status.HADIR).count()


class RSVP(models.Model):
    """RSVP warga untuk kegiatan RT (upsert — satu user satu RSVP per kegiatan)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Status(models.TextChoices):
        HADIR = "hadir", "Hadir"
        TIDAK_HADIR = "tidak_hadir", "Tidak Hadir"
        MASIH_RAGU = "masih_ragu", "Masih Ragu"

    kegiatan = models.ForeignKey(Kegiatan, on_delete=models.CASCADE, related_name="rsvp")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rsvp")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.HADIR
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rsvp"
        # Constraint: satu user hanya bisa punya 1 RSVP per kegiatan
        unique_together = [["kegiatan", "user"]]
        indexes = [
            models.Index(fields=["kegiatan"], name="idx_rsvp_kegiatan"),
            models.Index(fields=["user"], name="idx_rsvp_user"),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.kegiatan.nama} ({self.status})"
