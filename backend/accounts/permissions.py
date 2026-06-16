"""RBAC + object-level permissions.

`has_perm(user, key)` — fungsi utama pengecekan izin dinamis.
Admin (role='admin') selalu diizinkan tanpa melihat database.
Ketua RT dan role lain dicek terhadap PermissionConfig yang disimpan di DB,
di-cache di memori process dengan invalidasi sederhana via `clear_perm_cache()`.
"""

from __future__ import annotations

import threading
from typing import TYPE_CHECKING

from rest_framework import permissions

if TYPE_CHECKING:
    from accounts.models import User as UserType

# ---------------------------------------------------------------------------
# Default permission config
# ---------------------------------------------------------------------------

DEFAULT_PERMISSIONS: list[dict] = [
    # Warga
    {
        "key": "tambah_edit_warga",
        "label": "Tambah & Edit Data Warga",
        "description": "Menambah dan mengedit profil warga (bukan hapus/restore)",
        "category": "warga",
        "allowed_roles": ["ketua_rt", "sekretaris"],
    },
    {
        "key": "verifikasi_warga",
        "label": "Verifikasi Data Warga",
        "description": "Menyetujui/menolak data warga baru",
        "category": "warga",
        "allowed_roles": ["ketua_rt", "sekretaris"],
    },
    {
        "key": "export_import_warga",
        "label": "Export/Import Data Warga",
        "description": "Download Excel dan import massal data warga",
        "category": "warga",
        "allowed_roles": ["ketua_rt", "sekretaris"],
    },
    {
        "key": "hapus_restore_warga",
        "label": "Hapus & Restore Data Warga",
        "description": "Menghapus (soft-delete), restore, dan link/unlink akun warga",
        "category": "warga",
        "allowed_roles": ["ketua_rt"],
    },
    # Kartu Keluarga
    {
        "key": "kelola_kartu_keluarga",
        "label": "Kelola Kartu Keluarga",
        "description": "Membuat, mengedit, menghapus, dan menyetujui pengajuan KK",
        "category": "kartu_keluarga",
        "allowed_roles": ["ketua_rt", "sekretaris"],
    },
    # Keuangan
    {
        "key": "kelola_keuangan",
        "label": "Kelola Keuangan",
        "description": "Membuat, mengedit, dan menghapus transaksi keuangan RT",
        "category": "keuangan",
        "allowed_roles": ["ketua_rt", "bendahara"],
    },
    {
        "key": "konfirmasi_iuran",
        "label": "Konfirmasi Iuran Warga",
        "description": "Menyetujui atau menolak bukti pembayaran iuran",
        "category": "keuangan",
        "allowed_roles": ["ketua_rt", "bendahara"],
    },
    # Konten
    {
        "key": "kelola_pengumuman",
        "label": "Kelola Pengumuman",
        "description": "Membuat, mengedit, dan menghapus pengumuman",
        "category": "konten",
        "allowed_roles": ["ketua_rt", "sekretaris", "pengurus"],
    },
    {
        "key": "moderasi_forum",
        "label": "Moderasi Forum",
        "description": "Menghapus thread/komentar forum warga",
        "category": "konten",
        "allowed_roles": ["ketua_rt", "sekretaris", "pengurus"],
    },
    {
        "key": "update_pengaduan",
        "label": "Update Status Pengaduan",
        "description": "Mengubah status dan menambah catatan pada pengaduan warga",
        "category": "konten",
        "allowed_roles": ["ketua_rt", "sekretaris", "pengurus"],
    },
    {
        "key": "kelola_kegiatan",
        "label": "Kelola Kegiatan",
        "description": "Membuat, mengedit, dan menghapus kegiatan warga",
        "category": "konten",
        "allowed_roles": ["ketua_rt", "sekretaris", "pengurus"],
    },
    {
        "key": "kelola_polling",
        "label": "Kelola Polling",
        "description": "Membuat, mengedit, dan menghapus polling warga",
        "category": "konten",
        "allowed_roles": ["ketua_rt", "sekretaris", "pengurus"],
    },
    # Surat Menyurat
    {
        "key": "kelola_surat",
        "label": "Kelola Surat Menyurat",
        "description": "Memproses, menyetujui, dan menolak permohonan surat warga",
        "category": "surat",
        "allowed_roles": ["ketua_rt", "sekretaris"],
    },
    # Dashboard
    {
        "key": "akses_dashboard_pengurus",
        "label": "Akses Dashboard Pengurus",
        "description": "Melihat dashboard statistik RT (bukan warga umum)",
        "category": "dashboard",
        "allowed_roles": ["ketua_rt", "sekretaris", "bendahara", "pengurus"],
    },
]

# ---------------------------------------------------------------------------
# In-process cache
# ---------------------------------------------------------------------------

_cache_lock = threading.Lock()
_perm_cache: dict[str, list[str]] | None = None  # key → allowed_roles


def _load_cache() -> dict[str, list[str]]:
    from accounts.models import PermissionConfig

    return {pc.key: list(pc.allowed_roles) for pc in PermissionConfig.objects.all()}


def _get_cache() -> dict[str, list[str]]:
    global _perm_cache
    if _perm_cache is None:
        with _cache_lock:
            if _perm_cache is None:
                _perm_cache = _load_cache()
    return _perm_cache


def clear_perm_cache() -> None:
    """Invalidasi cache setelah konfigurasi izin diubah."""
    global _perm_cache
    with _cache_lock:
        _perm_cache = None


def seed_default_permissions() -> None:
    """Isi dan update PermissionConfig dengan default.

    - Buat entri baru jika key belum ada.
    - Untuk entri yang sudah ada: tambahkan role yang ada di default
      tapi belum ada di DB (tanpa menghapus role yang sudah dikonfigurasi admin).
    """
    from accounts.models import PermissionConfig

    changed = False
    for default in DEFAULT_PERMISSIONS:
        key = default["key"]
        obj, created = PermissionConfig.objects.get_or_create(
            key=key,
            defaults={
                "label": default["label"],
                "description": default.get("description", ""),
                "category": default.get("category", ""),
                "allowed_roles": list(default["allowed_roles"]),
            },
        )
        if created:
            changed = True
        else:
            # Tambahkan role baru dari default yang belum ada di DB
            default_roles = set(default["allowed_roles"])
            existing_roles = set(obj.allowed_roles)
            missing = default_roles - existing_roles
            if missing:
                obj.allowed_roles = sorted(existing_roles | missing)
                obj.save(update_fields=["allowed_roles"])
                changed = True

    if changed:
        clear_perm_cache()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def has_perm(user: "UserType", key: str) -> bool:
    """Cek apakah `user` memiliki permission `key`.

    Admin selalu True. Ketua RT dan role lain dicek terhadap PermissionConfig.
    Jika key tidak ada di DB, default False.
    """
    if not user or not user.is_authenticated:
        return False
    if user.role == "admin":
        return True
    cache = _get_cache()
    allowed = cache.get(key, [])
    return user.role in allowed


def get_user_permissions(user: "UserType") -> dict[str, bool]:
    """Kembalikan dict {key: bool} untuk semua permission yang diketahui."""
    if not user or not user.is_authenticated:
        return {}
    if user.role == "admin":
        return {p["key"]: True for p in DEFAULT_PERMISSIONS}
    cache = _get_cache()
    return {key: (user.role in roles) for key, roles in cache.items()}


# ---------------------------------------------------------------------------
# DRF permission classes (tetap dipakai di views lewat permission_classes)
# ---------------------------------------------------------------------------


class IsAdmin(permissions.BasePermission):
    """Global permission: hanya admin (sistem)."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsSekretaris(permissions.BasePermission):
    """Global permission: admin, ketua_rt, atau sekretaris."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "admin", "ketua_rt", "sekretaris"
        ]


class IsBendahara(permissions.BasePermission):
    """Global permission: admin, ketua_rt, atau bendahara."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "admin", "ketua_rt", "bendahara"
        ]


class IsPengurus(permissions.BasePermission):
    """Global permission: admin, ketua_rt, sekretaris, atau pengurus."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "admin", "ketua_rt", "sekretaris", "pengurus",
        ]


# ---------------------------------------------------------------------------
# Dynamic DRF permission classes
# ---------------------------------------------------------------------------


class HasDynamicPerm(permissions.BasePermission):
    """DRF permission class yang dicek secara dinamis terhadap PermissionConfig."""

    required_perm: str = ""

    def has_permission(self, request, view):
        perm_key = getattr(view, "required_perm", self.required_perm)
        return request.user.is_authenticated and has_perm(request.user, perm_key)


def dynamic_perm(key: str) -> type[HasDynamicPerm]:
    """Factory: kembalikan DRF permission class untuk key tertentu."""
    return type(f"DynPerm_{key}", (HasDynamicPerm,), {"required_perm": key})


def _is_owner(obj, user):
    """Helper pengecekan kepemilikan object."""
    owner = getattr(obj, "user", None) or getattr(obj, "warga", None) or getattr(
        obj, "created_by", None
    )
    if owner is None:
        return False
    owner_user = getattr(owner, "user", owner)
    return owner_user == user


class IsOwnerOrSekretaris(permissions.BasePermission):
    """Object-level: pemilik data atau sekretaris/ketua_rt/admin."""

    def has_object_permission(self, request, view, obj):
        if request.user.role in ["admin", "ketua_rt", "sekretaris"]:
            return True
        return _is_owner(obj, request.user)


class IsOwnerOrBendahara(permissions.BasePermission):
    """Object-level: pemilik data atau bendahara/ketua_rt/admin."""

    def has_object_permission(self, request, view, obj):
        if request.user.role in ["admin", "ketua_rt", "bendahara"]:
            return True
        return _is_owner(obj, request.user)
