import os

from rest_framework import serializers

from .models import Pengumuman

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


def validate_gambar_file(file):
    """Validasi gambar pengumuman: ukuran, ekstensi, MIME type, magic bytes."""
    if file.size > MAX_FILE_SIZE:
        raise serializers.ValidationError(
            {"gambar": "Ukuran gambar maksimal 5 MB."},
            code="FILE_TOO_LARGE",
        )
    _, ext = os.path.splitext(file.name.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise serializers.ValidationError(
            {"gambar": f"Format gambar tidak didukung. Gunakan: {', '.join(ALLOWED_EXTENSIONS)}."},
            code="FILE_INVALID_EXTENSION",
        )
    mime_type = getattr(file, "content_type", None)
    if mime_type and mime_type not in ALLOWED_MIME_TYPES:
        raise serializers.ValidationError(
            {"gambar": "MIME type file tidak didukung."},
            code="FILE_INVALID_MIME",
        )
    # Magic bytes check — Python 3.13 compatible (no imghdr)
    file.seek(0)
    header = file.read(16)
    file.seek(0)
    is_jpeg = header[:3] == b"\xff\xd8\xff"
    is_png = header[:8] == b"\x89PNG\r\n\x1a\n"
    is_webp = header[:4] == b"RIFF" and header[8:12] == b"WEBP"
    if not (is_jpeg or is_png or is_webp):
        raise serializers.ValidationError(
            {"gambar": "Isi file gambar tidak valid (bukan JPEG/PNG/WebP)."},
            code="FILE_MIME_MISMATCH",
        )
    return file


class PengumumanCreatedBySerializer(serializers.Serializer):
    namaLengkap = serializers.SerializerMethodField()

    def get_namaLengkap(self, obj):
        profile = getattr(obj, "profile", None)
        if profile:
            return profile.nama_lengkap
        return obj.email


class PengumumanListSerializer(serializers.ModelSerializer):
    gambar = serializers.SerializerMethodField()
    createdBy = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    scheduledAt = serializers.DateTimeField(source="scheduled_at", read_only=True)

    class Meta:
        model = Pengumuman
        fields = [
            "id",
            "judul",
            "isi",
            "kategori",
            "gambar",
            "scheduledAt",
            "isPublished",
            "createdBy",
            "createdAt",
        ]

    # map is_published → isPublished for API consistency
    isPublished = serializers.BooleanField(source="is_published", read_only=True)

    def get_gambar(self, obj):
        if not obj.gambar:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.gambar.url)
        return obj.gambar.url

    def get_createdBy(self, obj):
        user = obj.created_by
        profile = getattr(user, "profile", None)
        nama = profile.nama_lengkap if profile else user.email
        return {"namaLengkap": nama}


class PengumumanCreateSerializer(serializers.ModelSerializer):
    gambar = serializers.FileField(required=False, allow_null=True)
    scheduledAt = serializers.DateTimeField(
        source="scheduled_at", required=False, allow_null=True
    )

    class Meta:
        model = Pengumuman
        fields = ["judul", "isi", "kategori", "gambar", "scheduledAt"]

    def validate_gambar(self, value):
        if value:
            validate_gambar_file(value)
        return value

    def validate_kategori(self, value):
        valid = {c[0] for c in Pengumuman.Kategori.choices}
        if value not in valid:
            raise serializers.ValidationError(f"Kategori tidak valid. Pilih: {', '.join(valid)}.")
        return value
