from rest_framework import serializers

from .models import JenisSurat, PermohonanSurat


class JenisSuratSerializer(serializers.ModelSerializer):
    fieldTambahan = serializers.JSONField(source="field_tambahan", read_only=True)  # noqa: N815
    isActive = serializers.BooleanField(source="is_active", read_only=True)  # noqa: N815

    class Meta:
        model = JenisSurat
        fields = ["id", "kode", "nama", "deskripsi", "fieldTambahan", "isActive", "urutan"]


class PermohonanSuratSerializer(serializers.ModelSerializer):
    jenisNama = serializers.CharField(source="jenis.nama", read_only=True)  # noqa: N815
    jenisKode = serializers.CharField(source="jenis.kode", read_only=True)  # noqa: N815
    pemohonEmail = serializers.EmailField(source="pemohon.email", read_only=True)  # noqa: N815
    pemohonNama = serializers.SerializerMethodField()  # noqa: N815
    jenisId = serializers.UUIDField(source="jenis_id", write_only=True)  # noqa: N815
    dataForm = serializers.JSONField(source="data_form")  # noqa: N815
    catatanAdmin = serializers.CharField(source="catatan_admin", required=False, allow_blank=True)  # noqa: N815
    noSurat = serializers.CharField(source="no_surat", read_only=True)  # noqa: N815
    reviewedBy = serializers.SerializerMethodField()  # noqa: N815
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)  # noqa: N815
    reviewedAt = serializers.DateTimeField(source="reviewed_at", read_only=True)  # noqa: N815

    class Meta:
        model = PermohonanSurat
        fields = [
            "id", "jenisId", "jenisNama", "jenisKode",
            "pemohonEmail", "pemohonNama", "dataForm", "keperluan", "status",
            "catatanAdmin", "noSurat", "reviewedBy", "createdAt", "reviewedAt",
        ]
        read_only_fields = [
            "id", "status", "noSurat", "reviewedBy", "createdAt", "reviewedAt",
        ]

    def get_pemohonNama(self, obj):  # noqa: N802
        try:
            return obj.pemohon.profile.nama_lengkap
        except Exception:
            return obj.pemohon.email.split("@")[0]

    def get_reviewedBy(self, obj):  # noqa: N802
        return obj.reviewed_by.email if obj.reviewed_by else None

    def create(self, validated_data):
        validated_data["pemohon"] = self.context["request"].user
        return super().create(validated_data)
