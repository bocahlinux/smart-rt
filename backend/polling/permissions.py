from rest_framework import permissions

PENGURUS_ROLES = {"admin", "sekretaris", "pengurus"}


class IsPengurusOrAdmin(permissions.BasePermission):
    """
    Hanya admin, sekretaris, atau pengurus yang bisa CRUD poll.
    Sesuai docs/11-SECURITY.md §2.3 (Polling CRUD).
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in PENGURUS_ROLES
