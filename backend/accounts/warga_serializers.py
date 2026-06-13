"""Serializer warga dengan field masking per-role.

Lihat docs/06-API-CONTRACT.md §3.1 (Field Visibility per Role) dan
docs/05-DATABASE.md §3.3 (Sensitive data classification).

Hierarki:
  WargaWriteSerializer      — create/update oleh sekretaris/admin
  WargaAdminSerializer      — read full (admin, sekretaris)
  WargaBendaharaSerializer  — read masked NIK/KK/phone, no email (bendahara)
  WargaPengurusSerializer   — read masked NIK/KK/phone, no email/foto (pengurus)
  WargaOwnSerializer        — read own full data (warga melihat profil sendiri)
  WargaPublicSerializer     — read minimal publik (warga melihat data orang lain)
"""

import uuid

from rest_framework import serializers

from .models import User, WargaProfile


def _mask_nik(value):
    if not value:
        return None
    s = str(value)
    return s[:4] + "********" + s[-4:] if len(s) >= 8 else "****"


def _mask_phone(value):
    if not value:
        return None
    s = str(value)
    return s[:4] + "****" + s[-4:] if len(s) >= 8 else "****"


def _mask_email(value):
    if not value:
        return None
    parts = value.split("@")
    if len(parts) == 2:
        local = parts[0]
        return (local[:2] + "***@" + parts[1]) if len(local) > 2 else "***@" + parts[1]
    return "***"


def _foto_url(foto, request=None):
    if not foto:
        return None
    try:
        if request:
            return request.build_absolute_uri(foto.url)
        return foto.url
    except Exception:
        return None


class WargaWriteSerializer(serializers.ModelSerializer):
    """Dipakai untuk create/update warga (sekretaris/admin).

    Field camelCase sesuai docs/06-API-CONTRACT.md §3.3 & §3.4.
    User (akun) warga harus sudah dibuat sebelum profil dibuat — field
    `userId` wajib ada saat create.
    """

    userId = serializers.UUIDField(write_only=True, required=False)  # noqa: N815
    namaLengkap = serializers.CharField(source="nama_lengkap", max_length=255)  # noqa: N815
    tempatLahir = serializers.CharField(source="tempat_lahir", required=False, allow_null=True, allow_blank=True)  # noqa: N815
    tanggalLahir = serializers.DateField(source="tanggal_lahir", required=False, allow_null=True)  # noqa: N815
    jenisKelamin = serializers.ChoiceField(source="jenis_kelamin", choices=WargaProfile.JenisKelamin.choices, required=False, allow_null=True, allow_blank=True)  # noqa: N815
    statusPerkawinan = serializers.ChoiceField(source="status_perkawinan", choices=WargaProfile.StatusPerkawinan.choices, required=False, allow_null=True, allow_blank=True)  # noqa: N815
    hubunganKeluarga = serializers.CharField(source="hubungan_keluarga", required=False, allow_null=True, allow_blank=True)  # noqa: N815
    noKk = serializers.CharField(source="no_kk", max_length=16, required=False, allow_null=True, allow_blank=True)  # noqa: N815
    noRumah = serializers.CharField(source="no_rumah", max_length=10, required=False, allow_null=True, allow_blank=True)  # noqa: N815

    class Meta:
        model = WargaProfile
        fields = [
            "userId",
            "nik",
            "namaLengkap",
            "tempatLahir",
            "tanggalLahir",
            "jenisKelamin",
            "agama",
            "statusPerkawinan",
            "pendidikan",
            "pekerjaan",
            "noKk",
            "hubunganKeluarga",
            "alamat",
            "blok",
            "noRumah",
            "status",
        ]

    def validate_nik(self, value):
        if value:
            qs = WargaProfile.objects.filter(nik=value, is_deleted=False)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("NIK sudah terdaftar", code="WARGA_NIK_DUPLICATE")
        return value

    def validate_userId(self, value):  # noqa: N802
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User tidak ditemukan")
        if WargaProfile.objects.filter(user_id=value, is_deleted=False).exists():
            raise serializers.ValidationError("User sudah memiliki profil warga")
        return value

    def create(self, validated_data):
        user_id = validated_data.pop("userId", None)
        if user_id is None:
            raise serializers.ValidationError({"userId": "userId wajib diisi saat membuat profil warga"})
        return WargaProfile.objects.create(user_id=user_id, **validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("userId", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class _WargaBaseReadSerializer(serializers.ModelSerializer):
    """Base read serializer — field non-sensitif yang selalu muncul."""

    id = serializers.UUIDField()
    namaLengkap = serializers.CharField(source="nama_lengkap")  # noqa: N815
    blok = serializers.CharField()
    noRumah = serializers.CharField(source="no_rumah")  # noqa: N815
    status = serializers.CharField()
    createdAt = serializers.DateTimeField(source="created_at")  # noqa: N815
    updatedAt = serializers.DateTimeField(source="updated_at")  # noqa: N815

    class Meta:
        model = WargaProfile
        fields = ["id", "namaLengkap", "blok", "noRumah", "status", "createdAt", "updatedAt"]


class WargaAdminSerializer(_WargaBaseReadSerializer):
    """Full data — admin, sekretaris."""

    userId = serializers.UUIDField(source="user.id")  # noqa: N815
    nik = serializers.CharField()
    noKk = serializers.CharField(source="no_kk")  # noqa: N815
    tempatLahir = serializers.CharField(source="tempat_lahir")  # noqa: N815
    tanggalLahir = serializers.DateField(source="tanggal_lahir")  # noqa: N815
    jenisKelamin = serializers.CharField(source="jenis_kelamin")  # noqa: N815
    agama = serializers.CharField()
    statusPerkawinan = serializers.CharField(source="status_perkawinan")  # noqa: N815
    pendidikan = serializers.CharField()
    pekerjaan = serializers.CharField()
    hubunganKeluarga = serializers.CharField(source="hubungan_keluarga")  # noqa: N815
    alamat = serializers.CharField()
    phone = serializers.CharField(source="user.phone")
    email = serializers.EmailField(source="user.email")
    foto = serializers.SerializerMethodField()

    class Meta(WargaProfile.__class__):
        model = WargaProfile
        fields = [
            "id", "userId", "nik", "namaLengkap", "tempatLahir", "tanggalLahir",
            "jenisKelamin", "agama", "statusPerkawinan", "pendidikan", "pekerjaan",
            "noKk", "hubunganKeluarga", "alamat", "blok", "noRumah", "phone", "email",
            "status", "foto", "createdAt", "updatedAt",
        ]

    def get_foto(self, obj):
        return _foto_url(obj.foto, self.context.get("request"))


class WargaBendaharaSerializer(_WargaBaseReadSerializer):
    """Masked NIK/KK/phone, no email, no foto detail — bendahara."""

    nikMasked = serializers.SerializerMethodField()  # noqa: N815
    noKkMasked = serializers.SerializerMethodField()  # noqa: N815
    phoneMasked = serializers.SerializerMethodField()  # noqa: N815
    # alamat terbatas: hanya blok+noRumah (sudah ada di base)
    pekerjaan = serializers.CharField()
    status = serializers.CharField()

    class Meta:
        model = WargaProfile
        fields = ["id", "nikMasked", "noKkMasked", "namaLengkap", "blok", "noRumah",
                  "phoneMasked", "pekerjaan", "status", "createdAt", "updatedAt"]

    def get_nikMasked(self, obj):  # noqa: N802
        return _mask_nik(obj.nik)

    def get_noKkMasked(self, obj):  # noqa: N802
        return _mask_nik(obj.no_kk)

    def get_phoneMasked(self, obj):  # noqa: N802
        return _mask_phone(obj.user.phone)


class WargaPengurusSerializer(_WargaBaseReadSerializer):
    """Masked NIK/KK/phone, no email, foto masked (hidden) — pengurus."""

    nikMasked = serializers.SerializerMethodField()  # noqa: N815
    noKkMasked = serializers.SerializerMethodField()  # noqa: N815
    phoneMasked = serializers.SerializerMethodField()  # noqa: N815
    pekerjaan = serializers.CharField()

    class Meta:
        model = WargaProfile
        fields = ["id", "nikMasked", "noKkMasked", "namaLengkap", "blok", "noRumah",
                  "phoneMasked", "pekerjaan", "status", "createdAt", "updatedAt"]

    def get_nikMasked(self, obj):  # noqa: N802
        return _mask_nik(obj.nik)

    def get_noKkMasked(self, obj):  # noqa: N802
        return _mask_nik(obj.no_kk)

    def get_phoneMasked(self, obj):  # noqa: N802
        return _mask_phone(obj.user.phone)


class WargaOwnSerializer(_WargaBaseReadSerializer):
    """Full own data — warga melihat profilnya sendiri."""

    userId = serializers.UUIDField(source="user.id")  # noqa: N815
    nik = serializers.CharField()
    noKk = serializers.CharField(source="no_kk")  # noqa: N815
    tempatLahir = serializers.CharField(source="tempat_lahir")  # noqa: N815
    tanggalLahir = serializers.DateField(source="tanggal_lahir")  # noqa: N815
    jenisKelamin = serializers.CharField(source="jenis_kelamin")  # noqa: N815
    agama = serializers.CharField()
    statusPerkawinan = serializers.CharField(source="status_perkawinan")  # noqa: N815
    pendidikan = serializers.CharField()
    pekerjaan = serializers.CharField()
    hubunganKeluarga = serializers.CharField(source="hubungan_keluarga")  # noqa: N815
    alamat = serializers.CharField()
    phone = serializers.CharField(source="user.phone")
    email = serializers.EmailField(source="user.email")
    foto = serializers.SerializerMethodField()

    class Meta:
        model = WargaProfile
        fields = [
            "id", "userId", "nik", "namaLengkap", "tempatLahir", "tanggalLahir",
            "jenisKelamin", "agama", "statusPerkawinan", "pendidikan", "pekerjaan",
            "noKk", "hubunganKeluarga", "alamat", "blok", "noRumah", "phone", "email",
            "status", "foto", "createdAt", "updatedAt",
        ]

    def get_foto(self, obj):
        return _foto_url(obj.foto, self.context.get("request"))


class WargaPublicSerializer(_WargaBaseReadSerializer):
    """Hanya data non-sensitif — warga melihat profil warga lain."""

    class Meta:
        model = WargaProfile
        fields = ["id", "namaLengkap", "blok", "noRumah", "status"]


def get_warga_serializer_class(requesting_user, target_profile):
    """Pilih serializer yang tepat berdasarkan role dan kepemilikan.

    Lihat docs/06-API-CONTRACT.md §3.1 Field Visibility per Role.
    """
    role = requesting_user.role
    if role in ("admin", "sekretaris"):
        return WargaAdminSerializer
    if role == "bendahara":
        return WargaBendaharaSerializer
    if role == "pengurus":
        return WargaPengurusSerializer
    # warga
    if target_profile is not None and target_profile.user == requesting_user:
        return WargaOwnSerializer
    return WargaPublicSerializer
