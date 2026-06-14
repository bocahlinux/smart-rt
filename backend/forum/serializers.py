from rest_framework import serializers

from .models import Comment, Thread, ThreadVote


class CreatedBySerializer(serializers.Serializer):
    """Minimal user info untuk nested representation."""

    id = serializers.UUIDField()
    namaLengkap = serializers.SerializerMethodField()

    def get_namaLengkap(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.nama_lengkap
        return obj.get_full_name() or obj.email


class ReplySerializer(serializers.ModelSerializer):
    """Serializer untuk reply (komentar bersarang, satu level)."""

    createdBy = CreatedBySerializer(source="created_by", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "isi", "createdBy", "createdAt", "updatedAt"]


class CommentSerializer(serializers.ModelSerializer):
    """Serializer komentar dengan replies."""

    createdBy = CreatedBySerializer(source="created_by", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    replies = ReplySerializer(many=True, read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "isi", "createdBy", "createdAt", "updatedAt", "replies"]


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer untuk membuat/edit komentar."""

    parentId = serializers.UUIDField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Comment
        fields = ["isi", "parentId"]

    def validate_parentId(self, value):
        if value is not None:
            try:
                Comment.objects.get(pk=value)
            except Comment.DoesNotExist:
                raise serializers.ValidationError("Parent comment tidak ditemukan.")
        return value

    def create(self, validated_data):
        parent_id = validated_data.pop("parentId", None)
        parent = Comment.objects.get(pk=parent_id) if parent_id else None
        return Comment.objects.create(parent=parent, **validated_data)


class ThreadListSerializer(serializers.ModelSerializer):
    """Serializer untuk list thread (ringkas)."""

    createdBy = CreatedBySerializer(source="created_by", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    commentCount = serializers.SerializerMethodField()
    voteCount = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = [
            "id",
            "judul",
            "kategori",
            "status",
            "createdBy",
            "createdAt",
            "updatedAt",
            "commentCount",
            "voteCount",
        ]

    def get_commentCount(self, obj):
        return obj.comments.count()

    def get_voteCount(self, obj):
        return obj.votes.count()


class ThreadDetailSerializer(serializers.ModelSerializer):
    """Serializer untuk detail thread dengan komentar."""

    createdBy = CreatedBySerializer(source="created_by", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    comments = serializers.SerializerMethodField()
    voteCount = serializers.SerializerMethodField()
    hasVoted = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = [
            "id",
            "judul",
            "isi",
            "kategori",
            "status",
            "createdBy",
            "createdAt",
            "updatedAt",
            "comments",
            "voteCount",
            "hasVoted",
        ]

    def get_comments(self, obj):
        # Hanya ambil komentar level atas (parent=null)
        top_comments = obj.comments.filter(parent__isnull=True).select_related(
            "created_by__profile"
        ).prefetch_related("replies__created_by__profile")
        return CommentSerializer(top_comments, many=True).data

    def get_voteCount(self, obj):
        return obj.votes.count()

    def get_hasVoted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return ThreadVote.objects.filter(thread=obj, user=request.user).exists()
        return False


class ThreadCreateSerializer(serializers.ModelSerializer):
    """Serializer untuk membuat/edit thread."""

    class Meta:
        model = Thread
        fields = ["judul", "isi", "kategori"]
