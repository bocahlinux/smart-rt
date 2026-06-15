from rest_framework import permissions

from accounts.permissions import has_perm


class IsOwnerOrPengurus(permissions.BasePermission):
    """Object-level permission untuk Pengaduan:
    - Yang punya izin update_pengaduan bisa akses semua.
    - Pelapor (warga) bisa akses pengaduan miliknya sendiri.
    """

    def has_object_permission(self, request, view, obj):
        if has_perm(request.user, "update_pengaduan"):
            return True
        return obj.warga == request.user


class CanUpdateStatus(permissions.BasePermission):
    """Global permission untuk update status pengaduan."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and has_perm(request.user, "update_pengaduan")
