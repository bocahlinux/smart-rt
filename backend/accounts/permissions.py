from rest_framework import permissions

# Custom permission (RBAC + object-level) untuk app ini.
# Lihat docs/11-SECURITY.md §5.5 & docs/08-CODING-STANDART.md §3.1.


class IsAdmin(permissions.BasePermission):
    """Global permission: hanya admin."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsSekretaris(permissions.BasePermission):
    """Global permission: admin atau sekretaris."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["admin", "sekretaris"]


class IsBendahara(permissions.BasePermission):
    """Global permission: admin atau bendahara."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["admin", "bendahara"]


class IsPengurus(permissions.BasePermission):
    """Global permission: admin, sekretaris, atau pengurus."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "admin",
            "sekretaris",
            "pengurus",
        ]


def _is_owner(obj, user):
    """Helper pengecekan kepemilikan object yang menoleransi variasi nama
    field FK ke pemilik di berbagai model:
    - `obj.user`       → FK langsung ke User (mis. RSVP)
    - `obj.warga`      → FK ke User (mis. Pengaduan.warga) ATAU FK ke
                         WargaProfile (mis. IuranWarga.warga)
    - `obj.created_by` → FK ke User (mis. Transaksi, Thread, Comment)
    Selalu resolve ke instance User sebelum dibandingkan dengan request.user.
    """
    owner = getattr(obj, "user", None) or getattr(obj, "warga", None) or getattr(
        obj, "created_by", None
    )
    if owner is None:
        return False
    owner_user = getattr(owner, "user", owner)  # unwrap WargaProfile.user jika perlu
    return owner_user == user


class IsOwnerOrSekretaris(permissions.BasePermission):
    """Object-level: pemilik data atau sekretaris/admin."""

    def has_object_permission(self, request, view, obj):
        if request.user.role in ["admin", "sekretaris"]:
            return True
        return _is_owner(obj, request.user)


class IsOwnerOrBendahara(permissions.BasePermission):
    """Object-level: pemilik data atau bendahara/admin (mis. bukti transfer)."""

    def has_object_permission(self, request, view, obj):
        if request.user.role in ["admin", "bendahara"]:
            return True
        return _is_owner(obj, request.user)
