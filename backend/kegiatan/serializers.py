from rest_framework import serializers

from accounts.models import User
from .models import Kegiatan, RSVP


class PenanggungJawabSerializer(serializers.Serializer):
    """Serializer nested untuk penanggung jawab kegiatan."""

    namaLengkap = serializers.SerializerMethodField()

    def get_namaLengkap(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.nama_lengkap if profile else obj.email


class RSVPDetailSerializer(serializers.ModelSerializer):
    """Serializer list RSVP dalam detail kegiatan."""

    user = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = RSVP
        fields = ["id", "user", "status", "createdAt"]

    def get_user(self, obj):
        profile = getattr(obj.user, "profile", None)
        return {"namaLengkap": profile.nama_lengkap if profile else obj.user.email}


class KegiatanListSerializer(serializers.ModelSerializer):
    """Serializer ringkas untuk daftar kegiatan."""

    penanggungJawab = serializers.SerializerMethodField()
    rsvpCount = serializers.SerializerMethodField()
    tanggal = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Kegiatan
        fields = [
            "id", "nama", "deskripsi", "tanggal", "lokasi",
            "penanggungJawab", "rsvpCount",
        ]

    def get_penanggungJawab(self, obj):
        if not obj.penanggung_jawab:
            return None
        return {"namaLengkap": self._get_nama(obj.penanggung_jawab)}

    def get_rsvpCount(self, obj):
        return obj.rsvp.filter(status=RSVP.Status.HADIR).count()

    def _get_nama(self, user):
        profile = getattr(user, "profile", None)
        return profile.nama_lengkap if profile else user.email


class KegiatanDetailSerializer(serializers.ModelSerializer):
    """Serializer detail kegiatan + daftar RSVP."""

    penanggungJawab = serializers.SerializerMethodField()
    rsvpList = serializers.SerializerMethodField()
    rsvpCount = serializers.SerializerMethodField()
    tanggal = serializers.DateTimeField(read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    # RSVP status user yang sedang login (null jika belum RSVP)
    myRsvp = serializers.SerializerMethodField()

    class Meta:
        model = Kegiatan
        fields = [
            "id", "nama", "deskripsi", "tanggal", "lokasi",
            "kuotaPeserta", "penanggungJawab",
            "rsvpCount", "rsvpList", "myRsvp", "createdAt", "updatedAt",
        ]

    kuotaPeserta = serializers.IntegerField(source="kuota_peserta", read_only=True)

    def get_penanggungJawab(self, obj):
        if not obj.penanggung_jawab:
            return None
        return {"namaLengkap": self._get_nama(obj.penanggung_jawab)}

    def get_rsvpList(self, obj):
        rsvps = obj.rsvp.select_related("user", "user__profile").all()
        return RSVPDetailSerializer(rsvps, many=True).data

    def get_rsvpCount(self, obj):
        return obj.rsvp.filter(status=RSVP.Status.HADIR).count()

    def get_myRsvp(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        rsvp = obj.rsvp.filter(user=request.user).first()
        return rsvp.status if rsvp else None

    def _get_nama(self, user):
        profile = getattr(user, "profile", None)
        return profile.nama_lengkap if profile else user.email


class KegiatanCreateSerializer(serializers.ModelSerializer):
    """Serializer untuk membuat atau mengupdate kegiatan."""

    penanggungJawabId = serializers.UUIDField(
        write_only=True, required=False, allow_null=True, source="penanggung_jawab_id"
    )
    tanggal = serializers.DateTimeField()

    class Meta:
        model = Kegiatan
        fields = ["nama", "deskripsi", "tanggal", "lokasi", "kuota_peserta", "penanggungJawabId"]

    def validate_penanggungJawabId(self, value):
        if value and not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User penanggung jawab tidak ditemukan.")
        return value

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class RSVPCreateSerializer(serializers.Serializer):
    """Serializer untuk RSVP kegiatan."""

    status = serializers.ChoiceField(choices=RSVP.Status.choices, default=RSVP.Status.HADIR)
