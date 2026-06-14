"""
Security tests Phase 8 — Polling RT.

Test IDs mengacu pada task 8.8, 8.9, 8.14, 8.15:
PT-01: Semua user ter-auth bisa lihat daftar poll
PT-02: Unauthenticated → 401
PT-03: Warga tidak bisa buat poll → 403
PT-04: Bendahara tidak bisa buat poll → 403
PT-05: Pengurus bisa buat poll → 201
PT-06: Sekretaris bisa buat poll → 201
PT-07: Admin bisa buat poll → 201
PT-08: Semua user ter-auth bisa vote
PT-09: Double vote → 409 Conflict
PT-10: Vote setelah deadline → 400
PT-11: opsiIndex out of range → 400
PT-12: Hasil poll hidden sebelum deadline untuk warga
PT-13: Pengurus bisa lihat hasil poll sebelum deadline
PT-14: Hasil poll visible setelah deadline untuk warga
PT-15: Filter by status=aktif berfungsi
PT-16: Filter by status=expired berfungsi
PT-17: hasVoted tercermin dengan benar
"""

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from datetime import timedelta

from accounts.models import User
from polling.models import Poll, Vote


import itertools

_counter = itertools.count(1)


def make_user(email, role):
    phone = f"08{next(_counter):010d}"
    return User.objects.create_user(
        username=email, email=email, password="testpass123", role=role, phone=phone
    )


def auth_client(user):
    from rest_framework_simplejwt.tokens import RefreshToken
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


def make_poll(creator, deadline_days=3, pertanyaan="Waktu kerja bakti?"):
    return Poll.objects.create(
        pertanyaan=pertanyaan,
        opsi=["Sabtu pagi", "Minggu pagi", "Sabtu sore"],
        deadline=timezone.now() + timedelta(days=deadline_days),
        created_by=creator,
    )


def make_expired_poll(creator, pertanyaan="Poll Lama"):
    return Poll.objects.create(
        pertanyaan=pertanyaan,
        opsi=["Opsi A", "Opsi B"],
        deadline=timezone.now() - timedelta(days=1),
        created_by=creator,
    )


class PollAuthTest(TestCase):
    def setUp(self):
        self.admin = make_user("admin@rt.com", "admin")
        self.warga = make_user("warga@rt.com", "warga")
        self.poll = make_poll(self.admin)

    def test_unauthenticated_cannot_list(self):
        """PT-02: Tanpa login → 401."""
        resp = APIClient().get("/api/v1/polling/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_can_list(self):
        """PT-01: Semua user ter-auth bisa lihat daftar poll."""
        for user in [self.admin, self.warga]:
            resp = auth_client(user).get("/api/v1/polling/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK, f"Failed for {user.role}")


class PollCreatePermissionTest(TestCase):
    def setUp(self):
        self.admin = make_user("admin@rt.com", "admin")
        self.sekretaris = make_user("sekretaris@rt.com", "sekretaris")
        self.pengurus = make_user("pengurus@rt.com", "pengurus")
        self.bendahara = make_user("bendahara@rt.com", "bendahara")
        self.warga = make_user("warga@rt.com", "warga")
        self.payload = {
            "pertanyaan": "Kapan kegiatan?",
            "opsi": ["Sabtu", "Minggu"],
            "deadline": (timezone.now() + timedelta(days=7)).isoformat(),
        }

    def test_warga_cannot_create_poll(self):
        """PT-03: Warga tidak bisa buat poll → 403."""
        resp = auth_client(self.warga).post("/api/v1/polling/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_bendahara_cannot_create_poll(self):
        """PT-04: Bendahara tidak bisa buat poll → 403."""
        resp = auth_client(self.bendahara).post("/api/v1/polling/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_pengurus_can_create_poll(self):
        """PT-05: Pengurus bisa buat poll → 201."""
        resp = auth_client(self.pengurus).post("/api/v1/polling/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_sekretaris_can_create_poll(self):
        """PT-06: Sekretaris bisa buat poll → 201."""
        resp = auth_client(self.sekretaris).post("/api/v1/polling/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_admin_can_create_poll(self):
        """PT-07: Admin bisa buat poll → 201."""
        resp = auth_client(self.admin).post("/api/v1/polling/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_opsi_minimum_2(self):
        """Opsi poll minimal 2 item → 400 jika hanya 1."""
        payload = {**self.payload, "opsi": ["Hanya satu"]}
        resp = auth_client(self.pengurus).post("/api/v1/polling/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class PollVoteTest(TestCase):
    def setUp(self):
        self.admin = make_user("admin@rt.com", "admin")
        self.warga = make_user("warga@rt.com", "warga")
        self.warga2 = make_user("warga2@rt.com", "warga")
        self.poll = make_poll(self.admin)
        self.expired_poll = make_expired_poll(self.admin)

    def test_authenticated_can_vote(self):
        """PT-08: Semua user ter-auth bisa vote."""
        resp = auth_client(self.warga).post(
            f"/api/v1/polling/{self.poll.id}/vote/",
            {"opsiIndex": 0},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(Vote.objects.filter(poll=self.poll, user=self.warga).exists())

    def test_double_vote_returns_409(self):
        """PT-09: Double vote → 409 Conflict."""
        client = auth_client(self.warga)
        client.post(f"/api/v1/polling/{self.poll.id}/vote/", {"opsiIndex": 0}, format="json")
        resp = client.post(f"/api/v1/polling/{self.poll.id}/vote/", {"opsiIndex": 1}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(resp.data.get("code"), "POLLING_ALREADY_VOTED")

    def test_vote_after_deadline_returns_400(self):
        """PT-10: Vote setelah deadline → 400."""
        resp = auth_client(self.warga).post(
            f"/api/v1/polling/{self.expired_poll.id}/vote/",
            {"opsiIndex": 0},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_vote_invalid_index_returns_400(self):
        """PT-11: opsiIndex out of range → 400."""
        resp = auth_client(self.warga).post(
            f"/api/v1/polling/{self.poll.id}/vote/",
            {"opsiIndex": 99},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class PollResultAccessTest(TestCase):
    def setUp(self):
        self.admin = make_user("admin@rt.com", "admin")
        self.pengurus = make_user("pengurus@rt.com", "pengurus")
        self.warga = make_user("warga@rt.com", "warga")
        self.active_poll = make_poll(self.admin)
        self.expired_poll = make_expired_poll(self.admin)
        # Vote pada poll yang expired
        Vote.objects.create(poll=self.expired_poll, user=self.warga, opsi_index=0)

    def test_results_hidden_for_warga_before_deadline(self):
        """PT-12: Hasil poll tersembunyi untuk warga sebelum deadline."""
        resp = auth_client(self.warga).get(f"/api/v1/polling/{self.active_poll.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsNone(resp.data["data"]["results"])
        self.assertIsNone(resp.data["data"]["totalVotes"])

    def test_results_visible_for_pengurus_before_deadline(self):
        """PT-13: Pengurus bisa lihat hasil poll sebelum deadline."""
        # Buat vote dulu
        Vote.objects.create(poll=self.active_poll, user=self.warga, opsi_index=1)
        resp = auth_client(self.pengurus).get(f"/api/v1/polling/{self.active_poll.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(resp.data["data"]["results"])
        self.assertIsNotNone(resp.data["data"]["totalVotes"])

    def test_results_visible_for_warga_after_deadline(self):
        """PT-14: Hasil poll visible untuk warga setelah deadline."""
        resp = auth_client(self.warga).get(f"/api/v1/polling/{self.expired_poll.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data["data"]["results"]
        self.assertIsNotNone(results)
        self.assertEqual(results["Opsi A"], 1)

    def test_has_voted_reflects_user_vote(self):
        """PT-17: hasVoted tercermin dengan benar."""
        # Warga belum vote pada active_poll
        resp = auth_client(self.warga).get(f"/api/v1/polling/{self.active_poll.id}/")
        self.assertFalse(resp.data["data"]["hasVoted"])
        # Warga sudah vote pada expired_poll
        resp = auth_client(self.warga).get(f"/api/v1/polling/{self.expired_poll.id}/")
        self.assertTrue(resp.data["data"]["hasVoted"])


class PollFilterTest(TestCase):
    def setUp(self):
        self.admin = make_user("admin@rt.com", "admin")
        self.active = make_poll(self.admin, deadline_days=5, pertanyaan="Poll Aktif")
        self.expired = make_expired_poll(self.admin, pertanyaan="Poll Expired")

    def test_filter_by_status_aktif(self):
        """PT-15: Filter by status=aktif hanya return poll yang masih aktif."""
        resp = auth_client(self.admin).get("/api/v1/polling/?status=aktif")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        names = [p["pertanyaan"] for p in resp.data["data"]]
        self.assertIn("Poll Aktif", names)
        self.assertNotIn("Poll Expired", names)

    def test_filter_by_status_expired(self):
        """PT-16: Filter by status=expired hanya return poll yang sudah berakhir."""
        resp = auth_client(self.admin).get("/api/v1/polling/?status=expired")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        names = [p["pertanyaan"] for p in resp.data["data"]]
        self.assertIn("Poll Expired", names)
        self.assertNotIn("Poll Aktif", names)
