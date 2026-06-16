import uuid
from pathlib import Path

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


def bukti_upload_path(instance, filename):
    """Simpan bukti transfer dengan nama UUID acak — original filename dibuang."""
    ext = Path(filename).suffix.lower()
    random_name = f"{uuid.uuid4()}{ext}"
    return f"bukti-iuran/{instance.id}/{random_name}"


class KategoriTransaksi(models.Model):
    """Kategori pemasukan/pengeluaran kas RT."""

    class Tipe(models.TextChoices):
        PEMASUKAN = "pemasukan", "Pemasukan"
        PENGELUARAN = "pengeluaran", "Pengeluaran"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nama = models.CharField(max_length=100)
    tipe = models.CharField(max_length=20, choices=Tipe.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "kategori_transaksi"
        ordering = ["tipe", "nama"]
        indexes = [
            models.Index(fields=["tipe"], name="idx_kategori_tipe"),
        ]

    def __str__(self):
        return f"{self.nama} ({self.tipe})"


class Transaksi(models.Model):
    """Transaksi keuangan RT — pemasukan dan pengeluaran."""

    class Tipe(models.TextChoices):
        PEMASUKAN = "pemasukan", "Pemasukan"
        PENGELUARAN = "pengeluaran", "Pengeluaran"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        CONFIRMED = "confirmed", "Confirmed"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kategori = models.ForeignKey(
        KategoriTransaksi,
        on_delete=models.PROTECT,
        related_name="transaksi_set",
    )
    jumlah = models.DecimalField(max_digits=15, decimal_places=2)
    keterangan = models.TextField(blank=True, default="")
    tanggal = models.DateField()
    tipe = models.CharField(max_length=20, choices=Tipe.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CONFIRMED)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="transaksi_dibuat",
    )
    confirmed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transaksi_dikonfirmasi",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "transaksi"
        ordering = ["-tanggal", "-created_at"]
        indexes = [
            models.Index(fields=["tipe"], name="idx_transaksi_tipe"),
            models.Index(fields=["tanggal"], name="idx_transaksi_tanggal"),
            models.Index(fields=["status"], name="idx_transaksi_status"),
            models.Index(fields=["created_by"], name="idx_transaksi_created_by"),
        ]

    def __str__(self):
        return f"{self.tipe} Rp{self.jumlah:,.0f} ({self.tanggal})"


class JenisIuran(models.Model):
    """Jenis/kategori iuran RT — configurable oleh bendahara/admin."""

    class Tipe(models.TextChoices):
        WAJIB = "wajib", "Wajib"
        OPSIONAL = "opsional", "Opsional"

    class Unit(models.TextChoices):
        PER_WARGA = "per_warga", "Per Orang/Warga"
        PER_KK = "per_kk", "Per KK"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nama = models.CharField(max_length=100)
    slug = models.SlugField(max_length=50, unique=True)
    tipe = models.CharField(max_length=20, choices=Tipe.choices, default=Tipe.WAJIB)
    unit = models.CharField(max_length=20, choices=Unit.choices, default=Unit.PER_WARGA)
    nominal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    keterangan = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    urutan = models.IntegerField(default=0, help_text="Urutan tampil (kecil = pertama)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "jenis_iuran"
        ordering = ["urutan", "nama"]
        indexes = [
            models.Index(fields=["is_active"], name="idx_jenis_iuran_active"),
        ]

    def __str__(self):
        return f"{self.nama} ({self.tipe}/{self.unit})"


class IuranWarga(models.Model):
    """Iuran bulanan warga RT — dengan bukti transfer, per jenis iuran."""

    class Status(models.TextChoices):
        PENDING = "pending", "Menunggu Konfirmasi"
        LUNAS = "lunas", "Lunas"
        DITOLAK = "ditolak", "Ditolak"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    warga = models.ForeignKey(
        "accounts.WargaProfile",
        on_delete=models.CASCADE,
        related_name="iuran_set",
    )
    jenis = models.ForeignKey(
        JenisIuran,
        on_delete=models.PROTECT,
        related_name="iuran_set",
        null=True,
        blank=True,
    )
    bulan = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)]
    )
    tahun = models.IntegerField(
        validators=[MinValueValidator(2000), MaxValueValidator(2100)]
    )
    jumlah = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    bukti_transfer = models.FileField(
        upload_to=bukti_upload_path,
        null=True,
        blank=True,
    )
    keterangan = models.TextField(blank=True, default="")
    confirmed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="iuran_dikonfirmasi",
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "iuran_warga"
        ordering = ["-tahun", "-bulan"]
        unique_together = [("warga", "jenis", "bulan", "tahun")]
        indexes = [
            models.Index(fields=["warga"], name="idx_iuran_warga"),
            models.Index(fields=["tahun", "bulan"], name="idx_iuran_periode"),
            models.Index(fields=["status"], name="idx_iuran_status"),
            models.Index(fields=["jenis"], name="idx_iuran_jenis"),
        ]

    def __str__(self):
        jenis_nama = self.jenis.nama if self.jenis else "Umum"
        return f"Iuran {jenis_nama} — {self.warga.nama_lengkap} {self.bulan}/{self.tahun} — {self.status}"


class PengaturanIuran(models.Model):
    """Pengaturan iuran warga RT — singleton (selalu hanya 1 row, pk=1)."""

    nominal_default = models.DecimalField(
        max_digits=15, decimal_places=2, default=50000,
        help_text="Nominal default iuran bulanan warga (Rp)",
    )
    saldo_awal = models.DecimalField(
        max_digits=15, decimal_places=2, default=0,
        help_text="Saldo awal kas RT saat pertama kali go-production (Rp)",
    )
    keterangan = models.TextField(blank=True, default="", help_text="Deskripsi iuran bulanan")
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="pengaturan_iuran_updated",
    )

    class Meta:
        db_table = "pengaturan_iuran"
        verbose_name = "Pengaturan Iuran"

    def __str__(self):
        return f"Pengaturan Iuran — Rp{self.nominal_default:,.0f}"

    @classmethod
    def get_instance(cls):
        """Ambil atau buat row singleton pengaturan iuran."""
        obj, _ = cls.objects.get_or_create(pk=1, defaults={"nominal_default": 50000})
        return obj
