from rest_framework import permissions

# Roles yang berhak CRUD kegiatan dan polling
PENGURUS_ROLES = {"admin", "sekretaris", "pengurus"}


class IsPengurusOrAdmin(permissions.BasePermission):
    """
    Global permission: hanya admin, sekretaris, atau pengurus.
    Warga & bendahara → 403.
    Sesuai docs/11-SECURITY.md §2.3 (Kegiatan CRUD).
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in PENGURUS_ROLES
