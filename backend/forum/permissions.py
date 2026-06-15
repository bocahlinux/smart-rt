from rest_framework import permissions

from accounts.permissions import _is_owner, has_perm


class IsModerator(permissions.BasePermission):
    """Global permission: siapa pun yang punya izin moderasi_forum."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and has_perm(request.user, "moderasi_forum")


class IsOwnerOrModerator(permissions.BasePermission):
    """Object-level permission untuk Thread dan Comment."""

    def has_object_permission(self, request, view, obj):
        if has_perm(request.user, "moderasi_forum"):
            return True
        return _is_owner(obj, request.user)
