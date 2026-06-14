"""
Security tests Phase 8 — Kegiatan RT.

Test IDs mengacu pada task 8.7, 8.8, 8.14:
KT-01: Semua user ter-auth bisa lihat kegiatan
KT-02: Unauthenticated → 401
KT-03: Warga tidak bisa buat kegiatan → 403
KT-04: Bendahara tidak bisa buat kegiatan → 403
KT-05: Pengurus bisa buat kegiatan → 201
KT-06: Sekretaris bisa buat kegiatan → 201
KT-07: Admin bisa buat kegiatan → 201
KT-08: Semua user ter-auth bisa lihat detail kegiatan
KT-09: Semua user ter-auth bisa RSVP
KT-10: RSVP kedua → update (upsert, bukan error)
KT-11: Warga tidak bisa delete kegiatan → 403
KT-12: Pengurus bisa delete kegiatan
KT-13: Filter tanggal berfungsi (dari/sampai)
KT-14: Kegiatan tidak ditemukan → 404
KT-15: Pengurus bisa update kegiatan
"""

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from datetime import timedelta

from accounts.models import User
from kegiatan.models import Kegiatan, RSVP


import itertools

_counter = itertools.count(1)


def make_user(email, role):
    phone = f"08{next(_counter):010d}"
    u = User.objects.create_user(
        username=email, email=email, password="testpass123", role=role, phone=phone
    )
    return u


def auth_client(user):
    from rest_framework_simplejwt.tokens import RefreshToken
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


def make_kegiatan(creator, days_ahead=3, nama="Kerja Bakti"):
    return Kegiatan.objects.create(
        nama=nama,
        tanggal=timezone.now() + timedelta(days=days_ahead),
        lokasi="Balai RT",
        created_by=creator,
    )


class KegiatanAuthTest(TestCase):
    def setUp(self):
        self.admin = make_user("admin@rt.com", "admin")
        self.pengurus = make_user("pengurus@rt.com", "pengurus")
        self.warga = make_user("warga@rt.com", "warga")
        self.kegiatan = make_kegiatan(self.admin)

    def test_unauthenticated_cannot_list(self):
        """KT-02: Tanpa login → 401."""
        client = APIClient()
        resp = client.get("/api/v1/kegiatan/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_can_list(self):
        """KT-01: Semua user ter-auth bisa lihat kegiatan."""
        for user in [self.admin, self.pengurus, self.warga]:
            resp = auth_client(user).get("/api/v1/kegiatan/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK, f"Failed for {user.role}")

    def test_authenticated_can_get_detail(self):
        """KT-08: Semua user ter-auth bisa lihat detail kegiatan."""
        for user in [self.admin, self.pengurus, self.warga]:
            resp = auth_client(user).get(f"/api/v1/kegiatan/{self.kegiatan.id}/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK, f"Failed for {user.role}")


class KegiatanCreatePermissionTest(TestCase):
    def setUp(self):
        self.admin = make_user("admin@rt.com", "admin")
        self.sekretaris = make_user("sekretaris@rt.com", "sekretaris")
        self.pengurus = make_user("pengurus@rt.com", "pengurus")
        self.bendahara = make_user("bendahara@rt.com", "bendahara")
        self.warga = make_user("warga@rt.com", "warga")
        self.payload = {
            "nama": "Gotong Royong",
            "deskripsi": "Bersih-bersih",
            "tanggal": (timezone.now() + timedelta(days=7)).isoformat(),
            "lokasi": "Jalan RT",
        }

    def test_warga_cannot_create(self):
        """KT-03: Warga tidak bisa buat kegiatan → 403."""
        resp = auth_client(self.warga).post("/api/v1/kegiatan/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_bendahara_cannot_create(self):
        """KT-04: Bendahara tidak bisa buat kegiatan → 403."""
        resp = auth_client(self.bendahara).post("/api/v1/kegiatan/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_pengurus_can_create(self):
        """KT-05: Pengurus bisa buat kegiatan → 201."""
        resp = auth_client(self.pengurus).post("/api/v1/kegiatan/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_sekretaris_can_create(self):
        """KT-06: Sekretaris bisa buat kegiatan → 201."""
        resp = auth_client(self.sekretaris).post("/api/v1/kegiatan/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_admin_can_create(self):
        """KT-07: Admin bisa buat kegiatan → 201."""
        resp = auth_client(self.admin).post("/api/v1/kegiatan/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class KegiatanUpdateDeleteTest(TestCase):
    def setUp(self):
        self.admin = make_user("admin@rt.com", "admin")
        self.pengurus = make_user("pengurus@rt.com", "pengurus")
        self.warga = make_user("warga@rt.com", "warga")
        self.kegiatan = make_kegiatan(self.admin)

    def test_warga_cannot_delete(self):
        """KT-11: Warga tidak bisa delete kegiatan → 403."""
        resp = auth_client(self.warga).delete(f"/api/v1/kegiatan/{self.kegiatan.id}/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_pengurus_can_delete(self):
        """KT-12: Pengurus bisa delete kegiatan."""
        resp = auth_client(self.pengurus).delete(f"/api/v1/kegiatan/{self.kegiatan.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(Kegiatan.objects.filter(id=self.kegiatan.id).exists())

    def test_pengurus_can_update(self):
        """KT-15: Pengurus bisa update kegiatan."""
        resp = auth_client(self.pengurus).put(
            f"/api/v1/kegiatan/{self.kegiatan.id}/",
            {"nama": "Kegiatan Baru"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.kegiatan.refresh_from_db()
        self.assertEqual(self.kegiatan.nama, "Kegiatan Baru")

    def test_not_found_returns_404(self):
        """KT-14: Kegiatan tidak ditemukan → 404."""
        import uuid
        resp = auth_client(self.warga).get(f"/api/v1/kegiatan/{uuid.uuid4()}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class KegiatanRSVPTest(TestCase):
    def setUp(self):
        self.admin = make_user("admin@rt.com", "admin")
        self.warga = make_user("warga@rt.com", "warga")
        self.warga2 = make_user("warga2@rt.com", "warga")
        self.kegiatan = make_kegiatan(self.admin)

    def test_authenticated_can_rsvp(self):
        """KT-09: Semua user ter-auth bisa RSVP."""
        resp = auth_client(self.warga).post(
            f"/api/v1/kegiatan/{self.kegiatan.id}/rsvp/",
            {"status": "hadir"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(RSVP.objects.filter(kegiatan=self.kegiatan, user=self.warga).exists())

    def test_rsvp_upsert(self):
        """KT-10: RSVP kedua → update status (bukan buat baru)."""
        client = auth_client(self.warga)
        client.post(f"/api/v1/kegiatan/{self.kegiatan.id}/rsvp/", {"status": "hadir"}, format="json")
        client.post(f"/api/v1/kegiatan/{self.kegiatan.id}/rsvp/", {"status": "tidak_hadir"}, format="json")

        rsvps = RSVP.objects.filter(kegiatan=self.kegiatan, user=self.warga)
        self.assertEqual(rsvps.count(), 1, "Harus ada tepat 1 RSVP (upsert)")
        self.assertEqual(rsvps.first().status, "tidak_hadir")

    def test_rsvp_detail_shows_my_rsvp(self):
        """Detail kegiatan menampilkan myRsvp milik user yang login."""
        auth_client(self.warga).post(
            f"/api/v1/kegiatan/{self.kegiatan.id}/rsvp/",
            {"status": "masih_ragu"},
            format="json",
        )
        resp = auth_client(self.warga).get(f"/api/v1/kegiatan/{self.kegiatan.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["data"]["myRsvp"], "masih_ragu")

    def test_unauthenticated_cannot_rsvp(self):
        """Tanpa login → 401 untuk RSVP."""
        resp = APIClient().post(f"/api/v1/kegiatan/{self.kegiatan.id}/rsvp/", {"status": "hadir"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class KegiatanFilterTest(TestCase):
    def setUp(self):
        self.admin = make_user("admin@rt.com", "admin")
        now = timezone.now()
        make_kegiatan(self.admin, days_ahead=1, nama="Kegiatan Besok")
        make_kegiatan(self.admin, days_ahead=5, nama="Kegiatan Lima Hari")
        make_kegiatan(self.admin, days_ahead=10, nama="Kegiatan Sepuluh Hari")

    def test_filter_by_dari_sampai(self):
        """KT-13: Filter tanggal (dari/sampai) berfungsi."""
        client = auth_client(self.admin)
        dari = (timezone.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        sampai = (timezone.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        resp = client.get(f"/api/v1/kegiatan/?dari={dari}&sampai={sampai}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data["data"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["nama"], "Kegiatan Lima Hari")
