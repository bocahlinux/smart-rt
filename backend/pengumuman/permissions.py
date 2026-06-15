from rest_framework import permissions

from accounts.permissions import has_perm


class IsPengurusOrAdmin(permissions.BasePermission):
    """Hanya yang punya izin kelola_pengumuman yang boleh write pengumuman."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return has_perm(request.user, "kelola_pengumuman")
