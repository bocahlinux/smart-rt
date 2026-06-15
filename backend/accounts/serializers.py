from django.contrib.auth import password_validation
from rest_framework import serializers

from .models import User

# Catatan penamaan: docs/06-API-CONTRACT.md mewajibkan body/response JSON
# memakai camelCase (mis. `passwordConfirmation`, `currentPassword`). Karena
# proyek ini belum memasang renderer/parser camelCase, field & validator
# dideklarasikan dengan nama camelCase persis sesuai contract (di-noqa dari
# aturan penamaan Ruff N802/N815 yang menyasar gaya Python pada umumnya).


class RegisterSerializer(serializers.ModelSerializer):
    """POST /auth/register — lihat docs/06-API-CONTRACT.md §2.1."""

    passwordConfirmation = serializers.CharField(write_only=True)  # noqa: N815

    class Meta:
        model = User
        fields = ["id", "email", "phone", "password", "passwordConfirmation", "role", "status"]
        read_only_fields = ["id", "role", "status"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Email sudah terdaftar", code="email_already_registered"
            )
        return value

    def validate_phone(self, value):
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError(
                "Nomor HP sudah terdaftar", code="phone_already_registered"
            )
        return value

    def validate(self, attrs):
        password = attrs.get("password")
        confirmation = attrs.pop("passwordConfirmation", None)
        if password != confirmation:
            raise serializers.ValidationError(
                {"passwordConfirmation": "Konfirmasi password tidak cocok"}
            )
        password_validation.validate_password(password)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(
            username=validated_data["email"],
            email=validated_data["email"],
            phone=validated_data["phone"],
            role=User.Role.WARGA,
            status=User.Status.PENDING,
        )
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """GET /auth/me — lihat docs/06-API-CONTRACT.md §2.5.

    Field `profile` adalah placeholder forward-compatible: bernilai `null`
    sampai `WargaProfile` (relasi `User.profile`) diimplementasikan di
    Phase 3 — lihat docs/05-DATABASE.md §5.
    """

    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "phone", "role", "status", "profile"]
        read_only_fields = fields

    def get_profile(self, obj):
        profile = getattr(obj, "profile", None)
        if profile is None:
            return None
        foto = getattr(profile, "foto", None)
        return {
            "namaLengkap": getattr(profile, "nama_lengkap", None),
            "foto": getattr(foto, "url", None) if foto else None,
        }


class UserManagementSerializer(serializers.ModelSerializer):
    """GET/PATCH /users/ dan /users/{id}/ — admin only."""

    createdAt = serializers.DateTimeField(source="created_at", read_only=True)  # noqa: N815
    warga = serializers.SerializerMethodField(read_only=True)
    newPassword = serializers.CharField(  # noqa: N815
        source="new_password", write_only=True, required=False, allow_blank=True, min_length=8,
        error_messages={"min_length": "Password minimal 8 karakter."},
    )

    class Meta:
        model = User
        fields = ["id", "email", "phone", "role", "status", "warga", "newPassword", "createdAt"]
        read_only_fields = ["id", "warga", "createdAt"]

    def validate_email(self, value):
        qs = User.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Email ini sudah digunakan akun lain.")
        return value

    def validate_phone(self, value):
        qs = User.objects.filter(phone=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Nomor HP ini sudah digunakan akun lain.")
        return value

    def get_warga(self, obj):  # noqa: N802
        try:
            p = obj.profile
            if p.is_deleted:
                return None
            return {
                "id": str(p.id),
                "namaLengkap": p.nama_lengkap,
                "nik": p.nik,
                "blok": p.blok,
                "noRumah": p.no_rumah,
                "status": p.status,
            }
        except Exception:  # noqa: BLE001
            return None

    def update(self, instance, validated_data):
        new_password = validated_data.pop("new_password", None) or None
        if "email" in validated_data:
            validated_data["username"] = validated_data["email"]
        instance = super().update(instance, validated_data)
        if new_password:
            instance.set_password(new_password)
            instance.save(update_fields=["password"])
        return instance


class AdminCreateUserSerializer(serializers.Serializer):
    """POST /users/ — buat akun baru oleh admin."""

    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.WARGA)
    status = serializers.ChoiceField(choices=User.Status.choices, default=User.Status.ACTIVE)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email sudah terdaftar")
        return value

    def validate_phone(self, value):
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Nomor HP sudah terdaftar")
        return value

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        user = User(
            username=validated_data["email"],
            email=validated_data["email"],
            phone=validated_data["phone"],
            role=validated_data["role"],
            status=validated_data["status"],
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """PUT /auth/password — lihat docs/06-API-CONTRACT.md §2.6."""

    currentPassword = serializers.CharField(write_only=True)  # noqa: N815
    newPassword = serializers.CharField(write_only=True)  # noqa: N815
    newPasswordConfirmation = serializers.CharField(write_only=True)  # noqa: N815

    def validate_currentPassword(self, value):  # noqa: N802
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                "Password lama salah", code="invalid_current_password"
            )
        return value

    def validate(self, attrs):
        if attrs["newPassword"] != attrs["newPasswordConfirmation"]:
            raise serializers.ValidationError(
                {"newPasswordConfirmation": "Konfirmasi password baru tidak cocok"}
            )
        password_validation.validate_password(
            attrs["newPassword"], user=self.context["request"].user
        )
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["newPassword"])
        user.save(update_fields=["password"])
        return user
