from django.contrib.auth import authenticate

from .models import User
from django.utils.translation import gettext as _
from rest_framework import permissions, status
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import AdminCreateUserSerializer, ChangePasswordSerializer, RegisterSerializer, UserManagementSerializer, UserSerializer
from .permissions import IsAdmin
from .utils import clear_refresh_cookie, error_response, set_refresh_cookie, success_response

# Auth ViewSet/Views — lihat docs/06-API-CONTRACT.md §2 dan docs/11-SECURITY.md §4.


def _user_payload(user):
    return {
        "id": str(user.id),
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "status": user.status,
    }


def _issue_tokens(user):
    """Generate access + refresh token baru untuk user (login & refresh)."""
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)


def _revoke_all_sessions(refresh_token_str):
    """Blacklist seluruh outstanding token milik pemilik token yang di-reuse —
    mitigasi potensi pencurian refresh token, lihat kode `AUTH_REFRESH_TOKEN_REUSED`
    di docs/06-API-CONTRACT.md §1.7 ("semua sesi di-revoke")."""
    from rest_framework_simplejwt.token_blacklist.models import (
        BlacklistedToken,
        OutstandingToken,
    )

    try:
        unverified = RefreshToken(refresh_token_str, verify=False)
        user_id = unverified.payload.get("user_id")
    except TokenError:
        return
    if user_id is None:
        return

    already_blacklisted = BlacklistedToken.objects.values_list("token_id", flat=True)
    outstanding = OutstandingToken.objects.filter(user_id=user_id).exclude(
        id__in=already_blacklisted
    )
    BlacklistedToken.objects.bulk_create(
        [BlacklistedToken(token=token) for token in outstanding],
        ignore_conflicts=True,
    )


def _access_token_lifetime_seconds():
    from django.conf import settings

    return int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds())


class LoginRateThrottle(AnonRateThrottle):
    """Rate limit login: 10 attempts / 5 menit per IP — lihat
    docs/11-SECURITY.md §4.2 dan docs/02-SRS.md FR-AUTH-09."""

    scope = "login"

    def parse_rate(self, rate):
        """DRF `parse_rate` bawaan hanya mengenali unit tunggal (s/m/h/d)
        tanpa pengali, padahal `DEFAULT_THROTTLE_RATES["login"]` memakai
        format `"10/5min"`. Override ini menambah dukungan pengali (mis.
        `"5min"` → 5 * 60 detik) agar rate dari settings terbaca benar."""
        if rate is None:
            return (None, None)
        num, period = rate.split("/")
        num_requests = int(num)
        digits = "".join(ch for ch in period if ch.isdigit())
        multiplier = int(digits) if digits else 1
        unit = period[len(digits):][:1] or period[-1]
        duration = {"s": 1, "m": 60, "h": 3600, "d": 86400}[unit]
        return num_requests, duration * multiplier


class RegisterView(APIView):
    """POST /auth/register — lihat docs/06-API-CONTRACT.md §2.1."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Registrasi gagal, periksa kembali input Anda",
                errors=_serializer_errors(serializer),
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        user = serializer.save()
        return success_response(
            data=_user_payload(user),
            message="Registrasi berhasil. Menunggu verifikasi pengurus.",
            status_code=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /auth/login — lihat docs/06-API-CONTRACT.md §2.2."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        if not email or not password:
            return error_response(
                "VALIDATION_ERROR",
                "Email dan password wajib diisi",
                errors=[
                    {"field": "email", "code": "FIELD_REQUIRED", "message": "Email wajib diisi"}
                    for _ in [None]
                    if not email
                ]
                + [
                    {
                        "field": "password",
                        "code": "FIELD_REQUIRED",
                        "message": "Password wajib diisi",
                    }
                    for _ in [None]
                    if not password
                ],
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=email, password=password)
        if user is None:
            return error_response(
                "AUTH_INVALID_CREDENTIALS",
                "Email atau password salah",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        if user.status != user.Status.ACTIVE:
            messages = {
                user.Status.PENDING: "Akun Anda belum diverifikasi oleh pengurus. Mohon tunggu proses verifikasi.",
                user.Status.REJECTED: "Akun Anda ditolak oleh pengurus. Silakan hubungi pengurus RT.",
            }
            return error_response(
                "AUTH_ACCOUNT_NOT_VERIFIED",
                messages.get(user.status, "Akun Anda belum dapat digunakan untuk login."),
                status_code=status.HTTP_403_FORBIDDEN,
            )

        access_token, refresh_token = _issue_tokens(user)
        response = success_response(
            data={
                "user": _user_payload(user),
                "accessToken": access_token,
                "expiresIn": _access_token_lifetime_seconds(),
            }
        )
        set_refresh_cookie(response, refresh_token)
        return response


class TokenRefreshView(APIView):
    """POST /auth/token/refresh — lihat docs/06-API-CONTRACT.md §2.2.1.

    Refresh token dibaca dari httpOnly cookie (bukan request body). Rotation
    + blacklist ditangani oleh SimpleJWT (`ROTATE_REFRESH_TOKENS` &
    `BLACKLIST_AFTER_ROTATION` — lihat config/settings/base.py).
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.conf import settings

        refresh_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
        if not refresh_token:
            return error_response(
                "AUTH_REFRESH_TOKEN_EXPIRED",
                "Refresh token tidak ditemukan, silakan login kembali",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken) as exc:
            # Pesan TokenError diterjemahkan sesuai locale aktif (mis. "Token
            # masuk daftar hitam"), jadi bandingkan dengan string yang
            # diterjemahkan juga — bukan literal Inggris "blacklisted".
            if str(exc) == _("Token is blacklisted"):
                _revoke_all_sessions(refresh_token)
                return error_response(
                    "AUTH_REFRESH_TOKEN_REUSED",
                    "Terdeteksi penggunaan ulang refresh token. Demi keamanan, "
                    "semua sesi telah diakhiri — silakan login kembali.",
                    status_code=status.HTTP_401_UNAUTHORIZED,
                )
            return error_response(
                "AUTH_REFRESH_TOKEN_EXPIRED",
                "Refresh token tidak valid atau kedaluwarsa, silakan login kembali",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        new_access = serializer.validated_data["access"]
        new_refresh = serializer.validated_data.get("refresh", refresh_token)

        response = success_response(
            data={"accessToken": new_access, "expiresIn": _access_token_lifetime_seconds()}
        )
        set_refresh_cookie(response, new_refresh)
        return response


class LogoutView(APIView):
    """POST /auth/logout — lihat docs/06-API-CONTRACT.md §2.3."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from django.conf import settings

        refresh_token = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except (TokenError, InvalidToken):
                pass  # Token sudah invalid/blacklisted — lanjutkan logout

        response = success_response(message="Logout berhasil")
        clear_refresh_cookie(response)
        return response


class MeView(APIView):
    """GET /auth/me — lihat docs/06-API-CONTRACT.md §2.5."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return success_response(data=UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    """PUT /auth/password — lihat docs/06-API-CONTRACT.md §2.6."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "user"

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            errors = _serializer_errors(serializer)
            if "currentPassword" in serializer.errors:
                return error_response(
                    "AUTH_INVALID_CREDENTIALS",
                    "Password lama salah",
                    errors=errors,
                    status_code=status.HTTP_401_UNAUTHORIZED,
                )
            return error_response(
                "VALIDATION_ERROR",
                "Gagal mengubah password, periksa kembali input Anda",
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save()
        return success_response(message="Password berhasil diubah")


class UserListView(APIView):
    """GET /users/ — daftar semua user, admin only.

    Query params:
    - role: filter by role (admin|sekretaris|bendahara|pengurus|warga)
    - status: filter by status (pending|active|rejected)
    - search: cari by email atau phone (case-insensitive)
    """

    permission_classes = [IsAdmin]

    def get(self, request):
        from django.db.models import Q

        qs = User.objects.select_related("profile").all().order_by("-created_at")
        role = request.query_params.get("role")
        status_filter = request.query_params.get("status")
        search = request.query_params.get("search", "").strip()
        if role:
            qs = qs.filter(role=role)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(Q(email__icontains=search) | Q(phone__icontains=search))
        serializer = UserManagementSerializer(qs, many=True)
        return success_response(data={"count": qs.count(), "results": serializer.data})

    def post(self, request):
        serializer = AdminCreateUserSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Data tidak valid",
                errors=_serializer_errors(serializer),
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        user = serializer.save()
        return success_response(
            data=UserManagementSerializer(user).data,
            status_code=status.HTTP_201_CREATED,
        )


class UserDetailView(APIView):
    """GET /users/{id}/ dan PATCH /users/{id}/ — admin only.

    PATCH hanya mengizinkan update field `role` dan `status`.
    """

    permission_classes = [IsAdmin]

    def _get_user(self, pk):
        from django.shortcuts import get_object_or_404

        return get_object_or_404(User.objects.select_related("profile"), pk=pk)

    def get(self, request, pk):
        user = self._get_user(pk)
        return success_response(data=UserManagementSerializer(user).data)

    def patch(self, request, pk):
        user = self._get_user(pk)
        serializer = UserManagementSerializer(user, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Data tidak valid",
                errors=_serializer_errors(serializer),
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save()
        return success_response(data=serializer.data)


def _serializer_errors(serializer):
    """Konversi `serializer.errors` ke format array `{field, message}` —
    lihat docs/06-API-CONTRACT.md §1.3 (Error response format)."""
    errors = []
    for field, messages in serializer.errors.items():
        for message in messages:
            errors.append({"field": field, "message": str(message)})
    return errors


__all__ = [
    "ChangePasswordView",
    "LoginView",
    "LogoutView",
    "MeView",
    "RegisterView",
    "TokenRefreshView",
]
