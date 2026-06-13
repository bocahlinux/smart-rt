from rest_framework import permissions


class IsPengurusOrAdmin(permissions.BasePermission):
    """Hanya pengurus, sekretaris, atau admin yang boleh write pengumuman."""

    PENGURUS_ROLES = {"admin", "pengurus", "sekretaris"}

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in self.PENGURUS_ROLES
