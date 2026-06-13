"""Audit log service — lihat docs/05-DATABASE.md §4.6 dan §10.4."""

_SENSITIVE_FIELDS = {"nik", "no_kk", "phone", "email", "alamat", "tempat_lahir", "tanggal_lahir"}


def _mask_value(field: str, value) -> str:
    """Mask nilai field sensitif — lihat docs/05-DATABASE.md §10.3."""
    if value is None:
        return None
    s = str(value)
    if field in ("nik", "no_kk"):
        return s[:4] + "********" + s[-4:] if len(s) >= 8 else "****"
    if field == "phone":
        return s[:4] + "****" + s[-4:] if len(s) >= 8 else "****"
    if field == "email":
        parts = s.split("@")
        if len(parts) == 2:
            local = parts[0]
            return local[:2] + "***@" + parts[1] if len(local) > 2 else "***@" + parts[1]
        return "***"
    # alamat, tempat_lahir, tanggal_lahir — redact
    return "[REDACTED]"


def _mask_data(data: dict) -> dict:
    """Return salinan dict dengan field sensitif di-mask."""
    if not data:
        return data
    result = {}
    for k, v in data.items():
        if k in _SENSITIVE_FIELDS:
            result[k] = _mask_value(k, v)
        else:
            result[k] = v
    return result


def log_action(*, user, action: str, table_name: str, record_id, old_data=None, new_data=None, request=None):
    """Catat aksi ke AuditLog.

    Parameter:
    - user: instance User yang melakukan aksi
    - action: 'create' | 'update' | 'delete' | 'verify' | 'view' | 'export'
    - table_name: nama tabel yang terdampak (mis. 'warga_profiles')
    - record_id: UUID record yang terdampak
    - old_data: dict data sebelum perubahan (field sensitif akan di-mask)
    - new_data: dict data sesudah perubahan (field sensitif akan di-mask)
    - request: Django request object (untuk capture IP)
    """
    from .models import AuditLog

    ip = None
    if request is not None:
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        ip = x_forwarded_for.split(",")[0].strip() if x_forwarded_for else request.META.get("REMOTE_ADDR")

    AuditLog.objects.create(
        user=user,
        action=action,
        table_name=table_name,
        record_id=str(record_id),
        old_data=_mask_data(old_data),
        new_data=_mask_data(new_data),
        ip_address=ip,
    )
