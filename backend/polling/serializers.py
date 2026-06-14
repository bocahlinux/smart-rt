from rest_framework import serializers

from .models import Poll, Vote

PENGURUS_ROLES = {"admin", "sekretaris", "pengurus"}


class PollListSerializer(serializers.ModelSerializer):
    """Serializer ringkas untuk daftar polling."""

    createdBy = serializers.SerializerMethodField()
    deadline = serializers.DateTimeField(read_only=True)
    hasVoted = serializers.SerializerMethodField()
    isExpired = serializers.SerializerMethodField()
    totalVotes = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = ["id", "pertanyaan", "deadline", "createdBy", "hasVoted", "isExpired", "totalVotes"]

    def get_createdBy(self, obj):
        profile = getattr(obj.created_by, "profile", None)
        return {"namaLengkap": profile.nama_lengkap if profile else obj.created_by.email}

    def get_hasVoted(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.votes.filter(user=request.user).exists()

    def get_isExpired(self, obj):
        return obj.is_expired

    def get_totalVotes(self, obj):
        return obj.total_votes()


class PollDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detail polling + hasil vote.
    Hasil (results) hanya tampil setelah deadline ATAU jika user adalah pengurus/admin.
    Sesuai docs/11-SECURITY.md §2.3 (View results).
    """

    createdBy = serializers.SerializerMethodField()
    deadline = serializers.DateTimeField(read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    hasVoted = serializers.SerializerMethodField()
    myVote = serializers.SerializerMethodField()
    isExpired = serializers.SerializerMethodField()
    results = serializers.SerializerMethodField()
    totalVotes = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = [
            "id", "pertanyaan", "opsi", "deadline",
            "createdBy", "createdAt",
            "hasVoted", "myVote", "isExpired",
            "results", "totalVotes",
        ]

    def get_createdBy(self, obj):
        profile = getattr(obj.created_by, "profile", None)
        return {"namaLengkap": profile.nama_lengkap if profile else obj.created_by.email}

    def get_hasVoted(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.votes.filter(user=request.user).exists()

    def get_myVote(self, obj):
        """Index opsi yang dipilih user, atau null jika belum vote."""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        vote = obj.votes.filter(user=request.user).first()
        return vote.opsi_index if vote else None

    def get_isExpired(self, obj):
        return obj.is_expired

    def get_results(self, obj):
        """
        Hasil poll HANYA visible jika:
        - Deadline sudah lewat (is_expired), ATAU
        - User adalah pengurus/sekretaris/admin
        Sesuai security matrix docs/11-SECURITY.md §2.3.
        """
        request = self.context.get("request")
        user = request.user if request else None
        is_moderator = user and user.is_authenticated and user.role in PENGURUS_ROLES

        if not obj.is_expired and not is_moderator:
            return None  # Belum expired dan bukan moderator → sembunyikan hasil

        return obj.get_results()

    def get_totalVotes(self, obj):
        request = self.context.get("request")
        user = request.user if request else None
        is_moderator = user and user.is_authenticated and user.role in PENGURUS_ROLES

        if not obj.is_expired and not is_moderator:
            return None

        return obj.total_votes()


class PollCreateSerializer(serializers.ModelSerializer):
    """Serializer untuk membuat poll baru."""

    opsi = serializers.ListField(
        child=serializers.CharField(max_length=255),
        min_length=2,
        max_length=10,
    )
    deadline = serializers.DateTimeField()

    class Meta:
        model = Poll
        fields = ["pertanyaan", "opsi", "deadline"]

    def validate_opsi(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Opsi polling tidak boleh duplikat.")
        return value

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class VoteSerializer(serializers.Serializer):
    """Serializer untuk vote poll."""

    opsiIndex = serializers.IntegerField(min_value=0, source="opsi_index")
