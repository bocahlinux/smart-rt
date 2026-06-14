import os

from django.utils import timezone
from rest_framework import serializers

from .models import Pengaduan

# Foto pengaduan: gambar saja (bukan PDF), max 5 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_foto_pengaduan(file):
    """Validasi foto pengaduan: ukuran, ekstensi, MIME type, magic bytes.
    Sesuai docs/11-SECURITY.md §6 (File Upload Security).
    """
    if file is None:
        return file

    # Cek ukuran
    if file.size > MAX_FILE_SIZE:
        raise serializers.ValidationError(
            {"foto": "Ukuran foto maksimal 5 MB."},
            code="FILE_TOO_LARGE",
        )

    # Cek ekstensi
    _, ext = os.path.splitext(file.name.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise serializers.ValidationError(
            {"foto": f"Format foto tidak didukung. Gunakan: {', '.join(ALLOWED_EXTENSIONS)}."},
            code="FILE_INVALID_EXTENSION",
        )

    # Cek MIME type dari header Content-Type
    mime_type = getattr(file, "content_type", None)
    if mime_type and mime_type not in ALLOWED_MIME_TYPES:
        raise serializers.ValidationError(
            {"foto": "MIME type foto tidak didukung."},
            code="FILE_INVALID_MIME",
        )

    # Magic bytes check — Python 3.13 compatible (tanpa imghdr)
    file.seek(0)
    header = file.read(16)
    file.seek(0)
    is_jpeg = header[:3] == b"\xff\xd8\xff"
    is_png = header[:8] == b"\x89PNG\r\n\x1a\n"
    is_webp = header[:4] == b"RIFF" and header[8:12] == b"WEBP"
    if not (is_jpeg or is_png or is_webp):
        raise serializers.ValidationError(
            {"foto": "Isi file foto tidak valid (bukan JPEG/PNG/WebP)."},
            code="FILE_MIME_MISMATCH",
        )

    return file


class PengaduanWargaSerializer(serializers.Serializer):
    """Serializer nested untuk info pelapor (warga)."""

    namaLengkap = serializers.SerializerMethodField()

    def get_namaLengkap(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.nama_lengkap if profile else obj.email


class PengaduanListSerializer(serializers.ModelSerializer):
    """Serializer untuk list pengaduan — data ringkas."""

    warga = PengaduanWargaSerializer(read_only=True)
    foto = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Pengaduan
        fields = [
            "id",
            "judul",
            "kategori",
            "status",
            "foto",
            "warga",
            "createdAt",
        ]

    def get_foto(self, obj):
        if not obj.foto:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.foto.url)
        return obj.foto.url


class PengaduanDetailSerializer(serializers.ModelSerializer):
    """Serializer untuk detail pengaduan — data lengkap + status history."""

    warga = PengaduanWargaSerializer(read_only=True)
    foto = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    statusHistory = serializers.JSONField(source="status_history", read_only=True)

    class Meta:
        model = Pengaduan
        fields = [
            "id",
            "judul",
            "deskripsi",
            "kategori",
            "status",
            "foto",
            "warga",
            "statusHistory",
            "createdAt",
            "updatedAt",
        ]

    def get_foto(self, obj):
        if not obj.foto:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.foto.url)
        return obj.foto.url


class PengaduanCreateSerializer(serializers.ModelSerializer):
    """Serializer untuk membuat pengaduan baru (multipart/form-data)."""

    foto = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Pengaduan
        fields = ["judul", "deskripsi", "kategori", "foto"]

    def validate_foto(self, value):
        if value:
            validate_foto_pengaduan(value)
        return value

    def validate_kategori(self, value):
        valid = {c[0] for c in Pengaduan.Kategori.choices}
        if value not in valid:
            raise serializers.ValidationError(
                f"Kategori tidak valid. Pilih: {', '.join(valid)}."
            )
        return value

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["warga"] = user
        # Inisialisasi status history dengan entry pertama
        validated_data["status_history"] = [
            {
                "status": Pengaduan.Status.DIAJUKAN,
                "keterangan": "Pengaduan berhasil diajukan.",
                "updatedBy": user.email,
                "updatedAt": timezone.now().isoformat(),
            }
        ]
        return super().create(validated_data)


class PengaduanStatusUpdateSerializer(serializers.Serializer):
    """Serializer untuk update status pengaduan oleh pengurus."""

    status = serializers.ChoiceField(choices=Pengaduan.Status.choices)
    keterangan = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        default="",
    )
