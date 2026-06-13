from rest_framework import permissions


class IsBendaharaOrAdmin(permissions.BasePermission):
    """Global permission: hanya bendahara atau admin."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["admin", "bendahara"]


class IsOwnerIuranOrBendahara(permissions.BasePermission):
    """Object-level: warga hanya akses iuran miliknya; bendahara/admin akses semua."""

    def has_object_permission(self, request, view, obj):
        if request.user.role in ["admin", "bendahara"]:
            return True
        # Warga: cek apakah iuran ini miliknya
        profile = getattr(request.user, "profile", None)
        return profile is not None and obj.warga_id == profile.id
