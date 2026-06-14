from rest_framework import permissions

# Roles yang berhak melihat semua pengaduan dan update status
PENGURUS_ROLES = {"admin", "sekretaris", "pengurus"}


class IsOwnerOrPengurus(permissions.BasePermission):
    """
    Object-level permission untuk Pengaduan:
    - Pengurus (admin/sekretaris/pengurus) bisa akses semua.
    - Pelapor (warga) bisa akses pengaduan miliknya sendiri.
    Sesuai docs/11-SECURITY.md §2.3 & §5.2.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in PENGURUS_ROLES:
            return True
        # Pelapor bisa akses pengaduan miliknya
        return obj.warga == request.user


class CanUpdateStatus(permissions.BasePermission):
    """
    Global permission untuk update status pengaduan:
    Hanya admin, sekretaris, dan pengurus yang boleh mengubah status.
    Warga tidak diizinkan (→ 403).
    Sesuai docs/11-SECURITY.md §2.3 (Pengaduan → Update status).
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in PENGURUS_ROLES
