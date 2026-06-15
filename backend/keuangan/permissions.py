from rest_framework import permissions

from accounts.permissions import has_perm


class IsBendaharaOrAdmin(permissions.BasePermission):
    """Global permission: bendahara atau admin — atau siapa pun yang punya izin kelola_keuangan."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and has_perm(request.user, "kelola_keuangan")


class IsKonfirmasiIuran(permissions.BasePermission):
    """Global permission: siapa pun yang punya izin konfirmasi_iuran."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and has_perm(request.user, "konfirmasi_iuran")


class IsOwnerIuranOrBendahara(permissions.BasePermission):
    """Object-level: warga hanya akses iuran miliknya; bendahara/admin akses semua."""

    def has_object_permission(self, request, view, obj):
        if has_perm(request.user, "konfirmasi_iuran"):
            return True
        profile = getattr(request.user, "profile", None)
        return profile is not None and obj.warga_id == profile.id
