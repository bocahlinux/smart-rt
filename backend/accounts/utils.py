"""Masking utilities untuk field sensitif (lihat docs/11-SECURITY.md §6.1)
serta helper response & cookie untuk auth (lihat docs/06-API-CONTRACT.md).

Catatan: NIK & no_kk akan dipakai mulai Phase 3 (WargaProfile), tapi fungsi
masking-nya disiapkan di sini agar reusable lintas modul tanpa duplikasi.
"""

from django.conf import settings
from rest_framework.response import Response


def mask_nik(value: str | None) -> str | None:
    """`3201010101010001` → `3201********0001`"""
    if not value:
        return value
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}{'*' * 8}{value[-4:]}"


def mask_no_kk(value: str | None) -> str | None:
    """Sama dengan masking NIK: 4 awal + 8 bintang + 4 akhir."""
    return mask_nik(value)


def mask_phone(value: str | None) -> str | None:
    """`081234565678` → `0812****5678`"""
    if not value:
        return value
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}{'*' * 4}{value[-4:]}"


def mask_email(value: str | None) -> str | None:
    """`ahmad@gmail.com` → `ah***@gmail.com`"""
    if not value or "@" not in value:
        return value
    local, _, domain = value.partition("@")
    if len(local) <= 2:
        visible = local[:1]
    else:
        visible = local[:2]
    return f"{visible}***@{domain}"


def success_response(data=None, message=None, status_code=200, **extra):
    """Bentuk response sukses standar — lihat docs/06-API-CONTRACT.md §1.3.

    `extra` memungkinkan field top-level tambahan seperti `pagination` tanpa
    mengubah signature yang sudah dipakai di modul lain.
    """
    payload = {"status": "success"}
    if data is not None:
        payload["data"] = data
    if message is not None:
        payload["message"] = message
    payload.update(extra)
    return Response(payload, status=status_code)


def error_response(code, message, errors=None, status_code=400):
    """Bentuk response error standar dengan `code` mesin-terbaca — lihat
    docs/06-API-CONTRACT.md §1.7 (Error Code Dictionary)."""
    payload = {"status": "error", "code": code, "message": message}
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)


def set_refresh_cookie(response, token: str):
    """Set refresh token sebagai httpOnly Secure SameSite cookie — lihat
    docs/06-API-CONTRACT.md §2.2 dan docs/11-SECURITY.md §4.1."""
    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=token,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        path=settings.REFRESH_TOKEN_COOKIE_PATH,
        secure=settings.REFRESH_TOKEN_COOKIE_SECURE,
        httponly=True,
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
    )


def clear_refresh_cookie(response):
    """Hapus cookie refresh token (Set-Cookie dengan Max-Age=0) saat logout."""
    response.delete_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        path=settings.REFRESH_TOKEN_COOKIE_PATH,
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
    )
