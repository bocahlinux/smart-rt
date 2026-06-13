import os

from django.utils import timezone
from rest_framework import serializers

from accounts.models import WargaProfile
from .models import IuranWarga, KategoriTransaksi, Transaksi

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_bukti_file(file):
    """Validasi MIME type, ekstensi, dan ukuran file bukti transfer."""
    if file is None:
        return file

    # Cek ukuran
    if file.size > MAX_FILE_SIZE:
        raise serializers.ValidationError(
            {"bukti_transfer": "Ukuran file maksimal 5 MB."},
            code="FILE_TOO_LARGE",
        )

    # Cek ekstensi
    _, ext = os.path.splitext(file.name.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise serializers.ValidationError(
            {"bukti_transfer": f"Ekstensi file tidak diizinkan: {ext}. Gunakan jpg, png, webp, atau pdf."},
            code="FILE_TYPE_NOT_ALLOWED",
        )

    # Cek MIME type dari header Content-Type
    mime_type = getattr(file, "content_type", None)
    if mime_type and mime_type not in ALLOWED_MIME_TYPES:
        raise serializers.ValidationError(
            {"bukti_transfer": f"Tipe file tidak diizinkan: {mime_type}."},
            code="FILE_TYPE_NOT_ALLOWED",
        )

    # Cek magic bytes — deteksi tipe file dari header bytes
    file.seek(0)
    header = file.read(16)
    file.seek(0)
    is_pdf = header[:4] == b"%PDF"
    is_jpeg = header[:3] == b"\xff\xd8\xff"
    is_png = header[:8] == b"\x89PNG\r\n\x1a\n"
    is_webp = header[:4] == b"RIFF" and header[8:12] == b"WEBP"
    valid_magic = is_pdf or is_jpeg or is_png or is_webp
    if not valid_magic:
        raise serializers.ValidationError(
            {"bukti_transfer": "Isi file tidak sesuai dengan tipe yang diizinkan (magic bytes mismatch)."},
            code="FILE_MIME_MISMATCH",
        )

    return file


class KategoriTransaksiSerializer(serializers.ModelSerializer):
    class Meta:
        model = KategoriTransaksi
        fields = ["id", "nama", "tipe", "created_at"]
        read_only_fields = ["id", "created_at"]


class TransaksiListSerializer(serializers.ModelSerializer):
    kategori = KategoriTransaksiSerializer(read_only=True)
    created_by = serializers.SerializerMethodField()

    class Meta:
        model = Transaksi
        fields = [
            "id", "kategori", "jumlah", "keterangan",
            "tanggal", "tipe", "status", "created_by", "created_at",
        ]

    def get_created_by(self, obj):
        u = obj.created_by
        profile = getattr(u, "profile", None)
        nama = profile.nama_lengkap if profile else u.email
        return {"id": str(u.id), "namaLengkap": nama}


class TransaksiCreateSerializer(serializers.ModelSerializer):
    kategoriId = serializers.UUIDField(write_only=True, source="kategori_id")

    class Meta:
        model = Transaksi
        fields = ["kategoriId", "jumlah", "keterangan", "tanggal", "tipe"]

    def validate_jumlah(self, value):
        if value <= 0:
            raise serializers.ValidationError("Jumlah harus lebih dari 0.")
        return value

    def validate(self, data):
        tipe = data.get("tipe")
        kategori = KategoriTransaksi.objects.filter(id=data.get("kategori_id")).first()
        if kategori and kategori.tipe != tipe:
            raise serializers.ValidationError(
                {"tipe": f"Tipe transaksi tidak sesuai dengan kategori ({kategori.tipe})."}
            )
        return data

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        validated_data["status"] = Transaksi.Status.CONFIRMED
        return super().create(validated_data)


class IuranWargaListSerializer(serializers.ModelSerializer):
    warga = serializers.SerializerMethodField()
    buktiUrl = serializers.SerializerMethodField()
    confirmed_by = serializers.SerializerMethodField()

    class Meta:
        model = IuranWarga
        fields = [
            "id", "warga", "bulan", "tahun", "jumlah",
            "status", "buktiUrl", "keterangan",
            "confirmed_by", "confirmed_at", "created_at",
        ]

    def get_warga(self, obj):
        return {
            "id": str(obj.warga.id),
            "namaLengkap": obj.warga.nama_lengkap,
            "blok": obj.warga.blok,
            "noRumah": obj.warga.no_rumah,
        }

    def get_buktiUrl(self, obj):
        if not obj.bukti_transfer:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.bukti_transfer.url)
        return obj.bukti_transfer.url

    def get_confirmed_by(self, obj):
        if not obj.confirmed_by:
            return None
        u = obj.confirmed_by
        profile = getattr(u, "profile", None)
        nama = profile.nama_lengkap if profile else u.email
        return {"id": str(u.id), "namaLengkap": nama}


class IuranWargaUploadSerializer(serializers.ModelSerializer):
    """Serializer untuk warga mengupload bukti iuran."""
    wargaId = serializers.UUIDField(write_only=True, source="warga_id")

    class Meta:
        model = IuranWarga
        fields = ["wargaId", "bulan", "tahun", "jumlah", "bukti_transfer"]

    def validate_bukti_transfer(self, value):
        return validate_bukti_file(value)

    def validate(self, data):
        warga_id = data.get("warga_id")
        bulan = data.get("bulan")
        tahun = data.get("tahun")

        if IuranWarga.objects.filter(warga_id=warga_id, bulan=bulan, tahun=tahun).exists():
            raise serializers.ValidationError(
                {"non_field_errors": "Iuran untuk periode ini sudah ada."},
                code="KEUANGAN_DUPLICATE_IURAN",
            )
        return data

    def create(self, validated_data):
        validated_data["status"] = IuranWarga.Status.PENDING
        return super().create(validated_data)


class IuranKonfirmasiSerializer(serializers.Serializer):
    """Serializer untuk konfirmasi atau tolak iuran."""
    status = serializers.ChoiceField(choices=["lunas", "ditolak"])
    keterangan = serializers.CharField(required=False, allow_blank=True, default="")

    def update(self, instance, validated_data):
        status = validated_data["status"]
        instance.status = status
        instance.keterangan = validated_data.get("keterangan", "")
        if status == IuranWarga.Status.LUNAS:
            instance.confirmed_by = self.context["request"].user
            instance.confirmed_at = timezone.now()
        instance.save()
        return instance


class DashboardKeuanganSerializer(serializers.Serializer):
    """Read-only serializer untuk dashboard keuangan."""
    saldo = serializers.DecimalField(max_digits=15, decimal_places=2)
    totalPemasukan = serializers.DecimalField(max_digits=15, decimal_places=2)
    totalPengeluaran = serializers.DecimalField(max_digits=15, decimal_places=2)
    bulanan = serializers.ListField()


class WargaIuranSerializer(serializers.ModelSerializer):
    """Serializer untuk riwayat iuran milik warga (endpoint /iuran/saya)."""
    buktiUrl = serializers.SerializerMethodField()

    class Meta:
        model = IuranWarga
        fields = ["id", "bulan", "tahun", "jumlah", "status", "buktiUrl", "keterangan", "created_at"]

    def get_buktiUrl(self, obj):
        if not obj.bukti_transfer:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.bukti_transfer.url)
        return obj.bukti_transfer.url
