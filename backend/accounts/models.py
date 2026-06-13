import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended User model — RESTRICTED (password hash never exposed).

    Lihat docs/05-DATABASE.md §4.1 dan §5 untuk skema lengkap.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        SEKRETARIS = "sekretaris", "Sekretaris"
        BENDAHARA = "bendahara", "Bendahara"
        PENGURUS = "pengurus", "Pengurus"
        WARGA = "warga", "Warga"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACTIVE = "active", "Active"
        REJECTED = "rejected", "Rejected"

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True)  # SENSITIF
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.WARGA)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "phone"]

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["email"], name="idx_users_email"),
            models.Index(fields=["phone"], name="idx_users_phone"),
            models.Index(fields=["role"], name="idx_users_role"),
            models.Index(fields=["status"], name="idx_users_status"),
        ]

    def __str__(self):
        return self.email


class WargaProfile(models.Model):
    """Profil lengkap warga — data SENSITIF.

    Lihat docs/05-DATABASE.md §4.2, §3.3, §10.6 untuk skema, klasifikasi data,
    dan kebijakan soft-delete.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class JenisKelamin(models.TextChoices):
        LAKI = "L", "Laki-laki"
        PEREMPUAN = "P", "Perempuan"

    class StatusPerkawinan(models.TextChoices):
        BELUM_KAWIN = "belum_kawin", "Belum Kawin"
        KAWIN = "kawin", "Kawin"
        CERAI_HIDUP = "cerai_hidup", "Cerai Hidup"
        CERAI_MATI = "cerai_mati", "Cerai Mati"

    class Status(models.TextChoices):
        AKTIF = "aktif", "Aktif"
        TIDAK_AKTIF = "tidak_aktif", "Tidak Aktif"
        PINDAH = "pindah", "Pindah"
        MENINGGAL = "meninggal", "Meninggal"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    nik = models.CharField(max_length=16, unique=True, null=True, blank=True)  # SENSITIF
    nama_lengkap = models.CharField(max_length=255)
    tempat_lahir = models.CharField(max_length=100, null=True, blank=True)  # SENSITIF
    tanggal_lahir = models.DateField(null=True, blank=True)  # SENSITIF
    jenis_kelamin = models.CharField(
        max_length=1, choices=JenisKelamin.choices, null=True, blank=True
    )
    agama = models.CharField(max_length=50, null=True, blank=True)
    status_perkawinan = models.CharField(
        max_length=20, choices=StatusPerkawinan.choices, null=True, blank=True
    )
    pendidikan = models.CharField(max_length=100, null=True, blank=True)
    pekerjaan = models.CharField(max_length=100, null=True, blank=True)
    no_kk = models.CharField(max_length=16, null=True, blank=True)  # SENSITIF
    hubungan_keluarga = models.CharField(max_length=50, null=True, blank=True)
    alamat = models.TextField(null=True, blank=True)  # SENSITIF
    blok = models.CharField(max_length=10, null=True, blank=True)
    no_rumah = models.CharField(max_length=10, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AKTIF)
    foto = models.FileField(upload_to="foto-profil/", null=True, blank=True)  # SENSITIF
    # Soft-delete — lihat docs/05-DATABASE.md §10.6
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="warga_deleted",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "warga_profiles"
        indexes = [
            models.Index(fields=["nama_lengkap"], name="idx_warga_nama"),
            models.Index(fields=["blok"], name="idx_warga_blok"),
            models.Index(fields=["status"], name="idx_warga_status"),
            models.Index(fields=["nik"], name="idx_warga_nik"),
            models.Index(fields=["is_deleted"], name="idx_warga_is_deleted"),
        ]

    def __str__(self):
        return self.nama_lengkap
