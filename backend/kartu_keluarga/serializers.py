from rest_framework import serializers

from accounts.models import WargaProfile
from .models import (
    KartuKeluarga,
    PengajuanAnggotaBaru,
    PengajuanPenghapusanAnggota,
    PengajuanPerubahanWarga,
)


# ── Anggota ringkas (di dalam detail KK) ──────────────────────────────────────

class AnggotaKKSerializer(serializers.ModelSerializer):
    namaLengkap = serializers.CharField(source="nama_lengkap")  # noqa: N815
    hubunganKeluarga = serializers.CharField(source="hubungan_keluarga")  # noqa: N815
    hubunganKeluargaLabel = serializers.SerializerMethodField()  # noqa: N815
    statusPerkawinan = serializers.CharField(source="status_perkawinan")  # noqa: N815
    noRumah = serializers.CharField(source="no_rumah")  # noqa: N815
    tanggalLahir = serializers.DateField(source="tanggal_lahir")  # noqa: N815
    tempatLahir = serializers.CharField(source="tempat_lahir")  # noqa: N815
    jenisKelamin = serializers.CharField(source="jenis_kelamin")  # noqa: N815

    class Meta:
        model = WargaProfile
        fields = [
            "id", "namaLengkap", "nik", "hubunganKeluarga", "hubunganKeluargaLabel",
            "statusPerkawinan", "jenisKelamin", "tanggalLahir", "tempatLahir",
            "agama", "pendidikan", "pekerjaan", "status", "alamat", "blok", "noRumah",
        ]

    def get_hubunganKeluargaLabel(self, obj):  # noqa: N802
        return obj.get_hubungan_keluarga_display() if obj.hubungan_keluarga else None


# ── KartuKeluarga ─────────────────────────────────────────────────────────────

class KartuKeluargaSerializer(serializers.ModelSerializer):
    noKk = serializers.CharField(source="no_kk")  # noqa: N815
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)  # noqa: N815
    anggota = serializers.SerializerMethodField()
    kepalaKeluarga = serializers.SerializerMethodField()  # noqa: N815
    jumlahAnggota = serializers.SerializerMethodField()  # noqa: N815

    class Meta:
        model = KartuKeluarga
        fields = ["id", "noKk", "alamat", "kepalaKeluarga", "jumlahAnggota", "anggota", "createdAt"]
        read_only_fields = ["id", "createdAt"]

    def get_anggota(self, obj):
        qs = obj.anggota.filter(is_deleted=False).select_related("user").order_by(
            "hubungan_keluarga", "nama_lengkap"
        )
        return AnggotaKKSerializer(qs, many=True).data

    def get_kepalaKeluarga(self, obj):  # noqa: N802
        kk = obj.kepala_keluarga
        return {"id": str(kk.id), "namaLengkap": kk.nama_lengkap} if kk else None

    def get_jumlahAnggota(self, obj):  # noqa: N802
        return obj.anggota.filter(is_deleted=False).count()


class KartuKeluargaWriteSerializer(serializers.ModelSerializer):
    noKk = serializers.CharField(source="no_kk", max_length=16)  # noqa: N815

    class Meta:
        model = KartuKeluarga
        fields = ["noKk", "alamat"]

    def validate_noKk(self, value):  # noqa: N802
        qs = KartuKeluarga.objects.filter(no_kk=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Nomor KK ini sudah terdaftar.")
        return value

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


# ── Pengajuan Tambah Anggota ──────────────────────────────────────────────────

class PengajuanAnggotaBaruSerializer(serializers.ModelSerializer):
    kartuKeluargaId = serializers.UUIDField(source="kartu_keluarga_id", write_only=True)  # noqa: N815
    noKk = serializers.CharField(source="kartu_keluarga.no_kk", read_only=True)  # noqa: N815
    dataAnggota = serializers.JSONField(source="data_anggota")  # noqa: N815
    pengajuEmail = serializers.EmailField(source="pengaju.email", read_only=True)  # noqa: N815
    reviewedBy = serializers.SerializerMethodField()  # noqa: N815
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)  # noqa: N815
    reviewedAt = serializers.DateTimeField(source="reviewed_at", read_only=True)  # noqa: N815

    class Meta:
        model = PengajuanAnggotaBaru
        fields = [
            "id", "kartuKeluargaId", "noKk", "pengajuEmail",
            "dataAnggota", "alasan", "status", "catatan_admin",
            "reviewedBy", "createdAt", "reviewedAt",
        ]
        read_only_fields = ["id", "status", "catatan_admin", "reviewedBy", "createdAt", "reviewedAt"]

    def get_reviewedBy(self, obj):  # noqa: N802
        return obj.reviewed_by.email if obj.reviewed_by else None

    def create(self, validated_data):
        validated_data["pengaju"] = self.context["request"].user
        return super().create(validated_data)


# ── Pengajuan Penghapusan ─────────────────────────────────────────────────────

class PengajuanPenghapusanSerializer(serializers.ModelSerializer):
    kartuKeluargaId = serializers.UUIDField(source="kartu_keluarga_id", write_only=True)  # noqa: N815
    wargaTargetId = serializers.UUIDField(source="warga_target_id", write_only=True)  # noqa: N815
    noKk = serializers.CharField(source="kartu_keluarga.no_kk", read_only=True)  # noqa: N815
    wargaTargetNama = serializers.CharField(source="warga_target.nama_lengkap", read_only=True)  # noqa: N815
    pengajuEmail = serializers.EmailField(source="pengaju.email", read_only=True)  # noqa: N815
    reviewedBy = serializers.SerializerMethodField()  # noqa: N815
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)  # noqa: N815
    reviewedAt = serializers.DateTimeField(source="reviewed_at", read_only=True)  # noqa: N815

    class Meta:
        model = PengajuanPenghapusanAnggota
        fields = [
            "id", "kartuKeluargaId", "wargaTargetId",
            "noKk", "wargaTargetNama", "pengajuEmail",
            "alasan", "status", "catatan_admin",
            "reviewedBy", "createdAt", "reviewedAt",
        ]
        read_only_fields = ["id", "status", "catatan_admin", "reviewedBy", "createdAt", "reviewedAt"]

    def get_reviewedBy(self, obj):  # noqa: N802
        return obj.reviewed_by.email if obj.reviewed_by else None

    def create(self, validated_data):
        validated_data["pengaju"] = self.context["request"].user
        return super().create(validated_data)


# ── Pengajuan Perubahan Data ──────────────────────────────────────────────────

class PengajuanPerubahanSerializer(serializers.ModelSerializer):
    wargaTargetId = serializers.UUIDField(source="warga_target_id", write_only=True)  # noqa: N815
    wargaTargetNama = serializers.CharField(source="warga_target.nama_lengkap", read_only=True)  # noqa: N815
    pengajuEmail = serializers.EmailField(source="pengaju.email", read_only=True)  # noqa: N815
    fieldChanges = serializers.JSONField(source="field_changes")  # noqa: N815
    reviewedBy = serializers.SerializerMethodField()  # noqa: N815
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)  # noqa: N815
    reviewedAt = serializers.DateTimeField(source="reviewed_at", read_only=True)  # noqa: N815

    class Meta:
        model = PengajuanPerubahanWarga
        fields = [
            "id", "wargaTargetId", "wargaTargetNama", "pengajuEmail",
            "fieldChanges", "alasan", "status", "catatan_admin",
            "reviewedBy", "createdAt", "reviewedAt",
        ]
        read_only_fields = ["id", "status", "catatan_admin", "reviewedBy", "createdAt", "reviewedAt"]

    def get_reviewedBy(self, obj):  # noqa: N802
        return obj.reviewed_by.email if obj.reviewed_by else None

    def create(self, validated_data):
        validated_data["pengaju"] = self.context["request"].user
        return super().create(validated_data)
