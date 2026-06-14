from rest_framework import permissions

from accounts.permissions import _is_owner

# Roles yang berhak melakukan moderasi forum
MODERATOR_ROLES = {"admin", "sekretaris", "pengurus"}


class IsModerator(permissions.BasePermission):
    """Global permission: admin, sekretaris, atau pengurus (moderator forum)."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in MODERATOR_ROLES


class IsOwnerOrModerator(permissions.BasePermission):
    """
    Object-level permission untuk Thread dan Comment:
    - Moderator (admin/sekretaris/pengurus) bisa akses semua.
    - Owner (created_by) bisa EDIT object miliknya.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in MODERATOR_ROLES:
            return True
        return _is_owner(obj, request.user)
