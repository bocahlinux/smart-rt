import uuid

from django.db import models


class KartuKeluarga(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    no_kk = models.CharField(max_length=16, unique=True)
    alamat = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="kk_dibuat",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "kartu_keluarga"
        indexes = [
            models.Index(fields=["no_kk"], name="idx_kk_no_kk"),
        ]

    def __str__(self):
        return f"KK {self.no_kk}"

    @property
    def kepala_keluarga(self):
        return self.anggota.filter(
            hubungan_keluarga="kepala_keluarga", is_deleted=False
        ).first()


class StatusPengajuan(models.TextChoices):
    PENDING = "pending", "Pending"
    DISETUJUI = "disetujui", "Disetujui"
    DITOLAK = "ditolak", "Ditolak"


class PengajuanAnggotaBaru(models.Model):
    """Warga mengajukan penambahan anggota baru ke KK — butuh approval admin."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kartu_keluarga = models.ForeignKey(
        KartuKeluarga,
        on_delete=models.CASCADE,
        related_name="pengajuan_tambah",
    )
    pengaju = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="pengajuan_tambah_anggota",
    )
    data_anggota = models.JSONField()
    alasan = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=StatusPengajuan.choices,
        default=StatusPengajuan.PENDING,
    )
    catatan_admin = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="review_tambah_anggota",
    )

    class Meta:
        db_table = "pengajuan_anggota_baru"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"], name="idx_pengajuan_tambah_status"),
            models.Index(fields=["kartu_keluarga"], name="idx_pengajuan_tambah_kk"),
        ]

    def __str__(self):
        return f"Tambah Anggota KK {self.kartu_keluarga.no_kk} — {self.status}"


class PengajuanPenghapusanAnggota(models.Model):
    """Warga mengajukan penghapusan anggota KK — disetujui → soft-delete WargaProfile."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kartu_keluarga = models.ForeignKey(
        KartuKeluarga,
        on_delete=models.CASCADE,
        related_name="pengajuan_hapus",
    )
    warga_target = models.ForeignKey(
        "accounts.WargaProfile",
        on_delete=models.CASCADE,
        related_name="pengajuan_penghapusan",
    )
    pengaju = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="pengajuan_hapus_anggota",
    )
    alasan = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=StatusPengajuan.choices,
        default=StatusPengajuan.PENDING,
    )
    catatan_admin = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="review_hapus_anggota",
    )

    class Meta:
        db_table = "pengajuan_penghapusan_anggota"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"], name="idx_pengajuan_hapus_status"),
            models.Index(fields=["kartu_keluarga"], name="idx_pengajuan_hapus_kk"),
        ]

    def __str__(self):
        return f"Hapus {self.warga_target.nama_lengkap} — {self.status}"


class PengajuanPerubahanWarga(models.Model):
    """Warga mengajukan perubahan data anggota keluarga — butuh approval admin."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    warga_target = models.ForeignKey(
        "accounts.WargaProfile",
        on_delete=models.CASCADE,
        related_name="pengajuan_perubahan",
    )
    pengaju = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="pengajuan_ubah_data",
    )
    field_changes = models.JSONField()
    alasan = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=StatusPengajuan.choices,
        default=StatusPengajuan.PENDING,
    )
    catatan_admin = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="review_perubahan_warga",
    )

    class Meta:
        db_table = "pengajuan_perubahan_warga"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"], name="idx_pengajuan_ubah_status"),
            models.Index(fields=["warga_target"], name="idx_pengajuan_ubah_target"),
        ]

    def __str__(self):
        return f"Ubah Data {self.warga_target.nama_lengkap} — {self.status}"
