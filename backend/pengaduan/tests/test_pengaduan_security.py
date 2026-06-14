"""
Security tests untuk Phase 7: Pengaduan Warga.
Sesuai task 7.15 & 7.16 di docs/07-TASK-BREAKDOWN.md.

Test IDs:
  PT-01: Semua user ter-auth bisa buat pengaduan
  PT-02: User tidak ter-auth tidak bisa buat pengaduan → 401
  PT-03: Warga hanya melihat pengaduan miliknya (list)
  PT-04: Non-owner tidak bisa akses pengaduan warga lain → 403
  PT-05: Pengurus bisa melihat semua pengaduan
  PT-06: Pengurus bisa update status pengaduan
  PT-07: Warga tidak bisa update status pengaduan → 403
  PT-08: Update status mengirim notifikasi ke pelapor
  PT-09: Upload foto valid (JPEG ≤ 5MB) diterima
  PT-10: Upload foto terlalu besar (> 5MB) ditolak → 400
  PT-11: Upload magic bytes mismatch ditolak → 400
  PT-12: Filter by status mengembalikan pengaduan yang tepat
  PT-13: Filter by kategori mengembalikan pengaduan yang tepat
  PT-14: GET /pengaduan/saya/ hanya return pengaduan sendiri
  PT-15: Audit log tercatat saat create pengaduan
  PT-16: Audit log tercatat saat update status
"""

import io
import struct

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from audit.models import AuditLog
from notifications.models import Notification
from pengaduan.models import Pengaduan


def make_user(email, role="warga", user_status="active"):
    """Helper: buat user aktif."""
    u = User.objects.create_user(
        email=email,
        username=email,
        password="TestPass123!",
        phone=f"08{email[:8].replace('@', '0').replace('.', '0')}",
        role=role,
        status=user_status,
    )
    return u


def auth_client(user):
    """Helper: return APIClient dengan JWT auth."""
    client = APIClient()
    token = RefreshToken.for_user(user).access_token
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


def make_jpeg_bytes(size_bytes=100):
    """Helper: buat fake valid JPEG bytes."""
    header = b"\xff\xd8\xff\xe0"
    return header + b"\x00" * (size_bytes - len(header))


def make_png_bytes():
    """Helper: buat fake valid PNG bytes."""
    return b"\x89PNG\r\n\x1a\n" + b"\x00" * 100


def make_invalid_bytes():
    """Helper: buat bytes yang tidak valid (bukan gambar)."""
    return b"PK\x03\x04" + b"\x00" * 100  # ZIP header


def make_upload_file(content, name="foto.jpg", content_type="image/jpeg"):
    """Helper: buat InMemoryUploadedFile-like object."""
    f = io.BytesIO(content)
    f.name = name
    f.content_type = content_type
    f.size = len(content)
    return f


class PengaduanCreateTest(TestCase):
    """PT-01, PT-02: Buat pengaduan."""

    def setUp(self):
        self.warga = make_user("warga@test.com", role="warga")
        self.pengurus = make_user("pengurus@test.com", role="pengurus")
        self.url = "/api/v1/pengaduan/"

    def test_authenticated_user_can_create_pengaduan(self):
        """PT-01: Semua user ter-auth bisa buat pengaduan."""
        client = auth_client(self.warga)
        data = {
            "judul": "Lampu jalan mati",
            "deskripsi": "Lampu jalan di depan rumah sudah 3 hari mati.",
            "kategori": "infrastruktur",
        }
        response = client.post(self.url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["data"]["status"], "diajukan")

    def test_pengurus_can_also_create_pengaduan(self):
        """PT-01b: Pengurus pun bisa buat pengaduan."""
        client = auth_client(self.pengurus)
        data = {
            "judul": "Saran perbaikan jalan",
            "deskripsi": "Jalan berlubang di blok B.",
            "kategori": "infrastruktur",
        }
        response = client.post(self.url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_unauthenticated_user_cannot_create_pengaduan(self):
        """PT-02: User tidak ter-auth tidak bisa buat pengaduan → 401."""
        client = APIClient()
        data = {
            "judul": "Tanpa login",
            "deskripsi": "Test pengaduan tanpa login.",
            "kategori": "lainnya",
        }
        response = client.post(self.url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PengaduanObjectPermissionTest(TestCase):
    """PT-03, PT-04, PT-05: Object-level permission."""

    def setUp(self):
        self.warga1 = make_user("warga1@test.com", role="warga")
        self.warga2 = make_user("warga2@test.com", role="warga")
        self.pengurus = make_user("pengurus@test.com", role="pengurus")
        self.admin = make_user("admin@test.com", role="admin")
        # Buat pengaduan milik warga1
        self.pengaduan = Pengaduan.objects.create(
            warga=self.warga1,
            judul="Pengaduan Warga 1",
            deskripsi="Deskripsi",
            kategori="lainnya",
        )
        self.detail_url = f"/api/v1/pengaduan/{self.pengaduan.id}/"
        self.list_url = "/api/v1/pengaduan/"

    def test_warga_only_sees_own_pengaduan_in_list(self):
        """PT-03: Warga hanya melihat pengaduan miliknya di list."""
        # Buat pengaduan lain milik warga2
        Pengaduan.objects.create(
            warga=self.warga2,
            judul="Pengaduan Warga 2",
            deskripsi="Lain-lain",
            kategori="lainnya",
        )
        client = auth_client(self.warga1)
        response = client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [p["id"] for p in response.data["data"]]
        self.assertIn(str(self.pengaduan.id), ids)
        # Pastikan tidak ada pengaduan warga2
        pengaduan_warga2 = Pengaduan.objects.filter(warga=self.warga2).first()
        if pengaduan_warga2:
            self.assertNotIn(str(pengaduan_warga2.id), ids)

    def test_non_owner_cannot_access_other_pengaduan(self):
        """PT-04: Non-owner tidak bisa akses pengaduan warga lain → 403."""
        client = auth_client(self.warga2)
        response = client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_pengurus_can_see_all_pengaduan_in_list(self):
        """PT-05: Pengurus bisa melihat semua pengaduan."""
        Pengaduan.objects.create(
            warga=self.warga2,
            judul="Pengaduan Warga 2",
            deskripsi="Masalah lain",
            kategori="keamanan",
        )
        client = auth_client(self.pengurus)
        response = client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["pagination"]["total"], 2)

    def test_admin_can_access_any_pengaduan(self):
        """Admin bisa akses pengaduan siapa pun."""
        client = auth_client(self.admin)
        response = client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PengaduanStatusUpdateTest(TestCase):
    """PT-06, PT-07, PT-08: Update status pengaduan."""

    def setUp(self):
        self.warga = make_user("warga@test.com", role="warga")
        self.pengurus = make_user("pengurus@test.com", role="pengurus")
        self.pengaduan = Pengaduan.objects.create(
            warga=self.warga,
            judul="Lampu mati",
            deskripsi="Sudah 3 hari",
            kategori="infrastruktur",
        )
        self.status_url = f"/api/v1/pengaduan/{self.pengaduan.id}/status/"

    def test_pengurus_can_update_status(self):
        """PT-06: Pengurus bisa update status pengaduan."""
        client = auth_client(self.pengurus)
        data = {"status": "diproses", "keterangan": "Sudah ditugaskan ke tim."}
        response = client.put(self.status_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["status"], "diproses")
        # Cek DB tersimpan
        self.pengaduan.refresh_from_db()
        self.assertEqual(self.pengaduan.status, "diproses")

    def test_warga_cannot_update_status(self):
        """PT-07: Warga tidak bisa update status → 403."""
        client = auth_client(self.warga)
        data = {"status": "selesai"}
        response = client.put(self.status_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_status_update_sends_notification_to_pelapor(self):
        """PT-08: Update status mengirim notifikasi ke pelapor."""
        initial_notif_count = Notification.objects.filter(user=self.warga).count()
        client = auth_client(self.pengurus)
        data = {"status": "selesai", "keterangan": "Sudah diperbaiki."}
        response = client.put(self.status_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Notifikasi baru harus bertambah
        new_count = Notification.objects.filter(user=self.warga).count()
        self.assertEqual(new_count, initial_notif_count + 1)

    def test_status_history_is_appended(self):
        """Status history ditambahkan saat status diperbarui."""
        # Buat pengaduan via API agar status_history diinisialisasi dengan entry 'diajukan'
        warga_client = auth_client(self.warga)
        create_resp = warga_client.post("/api/v1/pengaduan/", {
            "judul": "History test",
            "deskripsi": "Deskripsi history test",
            "kategori": "lainnya",
        }, format="multipart")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        pengaduan_id = create_resp.data["data"]["id"]

        client = auth_client(self.pengurus)
        client.put(f"/api/v1/pengaduan/{pengaduan_id}/status/", {"status": "diproses", "keterangan": "Step 1"}, format="json")
        client.put(f"/api/v1/pengaduan/{pengaduan_id}/status/", {"status": "selesai", "keterangan": "Step 2"}, format="json")

        from pengaduan.models import Pengaduan as PengaduanModel
        p = PengaduanModel.objects.get(id=pengaduan_id)
        # Entry awal (diajukan saat create) + 2 update = 3
        self.assertEqual(len(p.status_history), 3)
        self.assertEqual(p.status_history[-1]["status"], "selesai")


class PengaduanFileUploadTest(TestCase):
    """PT-09, PT-10, PT-11: Validasi upload foto."""

    def setUp(self):
        self.warga = make_user("warga@test.com", role="warga")
        self.url = "/api/v1/pengaduan/"

    def test_valid_jpeg_upload_accepted(self):
        """PT-09: Upload foto valid JPEG diterima."""
        client = auth_client(self.warga)
        foto = make_upload_file(make_jpeg_bytes(1000), "foto.jpg", "image/jpeg")
        data = {
            "judul": "Test upload",
            "deskripsi": "Deskripsi",
            "kategori": "lainnya",
            "foto": foto,
        }
        response = client.post(self.url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_valid_png_upload_accepted(self):
        """PT-09b: Upload foto valid PNG diterima."""
        client = auth_client(self.warga)
        foto = make_upload_file(make_png_bytes(), "foto.png", "image/png")
        data = {
            "judul": "Test upload PNG",
            "deskripsi": "Deskripsi",
            "kategori": "lainnya",
            "foto": foto,
        }
        response = client.post(self.url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_file_too_large_rejected(self):
        """PT-10: File > 5MB ditolak → 400."""
        client = auth_client(self.warga)
        large_content = make_jpeg_bytes(1000) + b"\x00" * (6 * 1024 * 1024)
        foto = make_upload_file(large_content, "besar.jpg", "image/jpeg")
        data = {
            "judul": "Test terlalu besar",
            "deskripsi": "Deskripsi",
            "kategori": "lainnya",
            "foto": foto,
        }
        response = client.post(self.url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_extension_rejected(self):
        """PT-10b: Ekstensi tidak valid (PDF) ditolak → 400."""
        client = auth_client(self.warga)
        foto = make_upload_file(b"%PDF-1.4\x00" * 10, "file.pdf", "application/pdf")
        data = {
            "judul": "Test PDF",
            "deskripsi": "Deskripsi",
            "kategori": "lainnya",
            "foto": foto,
        }
        response = client.post(self.url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_magic_bytes_mismatch_rejected(self):
        """PT-11: File dengan magic bytes tidak valid ditolak → 400."""
        client = auth_client(self.warga)
        # File dengan nama .jpg tapi isi binary invalid
        foto = make_upload_file(make_invalid_bytes(), "fake.jpg", "image/jpeg")
        data = {
            "judul": "Test magic bytes",
            "deskripsi": "Deskripsi",
            "kategori": "lainnya",
            "foto": foto,
        }
        response = client.post(self.url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PengaduanFilterTest(TestCase):
    """PT-12, PT-13: Filter by status dan kategori."""

    def setUp(self):
        self.pengurus = make_user("pengurus@test.com", role="pengurus")
        self.warga = make_user("warga@test.com", role="warga")
        # Buat beberapa pengaduan dengan status & kategori berbeda
        Pengaduan.objects.create(
            warga=self.warga, judul="A", deskripsi="D", kategori="infrastruktur",
            status="diajukan"
        )
        Pengaduan.objects.create(
            warga=self.warga, judul="B", deskripsi="D", kategori="keamanan",
            status="diproses"
        )
        Pengaduan.objects.create(
            warga=self.warga, judul="C", deskripsi="D", kategori="infrastruktur",
            status="selesai"
        )
        self.url = "/api/v1/pengaduan/"

    def test_filter_by_status(self):
        """PT-12: Filter by status mengembalikan pengaduan yang tepat."""
        client = auth_client(self.pengurus)
        response = client.get(self.url + "?status=diproses")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["pagination"]["total"], 1)
        self.assertEqual(response.data["data"][0]["status"], "diproses")

    def test_filter_by_kategori(self):
        """PT-13: Filter by kategori mengembalikan pengaduan yang tepat."""
        client = auth_client(self.pengurus)
        response = client.get(self.url + "?kategori=infrastruktur")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["pagination"]["total"], 2)
        for p in response.data["data"]:
            self.assertEqual(p["kategori"], "infrastruktur")

    def test_filter_combined(self):
        """Filter gabungan status + kategori."""
        client = auth_client(self.pengurus)
        response = client.get(self.url + "?status=selesai&kategori=infrastruktur")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["pagination"]["total"], 1)


class PengaduanSayaTest(TestCase):
    """PT-14: GET /pengaduan/saya/ hanya return pengaduan sendiri."""

    def setUp(self):
        self.warga1 = make_user("warga1@test.com", role="warga")
        self.warga2 = make_user("warga2@test.com", role="warga")
        Pengaduan.objects.create(
            warga=self.warga1, judul="Milik Warga1", deskripsi="D", kategori="lainnya"
        )
        Pengaduan.objects.create(
            warga=self.warga2, judul="Milik Warga2", deskripsi="D", kategori="lainnya"
        )
        self.url = "/api/v1/pengaduan/saya/"

    def test_saya_returns_only_own_pengaduan(self):
        """PT-14: /pengaduan/saya/ hanya return pengaduan milik user sendiri."""
        client = auth_client(self.warga1)
        response = client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["pagination"]["total"], 1)
        self.assertEqual(response.data["data"][0]["judul"], "Milik Warga1")

    def test_unauthenticated_cannot_access_saya(self):
        """Tanpa login, /pengaduan/saya/ → 401."""
        client = APIClient()
        response = client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PengaduanAuditLogTest(TestCase):
    """PT-15, PT-16: Audit log tercatat."""

    def setUp(self):
        self.warga = make_user("warga@test.com", role="warga")
        self.pengurus = make_user("pengurus@test.com", role="pengurus")

    def test_audit_log_created_on_pengaduan_create(self):
        """PT-15: Audit log tercatat saat create pengaduan."""
        before = AuditLog.objects.filter(table_name="pengaduan", action="create").count()
        client = auth_client(self.warga)
        client.post("/api/v1/pengaduan/", {
            "judul": "Audit test",
            "deskripsi": "Deskripsi",
            "kategori": "lainnya",
        }, format="multipart")
        after = AuditLog.objects.filter(table_name="pengaduan", action="create").count()
        self.assertEqual(after, before + 1)

    def test_audit_log_created_on_status_update(self):
        """PT-16: Audit log tercatat saat update status."""
        pengaduan = Pengaduan.objects.create(
            warga=self.warga,
            judul="Audit status test",
            deskripsi="D",
            kategori="lainnya",
        )
        before = AuditLog.objects.filter(table_name="pengaduan", action="update").count()
        client = auth_client(self.pengurus)
        client.put(
            f"/api/v1/pengaduan/{pengaduan.id}/status/",
            {"status": "diproses", "keterangan": "Diproses"},
            format="json",
        )
        after = AuditLog.objects.filter(table_name="pengaduan", action="update").count()
        self.assertEqual(after, before + 1)
