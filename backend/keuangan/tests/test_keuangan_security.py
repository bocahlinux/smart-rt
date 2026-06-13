"""Security tests Phase 4: Keuangan RT.

Lihat docs/07-TASK-BREAKDOWN.md §4.19-4.21 dan docs/11-SECURITY.md.

Test coverage:
  KT-01  Warga tidak bisa akses list iuran semua warga → 403
  KT-02  Warga bisa akses riwayat iuran sendiri → 200
  KT-03  Warga tidak bisa akses detail iuran warga lain → 403
  KT-04  Warga bisa akses detail iuran sendiri → 200
  KT-05  Warga upload iuran untuk diri sendiri → 201
  KT-06  Warga tidak bisa upload iuran dengan warga_id orang lain → 403
  KT-07  Upload file dengan tipe tidak valid → 400
  KT-08  Upload file dengan ekstensi tidak valid → 400
  KT-09  Upload file melebihi ukuran 5MB → 400
  KT-10  Bendahara bisa konfirmasi iuran → 200
  KT-11  Bendahara bisa tolak iuran → 200
  KT-12  Warga tidak bisa konfirmasi iuran → 403
  KT-13  Audit log dibuat saat bendahara konfirmasi iuran
  KT-14  Audit log dibuat saat bendahara tolak iuran
  KT-15  Audit log dibuat saat warga upload iuran
  KT-16  Bendahara tidak bisa CRUD warga → 403
  KT-17  Bendahara bisa akses list transaksi → 200
  KT-18  Warga tidak bisa akses list transaksi → 403
  KT-19  Hanya admin yang bisa hapus transaksi → 403 untuk bendahara
  KT-20  Bendahara bisa buat transaksi → 201
  KT-21  Bendahara bisa akses dashboard keuangan → 200
  KT-22  Warga tidak bisa akses dashboard keuangan → 403
  KT-23  Upload file dengan MIME mismatch (magic bytes invalid) → 400
"""

import io

from django.core.files.uploadedfile import InMemoryUploadedFile, SimpleUploadedFile
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, WargaProfile
from audit.models import AuditLog
from keuangan.models import IuranWarga, KategoriTransaksi, Transaksi


# ──────────────────────────── helpers ────────────────────────────

def _make_user(email, role=User.Role.WARGA, user_status=User.Status.ACTIVE):
    return User.objects.create_user(
        username=email,
        email=email,
        phone=f"08{email[:12].replace('@', '').replace('.', '')[:10]}",
        password="Test1234!",
        role=role,
        status=user_status,
    )


def _auth(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


def _make_profile(user, nik=None, blok="A", no_rumah="1", no_kk="1111111111111111"):
    return WargaProfile.objects.create(
        user=user,
        nik=nik,
        nama_lengkap=f"Test {user.email}",
        blok=blok,
        no_rumah=no_rumah,
        no_kk=no_kk,
        alamat="Jl. Test No. 1",
    )


def _make_kategori(nama="Iuran Bulanan", tipe="pemasukan"):
    return KategoriTransaksi.objects.create(nama=nama, tipe=tipe)


def _make_iuran(warga, bulan=1, tahun=2026, jumlah=50000, status=IuranWarga.Status.PENDING):
    return IuranWarga.objects.create(
        warga=warga,
        bulan=bulan,
        tahun=tahun,
        jumlah=jumlah,
        status=status,
    )


def _jpeg_file(name="test.jpg", size=1024):
    """Fake JPEG dengan magic bytes yang benar."""
    content = b"\xff\xd8\xff\xe0" + b"\x00" * (size - 4)
    return InMemoryUploadedFile(
        io.BytesIO(content), "bukti_transfer", name, "image/jpeg", size, None
    )


def _oversized_jpeg():
    """Fake JPEG > 5MB untuk test ukuran."""
    size = 5 * 1024 * 1024 + 1
    content = b"\xff\xd8\xff\xe0" + b"\x00" * (size - 4)
    return InMemoryUploadedFile(
        io.BytesIO(content), "bukti_transfer", "big.jpg", "image/jpeg", size, None
    )


IURAN_UPLOAD_URL = "/api/v1/iuran/upload/"
IURAN_LIST_URL = "/api/v1/iuran/"
IURAN_SAYA_URL = "/api/v1/iuran/saya/"
TRANSAKSI_URL = "/api/v1/keuangan/"
DASHBOARD_URL = "/api/v1/keuangan/dashboard/"
WARGA_URL = "/api/v1/warga/"


# ──────────────────────────── tests ────────────────────────────

class IuranObjectPermissionTest(TestCase):
    """KT-01 s/d KT-06 — Object-level permission iuran warga."""

    def setUp(self):
        self.warga_a = _make_user("warga_a@keu.test")
        self.warga_b = _make_user("warga_b@keu.test")
        self.bendahara = _make_user("bendahara@keu.test", role=User.Role.BENDAHARA)
        self.profile_a = _make_profile(self.warga_a, nik="1111111111111111", no_kk="1111111111111111")
        self.profile_b = _make_profile(self.warga_b, nik="2222222222222222", no_kk="2222222222222222", no_rumah="2")
        self.iuran_a = _make_iuran(self.profile_a)

    def test_kt01_warga_cannot_list_all_iuran(self):
        """KT-01: Warga tidak bisa akses list semua iuran → 403."""
        client = _auth(self.warga_a)
        resp = client.get(IURAN_LIST_URL)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_kt02_warga_can_access_own_riwayat(self):
        """KT-02: Warga bisa akses riwayat iuran sendiri → 200."""
        client = _auth(self.warga_a)
        resp = client.get(IURAN_SAYA_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in resp.data["data"]]
        self.assertIn(str(self.iuran_a.id), ids)

    def test_kt03_warga_cannot_access_other_warga_iuran_detail(self):
        """KT-03: Warga tidak bisa akses detail iuran warga lain → 403."""
        client = _auth(self.warga_b)
        resp = client.get(f"/api/v1/iuran/{self.iuran_a.id}/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_kt04_warga_can_access_own_iuran_detail(self):
        """KT-04: Warga bisa akses detail iuran sendiri → 200."""
        client = _auth(self.warga_a)
        resp = client.get(f"/api/v1/iuran/{self.iuran_a.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_kt05_warga_can_upload_own_iuran(self):
        """KT-05: Warga upload iuran untuk diri sendiri → 201."""
        client = _auth(self.warga_a)
        resp = client.post(IURAN_UPLOAD_URL, {
            "wargaId": str(self.profile_a.id),
            "bulan": 2,
            "tahun": 2026,
            "jumlah": 50000,
            "bukti_transfer": _jpeg_file(),
        }, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["data"]["status"], "pending")

    def test_kt06_warga_cannot_upload_iuran_for_other(self):
        """KT-06: Warga tidak bisa upload iuran dengan warga_id orang lain → 403."""
        client = _auth(self.warga_a)
        resp = client.post(IURAN_UPLOAD_URL, {
            "wargaId": str(self.profile_b.id),
            "bulan": 3,
            "tahun": 2026,
            "jumlah": 50000,
            "bukti_transfer": _jpeg_file(),
        }, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class FileUploadSecurityTest(TestCase):
    """KT-07 s/d KT-09, KT-23 — Validasi file upload bukti transfer."""

    def setUp(self):
        self.warga = _make_user("warga_file@keu.test")
        self.profile = _make_profile(self.warga, nik="3333333333333333", no_kk="3333333333333333")

    def test_kt07_invalid_mime_type_rejected(self):
        """KT-07: Upload file dengan ekstensi .exe (MIME terlarang) → 400."""
        client = _auth(self.warga)
        content = b"MZ\x90\x00" + b"\x00" * 100
        f = InMemoryUploadedFile(
            io.BytesIO(content), "bukti_transfer", "virus.exe", "application/octet-stream", len(content), None
        )
        resp = client.post(IURAN_UPLOAD_URL, {
            "wargaId": str(self.profile.id),
            "bulan": 4,
            "tahun": 2026,
            "jumlah": 50000,
            "bukti_transfer": f,
        }, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_kt07b_disallowed_extension_rejected(self):
        """KT-07b: Upload file .bat → 400."""
        client = _auth(self.warga)
        content = b"@echo off"
        f = InMemoryUploadedFile(
            io.BytesIO(content), "bukti_transfer", "run.bat", "text/plain", len(content), None
        )
        resp = client.post(IURAN_UPLOAD_URL, {
            "wargaId": str(self.profile.id),
            "bulan": 5,
            "tahun": 2026,
            "jumlah": 50000,
            "bukti_transfer": f,
        }, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_kt08_invalid_extension_rejected(self):
        """KT-08: Upload file .txt → 400."""
        client = _auth(self.warga)
        content = b"Hello world"
        f = InMemoryUploadedFile(
            io.BytesIO(content), "bukti_transfer", "catatan.txt", "text/plain", len(content), None
        )
        resp = client.post(IURAN_UPLOAD_URL, {
            "wargaId": str(self.profile.id),
            "bulan": 6,
            "tahun": 2026,
            "jumlah": 50000,
            "bukti_transfer": f,
        }, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_kt09_oversized_file_rejected(self):
        """KT-09: Upload file > 5MB → 400."""
        client = _auth(self.warga)
        f = _oversized_jpeg()
        resp = client.post(IURAN_UPLOAD_URL, {
            "wargaId": str(self.profile.id),
            "bulan": 7,
            "tahun": 2026,
            "jumlah": 50000,
            "bukti_transfer": f,
        }, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_kt23_magic_bytes_mismatch_rejected(self):
        """KT-23: File dengan magic bytes ZIP tapi ekstensi .jpg → 400."""
        client = _auth(self.warga)
        # PK\x03\x04 = ZIP magic bytes, bukan JPEG/PNG/PDF/WebP
        content = b"PK\x03\x04" + b"\x00" * 100
        f = InMemoryUploadedFile(
            io.BytesIO(content), "bukti_transfer", "zip_disguised.jpg", "image/jpeg", len(content), None
        )
        resp = client.post(IURAN_UPLOAD_URL, {
            "wargaId": str(self.profile.id),
            "bulan": 8,
            "tahun": 2026,
            "jumlah": 50000,
            "bukti_transfer": f,
        }, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class IuranKonfirmasiTest(TestCase):
    """KT-10 s/d KT-12 — Konfirmasi/tolak iuran."""

    def setUp(self):
        self.bendahara = _make_user("bendahara2@keu.test", role=User.Role.BENDAHARA)
        self.warga = _make_user("warga2@keu.test")
        self.profile = _make_profile(self.warga, nik="4444444444444444", no_kk="4444444444444444")
        self.iuran = _make_iuran(self.profile, bulan=1, tahun=2025)

    def test_kt10_bendahara_can_confirm_iuran(self):
        """KT-10: Bendahara bisa konfirmasi iuran → 200."""
        client = _auth(self.bendahara)
        resp = client.put(
            f"/api/v1/iuran/{self.iuran.id}/confirm/",
            {"status": "lunas", "keterangan": "OK"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.iuran.refresh_from_db()
        self.assertEqual(self.iuran.status, IuranWarga.Status.LUNAS)
        self.assertEqual(self.iuran.confirmed_by, self.bendahara)

    def test_kt11_bendahara_can_reject_iuran(self):
        """KT-11: Bendahara bisa tolak iuran → 200."""
        client = _auth(self.bendahara)
        resp = client.put(
            f"/api/v1/iuran/{self.iuran.id}/confirm/",
            {"status": "ditolak", "keterangan": "Bukti tidak jelas"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.iuran.refresh_from_db()
        self.assertEqual(self.iuran.status, IuranWarga.Status.DITOLAK)

    def test_kt12_warga_cannot_confirm_iuran(self):
        """KT-12: Warga tidak bisa konfirmasi iuran → 403."""
        client = _auth(self.warga)
        resp = client.put(
            f"/api/v1/iuran/{self.iuran.id}/confirm/",
            {"status": "lunas"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class AuditLogKeuanganTest(TestCase):
    """KT-13 s/d KT-15 — Audit log untuk operasi keuangan."""

    def setUp(self):
        self.bendahara = _make_user("bendahara3@keu.test", role=User.Role.BENDAHARA)
        self.warga = _make_user("warga3@keu.test")
        self.profile = _make_profile(self.warga, nik="5555555555555555", no_kk="5555555555555555")
        self.iuran = _make_iuran(self.profile, bulan=2, tahun=2025)

    def test_kt13_audit_log_created_on_confirm(self):
        """KT-13: Audit log dibuat saat bendahara konfirmasi iuran."""
        client = _auth(self.bendahara)
        client.put(
            f"/api/v1/iuran/{self.iuran.id}/confirm/",
            {"status": "lunas"},
            format="json",
        )
        log = AuditLog.objects.filter(
            user=self.bendahara,
            table_name="iuran_warga",
            record_id=str(self.iuran.id),
            action="confirm",
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.new_data["status"], "lunas")

    def test_kt14_audit_log_created_on_reject(self):
        """KT-14: Audit log dibuat saat bendahara tolak iuran."""
        client = _auth(self.bendahara)
        client.put(
            f"/api/v1/iuran/{self.iuran.id}/confirm/",
            {"status": "ditolak", "keterangan": "Bukti buram"},
            format="json",
        )
        log = AuditLog.objects.filter(
            user=self.bendahara,
            table_name="iuran_warga",
            action="reject",
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.new_data["status"], "ditolak")

    def test_kt15_audit_log_created_on_iuran_upload(self):
        """KT-15: Audit log dibuat saat warga upload iuran."""
        client = _auth(self.warga)
        client.post(IURAN_UPLOAD_URL, {
            "wargaId": str(self.profile.id),
            "bulan": 3,
            "tahun": 2025,
            "jumlah": 50000,
            "bukti_transfer": _jpeg_file(),
        }, format="multipart")
        log = AuditLog.objects.filter(
            user=self.warga,
            table_name="iuran_warga",
            action="create",
        ).first()
        self.assertIsNotNone(log)


class BendaharaAccessControlTest(TestCase):
    """KT-16 s/d KT-22 — Kontrol akses Bendahara."""

    def setUp(self):
        self.admin = _make_user("admin@keu.test", role=User.Role.ADMIN)
        self.bendahara = _make_user("bendahara4@keu.test", role=User.Role.BENDAHARA)
        self.warga = _make_user("warga4@keu.test")
        self.profile_w = _make_profile(self.warga, nik="6666666666666666", no_kk="6666666666666666")
        self.kategori = _make_kategori()

    def test_kt16_bendahara_cannot_crud_warga(self):
        """KT-16: Bendahara tidak bisa CRUD warga → 403."""
        client = _auth(self.bendahara)
        # POST /warga/ — create warga
        resp = client.post(WARGA_URL, {
            "namaLengkap": "Test Warga",
            "blok": "B",
            "noRumah": "10",
            "noKk": "9999999999999999",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_kt17_bendahara_can_list_transaksi(self):
        """KT-17: Bendahara bisa akses list transaksi → 200."""
        client = _auth(self.bendahara)
        resp = client.get(TRANSAKSI_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_kt18_warga_cannot_access_transaksi(self):
        """KT-18: Warga tidak bisa akses list transaksi → 403."""
        client = _auth(self.warga)
        resp = client.get(TRANSAKSI_URL)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_kt19_bendahara_cannot_delete_transaksi(self):
        """KT-19: Bendahara tidak bisa hapus transaksi (hanya admin) → 403."""
        transaksi = Transaksi.objects.create(
            kategori=self.kategori,
            jumlah=100000,
            keterangan="Test",
            tanggal="2026-01-15",
            tipe="pemasukan",
            created_by=self.bendahara,
        )
        client = _auth(self.bendahara)
        resp = client.delete(f"/api/v1/keuangan/{transaksi.id}/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_kt20_bendahara_can_create_transaksi(self):
        """KT-20: Bendahara bisa buat transaksi → 201."""
        client = _auth(self.bendahara)
        resp = client.post(TRANSAKSI_URL, {
            "kategoriId": str(self.kategori.id),
            "jumlah": 100000,
            "keterangan": "Iuran bulan Juni",
            "tanggal": "2026-06-01",
            "tipe": "pemasukan",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        log = AuditLog.objects.filter(
            user=self.bendahara,
            table_name="transaksi",
            action="create",
        ).first()
        self.assertIsNotNone(log)

    def test_kt21_bendahara_can_access_dashboard(self):
        """KT-21: Bendahara bisa akses dashboard keuangan → 200."""
        client = _auth(self.bendahara)
        resp = client.get(DASHBOARD_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("saldo", resp.data["data"])

    def test_kt22_warga_cannot_access_dashboard(self):
        """KT-22: Warga tidak bisa akses dashboard keuangan → 403."""
        client = _auth(self.warga)
        resp = client.get(DASHBOARD_URL)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
