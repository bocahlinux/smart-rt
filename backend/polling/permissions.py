from rest_framework import permissions

from accounts.permissions import has_perm


class IsPengurusOrAdmin(permissions.BasePermission):
    """Hanya yang punya izin kelola_polling yang boleh CRUD polling."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and has_perm(request.user, "kelola_polling")
