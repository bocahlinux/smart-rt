from django.contrib.auth import password_validation
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from accounts.models import User

# Security tests — lihat docs/07-TASK-BREAKDOWN.md tugas 2.20-2.23 dan
# docs/02-SRS.md FR-AUTH-09/FR-AUTH-10.

REGISTER_PAYLOAD = {
    "email": "warga@example.com",
    "phone": "081234567890",
    "password": "Passw0rd123",
    "passwordConfirmation": "Passw0rd123",
}


class AuthFlowSecurityTests(APITestCase):
    """2.20 — alur lengkap register → login → access → refresh → logout."""

    def setUp(self):
        cache.clear()  # throttle cache (LocMemCache) tidak di-reset antar TestCase
        self.register_url = reverse("accounts:register")
        self.login_url = reverse("accounts:login")
        self.refresh_url = reverse("accounts:token-refresh")
        self.logout_url = reverse("accounts:logout")
        self.me_url = reverse("accounts:me")

    def _login(self, email=REGISTER_PAYLOAD["email"], password=REGISTER_PAYLOAD["password"]):
        return self.client.post(self.login_url, {"email": email, "password": password}, format="json")

    def test_register_login_access_refresh_logout_flow(self):
        # 1. Register → akun berstatus pending
        response = self.client.post(self.register_url, REGISTER_PAYLOAD, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["status"], User.Status.PENDING)
        self.assertEqual(response.data["data"]["role"], User.Role.WARGA)

        user = User.objects.get(email=REGISTER_PAYLOAD["email"])

        # Login ditolak selama akun masih pending
        response = self._login()
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "AUTH_ACCOUNT_NOT_VERIFIED")

        # 2. Verifikasi pengurus → akun aktif
        user.status = User.Status.ACTIVE
        user.save(update_fields=["status"])

        # 3. Login sukses
        response = self._login()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        access_token = response.data["data"]["accessToken"]
        self.assertEqual(response.data["data"]["expiresIn"], 15 * 60)
        self.assertIn("refresh_token", response.cookies)
        cookie = response.cookies["refresh_token"]
        self.assertTrue(cookie["httponly"])
        self.assertEqual(cookie["samesite"], "Strict")

        # 4. Akses endpoint terproteksi dengan access token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["email"], REGISTER_PAYLOAD["email"])
        self.assertIsNone(response.data["data"]["profile"])

        # 5. Refresh token → access token baru + cookie ter-rotasi
        self.client.credentials()  # refresh tidak butuh access token
        response = self.client.post(self.refresh_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        new_access_token = response.data["data"]["accessToken"]
        self.assertNotEqual(new_access_token, access_token)
        self.assertIn("refresh_token", response.cookies)
        rotated_refresh_token = response.cookies["refresh_token"].value

        # 6. Logout → refresh token (hasil rotasi) di-blacklist & cookie dihapus
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {new_access_token}")
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.cookies["refresh_token"].value, "")

        # Replay token yang sudah di-blacklist (mis. dicuri sebelum logout)
        # harus terdeteksi sebagai reuse, bukan sekadar "tidak ditemukan"
        self.client.credentials()
        self.client.cookies["refresh_token"] = rotated_refresh_token
        response = self.client.post(self.refresh_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "AUTH_REFRESH_TOKEN_REUSED")


class TokenEdgeCaseSecurityTests(APITestCase):
    """2.21 — token kedaluwarsa/invalid/reused harus ditolak dengan 401."""

    def setUp(self):
        self.me_url = reverse("accounts:me")
        self.refresh_url = reverse("accounts:token-refresh")
        self.logout_url = reverse("accounts:logout")
        self.user = User.objects.create_user(
            username=REGISTER_PAYLOAD["email"],
            email=REGISTER_PAYLOAD["email"],
            phone=REGISTER_PAYLOAD["phone"],
            password=REGISTER_PAYLOAD["password"],
            role=User.Role.WARGA,
            status=User.Status.ACTIVE,
        )

    def test_expired_access_token_returns_401(self):
        token = AccessToken.for_user(self.user)
        token.set_exp(lifetime=-token.lifetime)  # paksa kedaluwarsa
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_access_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not-a-real-token")

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_access_token_returns_401(self):
        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_reused_refresh_token_after_rotation_returns_401_and_revokes_sessions(self):
        first_refresh = RefreshToken.for_user(self.user)
        self.client.cookies["refresh_token"] = str(first_refresh)

        # Rotasi pertama — sukses, refresh token lama di-blacklist
        response = self.client.post(self.refresh_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rotated_cookie = response.cookies["refresh_token"].value

        # Coba pakai ulang refresh token yang sudah di-rotasi (di-blacklist)
        self.client.cookies["refresh_token"] = str(first_refresh)
        response = self.client.post(self.refresh_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "AUTH_REFRESH_TOKEN_REUSED")

        # Semua sesi (termasuk hasil rotasi) ikut di-revoke demi keamanan
        self.client.cookies["refresh_token"] = rotated_cookie
        response = self.client.post(self.refresh_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_without_cookie_returns_401(self):
        response = self.client.post(self.refresh_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "AUTH_REFRESH_TOKEN_EXPIRED")


class LoginRateLimitSecurityTests(APITestCase):
    """2.22 — percobaan login ke-11 dalam 5 menit harus mendapat 429."""

    def setUp(self):
        cache.clear()  # throttle cache (LocMemCache) tidak di-reset antar TestCase
        self.login_url = reverse("accounts:login")
        User.objects.create_user(
            username=REGISTER_PAYLOAD["email"],
            email=REGISTER_PAYLOAD["email"],
            phone=REGISTER_PAYLOAD["phone"],
            password=REGISTER_PAYLOAD["password"],
            role=User.Role.WARGA,
            status=User.Status.ACTIVE,
        )

    def test_eleventh_login_attempt_is_throttled(self):
        payload = {"email": REGISTER_PAYLOAD["email"], "password": "wrong-password"}

        for attempt in range(1, 11):
            response = self.client.post(self.login_url, payload, format="json")
            self.assertEqual(
                response.status_code,
                status.HTTP_401_UNAUTHORIZED,
                f"Percobaan ke-{attempt} seharusnya belum di-throttle",
            )

        response = self.client.post(self.login_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class PasswordStrengthSecurityTests(APITestCase):
    """2.23 — validasi kekuatan password (min 8 karakter, huruf besar, kecil, angka)."""

    def setUp(self):
        self.register_url = reverse("accounts:register")

    def _register(self, password):
        payload = {**REGISTER_PAYLOAD, "password": password, "passwordConfirmation": password}
        return self.client.post(self.register_url, payload, format="json")

    def test_weak_passwords_are_rejected_on_register(self):
        weak_passwords = [
            "short1A",  # kurang dari 8 karakter
            "alllowercase1",  # tanpa huruf besar
            "ALLUPPERCASE1",  # tanpa huruf kecil
            "NoDigitsHere",  # tanpa angka
            "12345678",  # numerik semua (CommonPasswordValidator/Numeric)
        ]
        for weak in weak_passwords:
            response = self._register(weak)
            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Password '{weak}' seharusnya ditolak",
            )
            self.assertEqual(response.data["status"], "error")

    def test_strong_password_is_accepted_on_register(self):
        response = self._register("Passw0rd123")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_password_complexity_validator_messages(self):
        with self.assertRaises(ValidationError) as ctx:
            password_validation.validate_password("alllowercase1")

        messages = " ".join(ctx.exception.messages)
        self.assertIn("huruf besar", messages)
