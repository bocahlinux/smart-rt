"""Phase 10 security tests — IDOR, RBAC cross-check, sensitive field exposure."""

import uuid

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, WargaProfile
from forum.models import Thread


def _make_user(email, role="warga", user_status="active"):
    return User.objects.create_user(
        username=email,
        email=email,
        password="Pass!1234",
        phone=f"08{abs(hash(email)) % 10_000_000_000:010d}",
        role=role,
        status=user_status,
    )


def _make_profile(user, nama="Warga Test"):
    return WargaProfile.objects.create(
        user=user,
        nama_lengkap=nama,
        nik=f"{abs(hash(user.email)) % 10**16:016d}",
    )


def _auth(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


class IDORWargaDetailTest(TestCase):
    """IDOR: warga tidak bisa akses profil warga lain."""

    def setUp(self):
        self.warga_a = _make_user("warga_a@test.com")
        self.warga_b = _make_user("warga_b@test.com")
        self.profile_a = _make_profile(self.warga_a, "Warga A")
        self.profile_b = _make_profile(self.warga_b, "Warga B")

    def test_warga_cannot_access_other_warga_profile(self):
        client = _auth(self.warga_a)
        res = client.get(f"/api/v1/warga/{self.profile_b.id}/")
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_warga_cannot_edit_other_warga_profile(self):
        client = _auth(self.warga_a)
        res = client.patch(
            f"/api/v1/warga/{self.profile_b.id}/",
            {"nama_lengkap": "Hacker"},
            format="json",
        )
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_admin_can_access_any_warga_profile(self):
        admin = _make_user("admin@test.com", role="admin")
        client = _auth(admin)
        res = client.get(f"/api/v1/warga/{self.profile_a.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_unauthenticated_cannot_list_warga(self):
        client = APIClient()
        res = client.get("/api/v1/warga/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class IDORForumTest(TestCase):
    """IDOR: warga hanya bisa edit/hapus thread miliknya."""

    def setUp(self):
        self.owner = _make_user("owner@test.com")
        self.other = _make_user("other@test.com")
        self.thread = Thread.objects.create(
            judul="Thread owner",
            isi="Isi thread",
            kategori=Thread.Kategori.LAINNYA,
            status=Thread.Status.ACTIVE,
            created_by=self.owner,
        )

    def test_other_warga_cannot_edit_thread(self):
        client = _auth(self.other)
        res = client.put(
            f"/api/v1/forum/{self.thread.id}/",
            {"judul": "Hacked", "isi": "Hacked isi", "kategori": "lainnya"},
            format="json",
        )
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_other_warga_cannot_delete_thread(self):
        client = _auth(self.other)
        res = client.delete(f"/api/v1/forum/{self.thread.id}/")
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_nonexistent_uuid_returns_404(self):
        client = _auth(self.owner)
        fake_id = str(uuid.uuid4())
        res = client.get(f"/api/v1/forum/{fake_id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class RBACDashboardTest(TestCase):
    """RBAC: dashboard pengurus tidak bisa diakses oleh warga."""

    def setUp(self):
        self.warga = _make_user("warga_dash@test.com")
        self.pengurus = _make_user("pengurus_dash@test.com", role="pengurus")

    def test_warga_cannot_access_pengurus_dashboard(self):
        client = _auth(self.warga)
        res = client.get("/api/v1/dashboard/pengurus/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_pengurus_can_access_pengurus_dashboard(self):
        client = _auth(self.pengurus)
        res = client.get("/api/v1/dashboard/pengurus/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_warga_can_access_warga_dashboard(self):
        _make_profile(self.warga, "Warga Dash")
        client = _auth(self.warga)
        res = client.get("/api/v1/dashboard/warga/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_unauthenticated_cannot_access_dashboard(self):
        client = APIClient()
        res = client.get("/api/v1/dashboard/pengurus/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
