"""Security tests Phase 5: Pengumuman & Notifikasi.

Lihat docs/07-TASK-BREAKDOWN.md §5.11 dan docs/11-SECURITY.md.

Test coverage:
  PT-01  Warga tidak bisa buat pengumuman → 403
  PT-02  Warga tidak bisa update pengumuman → 403
  PT-03  Warga tidak bisa hapus pengumuman → 403
  PT-04  Pengurus bisa buat pengumuman → 201
  PT-05  Pengurus bisa update pengumuman → 200
  PT-06  Pengurus bisa hapus pengumuman → 200
  PT-07  Admin bisa buat pengumuman → 201
  PT-08  Warga bisa lihat list pengumuman yang published → 200
  PT-09  Warga tidak bisa lihat pengumuman yang belum published (scheduled future)
  PT-10  Upload gambar dengan tipe tidak valid → 400
  PT-11  Upload gambar melebihi 5MB → 400
  PT-12  Upload gambar dengan magic bytes invalid → 400
  PT-13  Sekretaris bisa buat pengumuman → 201
  PT-14  Notifikasi dibuat otomatis saat pengumuman dibuat
  PT-15  Warga hanya bisa baca notifikasi miliknya → 200
  PT-16  Warga tidak bisa tandai notifikasi orang lain sebagai dibaca → 404
  PT-17  Mark all read hanya afektif ke notifikasi milik user login
"""

import io
from datetime import timedelta

from django.core.files.uploadedfile import InMemoryUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from notifications.models import Notification
from pengumuman.models import Pengumuman


# ──────────────────────────── helpers ────────────────────────────

def _make_user(email, role=User.Role.WARGA):
    return User.objects.create_user(
        username=email,
        email=email,
        phone=f"08{email[:12].replace('@', '').replace('.', '')[:10]}",
        password="Test1234!",
        role=role,
    )


def _auth(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


def _jpeg_file(name="foto.jpg", size=1024):
    content = b"\xff\xd8\xff\xe0" + b"\x00" * (size - 4)
    buf = io.BytesIO(content)
    return InMemoryUploadedFile(buf, "gambar", name, "image/jpeg", size, None)


def _png_file(name="foto.png", size=1024):
    content = b"\x89PNG\r\n\x1a\n" + b"\x00" * (size - 8)
    buf = io.BytesIO(content)
    return InMemoryUploadedFile(buf, "gambar", name, "image/png", size, None)


def _bad_file(name="foto.jpg"):
    content = b"NOTANIMAGE" + b"\x00" * 20
    buf = io.BytesIO(content)
    return InMemoryUploadedFile(buf, "gambar", name, "image/jpeg", len(content), None)


def _oversized_jpeg(name="big.jpg"):
    size = 5 * 1024 * 1024 + 1
    content = b"\xff\xd8\xff\xe0" + b"\x00" * (size - 4)
    buf = io.BytesIO(content)
    return InMemoryUploadedFile(buf, "gambar", name, "image/jpeg", size, None)


def _create_pengumuman(creator, judul="Test Pengumuman", is_published=True, scheduled_at=None):
    return Pengumuman.objects.create(
        judul=judul,
        isi="Isi pengumuman test.",
        kategori="info",
        is_published=is_published,
        created_by=creator,
        scheduled_at=scheduled_at,
    )


# ──────────────────────────── test classes ────────────────────────────

class WargaCannotWritePengumuman(TestCase):
    """PT-01 / PT-02 / PT-03: Warga tidak bisa create/update/delete pengumuman."""

    def setUp(self):
        self.warga = _make_user("warga@test.com", User.Role.WARGA)
        self.pengurus = _make_user("pengurus@test.com", User.Role.PENGURUS)
        self.client_warga = _auth(self.warga)
        self.pengumuman = _create_pengumuman(self.pengurus)

    def test_warga_cannot_create_pengumuman(self):
        """PT-01"""
        resp = self.client_warga.post(
            "/api/v1/pengumuman/",
            data={"judul": "Hacked", "isi": "Injected", "kategori": "info"},
            format="multipart",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_warga_cannot_update_pengumuman(self):
        """PT-02"""
        resp = self.client_warga.put(
            f"/api/v1/pengumuman/{self.pengumuman.id}/",
            data={"judul": "Hacked"},
            format="multipart",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_warga_cannot_delete_pengumuman(self):
        """PT-03"""
        resp = self.client_warga.delete(f"/api/v1/pengumuman/{self.pengumuman.id}/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class PengurusCRUDPengumuman(TestCase):
    """PT-04 / PT-05 / PT-06: Pengurus boleh buat, update, hapus pengumuman."""

    def setUp(self):
        self.pengurus = _make_user("pengurus2@test.com", User.Role.PENGURUS)
        self.client = _auth(self.pengurus)

    def test_pengurus_can_create_pengumuman(self):
        """PT-04"""
        resp = self.client.post(
            "/api/v1/pengumuman/",
            data={"judul": "Kerja Bakti", "isi": "Dimohon hadir.", "kategori": "acara"},
            format="multipart",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_pengurus_can_update_pengumuman(self):
        """PT-05"""
        p = _create_pengumuman(self.pengurus, "Old Title")
        resp = self.client.put(
            f"/api/v1/pengumuman/{p.id}/",
            data={"judul": "New Title"},
            format="multipart",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        p.refresh_from_db()
        self.assertEqual(p.judul, "New Title")

    def test_pengurus_can_delete_pengumuman(self):
        """PT-06"""
        p = _create_pengumuman(self.pengurus)
        resp = self.client.delete(f"/api/v1/pengumuman/{p.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(Pengumuman.objects.filter(pk=p.pk).exists())


class AdminCRUDPengumuman(TestCase):
    """PT-07: Admin boleh buat pengumuman."""

    def setUp(self):
        self.admin = _make_user("admin@test.com", User.Role.ADMIN)
        self.client = _auth(self.admin)

    def test_admin_can_create_pengumuman(self):
        """PT-07"""
        resp = self.client.post(
            "/api/v1/pengumuman/",
            data={"judul": "Info Penting", "isi": "Isi.", "kategori": "penting"},
            format="multipart",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class WargaReadPengumuman(TestCase):
    """PT-08 / PT-09: Warga bisa lihat yang published, tidak bisa lihat yang belum published."""

    def setUp(self):
        self.pengurus = _make_user("pengurus3@test.com", User.Role.PENGURUS)
        self.warga = _make_user("warga2@test.com", User.Role.WARGA)
        self.client = _auth(self.warga)

    def test_warga_can_list_published(self):
        """PT-08"""
        _create_pengumuman(self.pengurus, "Published")
        resp = self.client.get("/api/v1/pengumuman/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_warga_cannot_see_future_scheduled(self):
        """PT-09: pengumuman dengan scheduled_at di masa depan tidak terlihat oleh warga."""
        future = timezone.now() + timedelta(days=1)
        p = _create_pengumuman(
            self.pengurus,
            "Secret Announcement",
            is_published=False,
            scheduled_at=future,
        )
        # List — tidak boleh muncul
        resp = self.client.get("/api/v1/pengumuman/")
        ids = [item["id"] for item in resp.data["data"]]
        self.assertNotIn(str(p.id), ids)

        # Detail — harus 404
        resp = self.client.get(f"/api/v1/pengumuman/{p.id}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class SekretarisCanCreatePengumuman(TestCase):
    """PT-13: Sekretaris boleh buat pengumuman."""

    def setUp(self):
        self.sek = _make_user("sek@test.com", User.Role.SEKRETARIS)
        self.client = _auth(self.sek)

    def test_sekretaris_can_create(self):
        """PT-13"""
        resp = self.client.post(
            "/api/v1/pengumuman/",
            data={"judul": "Info Warga", "isi": "Detail.", "kategori": "info"},
            format="multipart",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class GambarUploadSecurityTest(TestCase):
    """PT-10 / PT-11 / PT-12: Validasi file gambar."""

    def setUp(self):
        self.pengurus = _make_user("pengurus4@test.com", User.Role.PENGURUS)
        self.client = _auth(self.pengurus)

    def _post(self, file):
        return self.client.post(
            "/api/v1/pengumuman/",
            data={
                "judul": "Test Upload",
                "isi": "Isi.",
                "kategori": "info",
                "gambar": file,
            },
            format="multipart",
        )

    def test_invalid_extension_rejected(self):
        """PT-10: upload file dengan ekstensi tidak valid → 400"""
        content = b"\xff\xd8\xff\xe0" + b"\x00" * 20
        buf = io.BytesIO(content)
        bad_ext = InMemoryUploadedFile(buf, "gambar", "foto.exe", "image/jpeg", len(content), None)
        resp = self._post(bad_ext)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_oversized_file_rejected(self):
        """PT-11: upload file > 5MB → 400"""
        resp = self._post(_oversized_jpeg())
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_magic_bytes_rejected(self):
        """PT-12: upload file dengan magic bytes yang tidak valid → 400"""
        resp = self._post(_bad_file())
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_jpeg_accepted(self):
        """Upload JPEG valid → 201"""
        resp = self._post(_jpeg_file())
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_valid_png_accepted(self):
        """Upload PNG valid → 201"""
        resp = self._post(_png_file())
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class NotificationBroadcastTest(TestCase):
    """PT-14 / PT-15 / PT-16 / PT-17: Notifikasi otomatis dan akses kontrol."""

    def setUp(self):
        self.pengurus = _make_user("pengurus5@test.com", User.Role.PENGURUS)
        self.warga1 = _make_user("warga3@test.com", User.Role.WARGA)
        self.warga2 = _make_user("warga4@test.com", User.Role.WARGA)
        self.client_pengurus = _auth(self.pengurus)
        self.client_warga1 = _auth(self.warga1)
        self.client_warga2 = _auth(self.warga2)

    def test_notification_created_on_pengumuman_create(self):
        """PT-14: Notifikasi in-app dibuat untuk semua user aktif saat pengumuman dibuat."""
        count_before = Notification.objects.count()
        self.client_pengurus.post(
            "/api/v1/pengumuman/",
            data={"judul": "Broadcast", "isi": "Test.", "kategori": "info"},
            format="multipart",
        )
        count_after = Notification.objects.count()
        # Minimal ada notif untuk warga1, warga2, pengurus sendiri
        self.assertGreater(count_after, count_before)

    def test_warga_sees_own_notifications(self):
        """PT-15: Warga hanya dapat melihat notifikasi miliknya."""
        Notification.objects.create(
            user=self.warga1,
            judul="Untuk Warga1",
            isi="Isi.",
            tipe="info",
        )
        resp = self.client_warga1.get("/api/v1/notifications/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        for item in resp.data["data"]:
            # Semua notif yang dikembalikan harus milik warga1 — kita cek
            # dengan memverifikasi notif dari DB
            notif = Notification.objects.get(pk=item["id"])
            self.assertEqual(notif.user_id, self.warga1.id)

    def test_warga_cannot_mark_other_notif_as_read(self):
        """PT-16: Warga tidak bisa tandai notifikasi warga lain sebagai dibaca → 404."""
        notif = Notification.objects.create(
            user=self.warga2,
            judul="Milik Warga2",
            isi="Isi.",
            tipe="info",
        )
        resp = self.client_warga1.put(f"/api/v1/notifications/{notif.id}/read/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_read_only_affects_own(self):
        """PT-17: Mark-all-read hanya mengubah notifikasi milik user login."""
        Notification.objects.create(user=self.warga1, judul="W1", isi=".", tipe="info")
        notif_w2 = Notification.objects.create(user=self.warga2, judul="W2", isi=".", tipe="info")

        resp = self.client_warga1.put("/api/v1/notifications/read-all/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        notif_w2.refresh_from_db()
        self.assertFalse(notif_w2.is_read)
