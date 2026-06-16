import os

from django.utils.text import slugify
from django.utils import timezone
from rest_framework import serializers

from accounts.models import WargaProfile
from .models import IuranWarga, JenisIuran, KategoriTransaksi, PengaturanIuran, Transaksi

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


class JenisIuranSerializer(serializers.ModelSerializer):
    isActive = serializers.BooleanField(source="is_active")
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = JenisIuran
        fields = ["id", "nama", "slug", "tipe", "unit", "nominal", "keterangan", "isActive", "urutan", "updatedAt"]
        read_only_fields = ["id", "slug", "updatedAt"]

    def validate_nominal(self, value):
        if value < 0:
            raise serializers.ValidationError("Nominal tidak boleh negatif.")
        return value

    def create(self, validated_data):
        validated_data["is_active"] = validated_data.pop("is_active", True) if "is_active" in validated_data else True
        nama = validated_data.get("nama", "")
        validated_data["slug"] = slugify(nama)
        if JenisIuran.objects.filter(slug=validated_data["slug"]).exists():
            validated_data["slug"] = f"{validated_data['slug']}-{JenisIuran.objects.count() + 1}"
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "is_active" in validated_data:
            validated_data["is_active"] = validated_data.pop("is_active")
        return super().update(instance, validated_data)


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
    jenis = JenisIuranSerializer(read_only=True)
    buktiUrl = serializers.SerializerMethodField()
    confirmed_by = serializers.SerializerMethodField()

    class Meta:
        model = IuranWarga
        fields = [
            "id", "warga", "jenis", "bulan", "tahun", "jumlah",
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
    wargaId = serializers.UUIDField(write_only=True, source="warga_id", required=False)
    jenisId = serializers.UUIDField(write_only=True, source="jenis_id", required=True)

    class Meta:
        model = IuranWarga
        fields = ["wargaId", "jenisId", "bulan", "tahun", "jumlah", "bukti_transfer"]

    def validate_bukti_transfer(self, value):
        return validate_bukti_file(value)

    def validate_jenisId(self, value):
        if not JenisIuran.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Jenis iuran tidak ditemukan atau tidak aktif.")
        return value

    def validate(self, data):
        warga_id = data.get("warga_id")
        jenis_id = data.get("jenis_id")
        bulan = data.get("bulan")
        tahun = data.get("tahun")

        # Cek duplikat untuk warga yang sama (semua unit) — termasuk DITOLAK agar tidak ganda
        if IuranWarga.objects.filter(warga_id=warga_id, jenis_id=jenis_id, bulan=bulan, tahun=tahun).exists():
            raise serializers.ValidationError(
                {"non_field_errors": "Iuran jenis ini untuk periode ini sudah ada."},
                code="KEUANGAN_DUPLICATE_IURAN",
            )

        # Anti-duplikat per KK: jika unit iuran adalah per_kk,
        # cek apakah anggota KK lain sudah membayar (PENDING/LUNAS) periode ini
        try:
            jenis = JenisIuran.objects.get(id=jenis_id)
        except JenisIuran.DoesNotExist:
            return data

        if jenis.unit == JenisIuran.Unit.PER_KK:
            from accounts.models import WargaProfile  # noqa: PLC0415
            try:
                warga = WargaProfile.objects.select_related("kartu_keluarga").get(id=warga_id)
            except WargaProfile.DoesNotExist:
                return data

            kk = warga.kartu_keluarga
            if kk:
                kk_warga_ids = WargaProfile.objects.filter(
                    kartu_keluarga=kk,
                ).exclude(id=warga_id).values_list("id", flat=True)

                if IuranWarga.objects.filter(
                    warga_id__in=kk_warga_ids,
                    jenis_id=jenis_id,
                    bulan=bulan,
                    tahun=tahun,
                    status__in=[IuranWarga.Status.PENDING, IuranWarga.Status.LUNAS],
                ).exists():
                    raise serializers.ValidationError(
                        {"non_field_errors": f"Iuran {jenis.nama} periode ini sudah dibayar oleh anggota KK Anda. Iuran dihitung per Kartu Keluarga (1 KK, 1 pembayaran)."},
                        code="KEUANGAN_DUPLICATE_IURAN_KK",
                    )

        return data

    def create(self, validated_data):
        # Jika jumlah tidak diisi, ambil dari JenisIuran
        if "jumlah" not in validated_data or not validated_data.get("jumlah"):
            jenis = JenisIuran.objects.get(id=validated_data["jenis_id"])
            validated_data["jumlah"] = jenis.nominal
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


class PengaturanIuranSerializer(serializers.ModelSerializer):
    nominalDefault = serializers.DecimalField(source="nominal_default", max_digits=15, decimal_places=2)
    saldoAwal = serializers.DecimalField(source="saldo_awal", max_digits=15, decimal_places=2, required=False)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = PengaturanIuran
        fields = ["nominalDefault", "saldoAwal", "keterangan", "updatedAt"]

    def validate_nominalDefault(self, value):
        if value <= 0:
            raise serializers.ValidationError("Nominal iuran harus lebih dari 0.")
        return value

    def validate_saldoAwal(self, value):
        if value < 0:
            raise serializers.ValidationError("Saldo awal tidak boleh negatif.")
        return value


class WargaIuranSerializer(serializers.ModelSerializer):
    """Serializer untuk riwayat iuran milik warga (endpoint /iuran/saya)."""
    buktiUrl = serializers.SerializerMethodField()
    jenis = JenisIuranSerializer(read_only=True)

    class Meta:
        model = IuranWarga
        fields = ["id", "jenis", "bulan", "tahun", "jumlah", "status", "buktiUrl", "keterangan", "created_at"]

    def get_buktiUrl(self, obj):
        if not obj.bukti_transfer:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.bukti_transfer.url)
        return obj.bukti_transfer.url
