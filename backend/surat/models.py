import uuid

from django.db import models


class JenisSurat(models.Model):
    """Jenis/kategori surat yang bisa diajukan warga."""

    class Kode(models.TextChoices):
        DOMISILI       = "domisili",       "Surat Keterangan Domisili"
        TIDAK_MAMPU    = "tidak_mampu",    "Surat Ket. Tidak Mampu (SKTM)"
        PENGANTAR      = "pengantar",      "Surat Pengantar"
        KELAHIRAN      = "kelahiran",      "Surat Ket. Kelahiran"
        KEMATIAN       = "kematian",       "Surat Ket. Kematian"
        PINDAH         = "pindah",         "Surat Ket. Pindah"
        USAHA          = "usaha",          "Surat Ket. Usaha (SKU)"
        BELUM_MENIKAH  = "belum_menikah",  "Surat Ket. Belum Menikah"
        IZIN_KERAMAIAN = "izin_keramaian", "Surat Izin Kegiatan/Hajatan"
        REKOMENDASI    = "rekomendasi",    "Surat Rekomendasi"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kode = models.CharField(max_length=30, unique=True, choices=Kode.choices)
    nama = models.CharField(max_length=150)
    deskripsi = models.TextField(blank=True, default="")
    # List of extra field names required beyond profile data
    field_tambahan = models.JSONField(
        default=list, blank=True,
        help_text="Daftar nama field tambahan yang wajib diisi pemohon",
    )
    is_active = models.BooleanField(default=True)
    urutan = models.IntegerField(default=0, help_text="Urutan tampil (kecil = pertama)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "jenis_surat"
        ordering = ["urutan", "nama"]
        indexes = [
            models.Index(fields=["is_active"], name="idx_jenis_surat_active"),
        ]

    def __str__(self):
        return self.nama


class PermohonanSurat(models.Model):
    """Permohonan surat warga — diajukan warga, disetujui sekretaris/ketua RT."""

    class Status(models.TextChoices):
        DIAJUKAN  = "diajukan",  "Diajukan"
        DIPROSES  = "diproses",  "Sedang Diproses"
        DISETUJUI = "disetujui", "Disetujui"
        DITOLAK   = "ditolak",   "Ditolak"
        SELESAI   = "selesai",   "Selesai"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pemohon = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="permohonan_surat",
    )
    jenis = models.ForeignKey(
        JenisSurat,
        on_delete=models.PROTECT,
        related_name="permohonan_set",
    )
    data_form = models.JSONField(default=dict, help_text="Data form yang diisi pemohon")
    keperluan = models.TextField(blank=True, default="", help_text="Keperluan/tujuan pembuatan surat")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DIAJUKAN
    )
    catatan_admin = models.TextField(blank=True, default="")
    no_surat = models.CharField(max_length=100, blank=True, null=True, unique=True)
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="surat_direview",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "permohonan_surat"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["pemohon"], name="idx_permohonan_pemohon"),
            models.Index(fields=["status"], name="idx_permohonan_status"),
            models.Index(fields=["jenis"], name="idx_permohonan_jenis"),
        ]

    def __str__(self):
        return f"{self.jenis.nama} — {self.pemohon.email} ({self.status})"


class PengaturanRT(models.Model):
    """Konfigurasi RT untuk keperluan surat — singleton (pk=1)."""

    nama_rt = models.CharField(max_length=20, default="RT 04")
    nama_rw = models.CharField(max_length=20, default="RW 03")
    kelurahan = models.CharField(max_length=100, default="Kelurahan ...")
    kecamatan = models.CharField(max_length=100, default="Kecamatan ...")
    kota = models.CharField(max_length=100, default="Kota ...")
    provinsi = models.CharField(max_length=100, default="Jawa Timur")
    kode_pos = models.CharField(max_length=10, blank=True, default="")
    nama_ketua_rt = models.CharField(max_length=255, blank=True, default="")
    nik_ketua_rt = models.CharField(max_length=16, blank=True, default="")
    logo = models.ImageField(upload_to="pengaturan-rt/logo/", null=True, blank=True)
    tanda_tangan = models.ImageField(upload_to="pengaturan-rt/ttd/", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="pengaturan_rt_updated",
    )

    class Meta:
        db_table = "pengaturan_rt"
        verbose_name = "Pengaturan RT"

    @classmethod
    def get_instance(cls):
        obj, _ = cls.objects.get_or_create(pk=1, defaults={})
        return obj

    def __str__(self):
        return f"{self.nama_rt}/{self.nama_rw} — {self.kelurahan}"
