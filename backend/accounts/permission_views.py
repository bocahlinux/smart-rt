"""Views untuk konfigurasi izin role dinamis — admin only."""

from rest_framework import permissions, serializers, status
from rest_framework.views import APIView

from accounts.models import PermissionConfig
from accounts.permissions import IsAdmin, clear_perm_cache, DEFAULT_PERMISSIONS
from accounts.utils import error_response, success_response


class PermissionConfigSerializer(serializers.ModelSerializer):
    allowedRoles = serializers.JSONField(source="allowed_roles")  # noqa: N815

    class Meta:
        model = PermissionConfig
        fields = ["key", "label", "description", "category", "allowedRoles"]
        read_only_fields = ["key", "label", "description", "category"]


VALID_CONFIGURABLE_ROLES = {"ketua_rt", "sekretaris", "bendahara", "pengurus", "warga"}


class PermissionConfigListView(APIView):
    """GET /permissions/ — daftar semua permission config.
    Admin only.
    """

    permission_classes = [IsAdmin]

    def get(self, request):
        configs = PermissionConfig.objects.all()
        # Sertakan juga metadata dari DEFAULT_PERMISSIONS agar urutan dan kategori konsisten
        config_map = {c.key: c for c in configs}
        result = []
        for default in DEFAULT_PERMISSIONS:
            key = default["key"]
            if key in config_map:
                obj = config_map[key]
            else:
                # Fallback jika seed belum jalan
                obj = PermissionConfig(
                    key=key,
                    label=default["label"],
                    description=default["description"],
                    category=default["category"],
                    allowed_roles=default["allowed_roles"],
                )
            result.append({
                "key": obj.key,
                "label": obj.label,
                "description": obj.description,
                "category": obj.category,
                "allowedRoles": list(obj.allowed_roles),
            })
        return success_response(data=result)


class PermissionConfigDetailView(APIView):
    """PATCH /permissions/{key}/ — update allowed_roles untuk satu permission.
    Admin only.
    """

    permission_classes = [IsAdmin]

    def patch(self, request, key):
        try:
            config = PermissionConfig.objects.get(key=key)
        except PermissionConfig.DoesNotExist:
            return error_response(
                "NOT_FOUND",
                f"Permission '{key}' tidak ditemukan",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        roles = request.data.get("allowedRoles")
        if roles is None:
            return error_response(
                "VALIDATION_ERROR",
                "Field 'allowedRoles' diperlukan",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(roles, list):
            return error_response(
                "VALIDATION_ERROR",
                "'allowedRoles' harus berupa array",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        invalid = [r for r in roles if r not in VALID_CONFIGURABLE_ROLES]
        if invalid:
            return error_response(
                "VALIDATION_ERROR",
                f"Role tidak valid: {invalid}. Role yang bisa dikonfigurasi: ketua_rt, sekretaris, bendahara, pengurus, warga",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        config.allowed_roles = list(set(roles))  # deduplicate
        config.save(update_fields=["allowed_roles"])
        clear_perm_cache()

        return success_response(
            data={
                "key": config.key,
                "label": config.label,
                "allowedRoles": config.allowed_roles,
            },
            message="Konfigurasi izin berhasil diperbarui",
        )
