# Smart-RT — API Contract

**Version:** 1.4.0
**Date:** June 14, 2026
**Base URL:** `/api/v1`
**Status:** Phase 3 Implemented

---

## 1. General

### 1.1 Base URL
```
Development: http://localhost:8000/api/v1
Production: https://smartrt.yourdomain.com/api/v1
```

### 1.2 Authentication

Semua endpoint protected memerlukan access token via header:
```http
Authorization: Bearer <access_token>
```

**Token Strategy:**
- **Access token:** Short-lived (15-30 menit). Disimpan di frontend memory/state (Zustand). Dikirim via `Authorization: Bearer` header.
- **Refresh token:** Long-lived (7-14 hari). Disimpan di httpOnly Secure SameSite cookie. **Dilarang** disimpan di localStorage.
- **Token rotation:** Setiap refresh menghasilkan access token + refresh token baru. Refresh token lama di-blacklist.
- **Logout:** Refresh token di-blacklist. Access token dihapus dari frontend state.

### 1.3 Standard Response Format

**Success:**
```json
{
  "status": "success",
  "data": { ... },
  "message": "Optional message"
}
```

**Success (Paginated):**
```json
{
  "status": "success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Email sudah terdaftar" }
  ]
}
```

### 1.4 HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK — Success |
| 201 | Created — Resource created |
| 400 | Bad Request — Validation error |
| 401 | Unauthorized — Invalid/missing token |
| 403 | Forbidden — Insufficient role |
| 404 | Not Found — Resource not found |
| 409 | Conflict — Duplicate data |
| 422 | Unprocessable — Business logic error |
| 429 | Too Many Requests — Rate limit |
| 500 | Internal Server Error |

### 1.5 Pagination
```
GET /resource?page=1&limit=20&sort=created_at&order=desc
```

### 1.6 Filter & Search
```
GET /warga?search=ahmad&status=aktif&blok=A
GET /transaksi?tipe=pemasukan&dari=2026-01-01&sampai=2026-06-30
```

### 1.7 Error Code Dictionary

Setiap response error **harus** menyertakan field `code` (machine-readable, UPPER_SNAKE_CASE dengan prefix modul) selain `message` (human-readable, Bahasa Indonesia). Frontend menggunakan `code` untuk logic (mis. redirect, retry, field highlight) dan `message`/i18n key untuk tampilan ke user.

**Format error response:**
```json
{
  "status": "error",
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Email atau password salah",
  "errors": [
    { "field": "password", "code": "FIELD_REQUIRED", "message": "Password wajib diisi" }
  ]
}
```

**Konvensi penamaan:** `<MODUL>_<KONDISI>`, semua huruf besar, pemisah underscore. Modul mengacu pada prefix FR di SRS (AUTH, WARGA, KEUANGAN, PENGUMUMAN, FORUM, PENGADUAN, KEGIATAN, POLLING, FILE, PERMISSION, VALIDATION, RATE_LIMIT).

| Code | HTTP Status | Arti |
|------|-------------|------|
| **AUTH_*** | | |
| `AUTH_INVALID_CREDENTIALS` | 401 | Email/password salah |
| `AUTH_ACCOUNT_NOT_VERIFIED` | 403 | Akun belum verifikasi email |
| `AUTH_ACCOUNT_LOCKED` | 423 | Akun terkunci karena terlalu banyak percobaan login |
| `AUTH_TOKEN_EXPIRED` | 401 | Access token kedaluwarsa |
| `AUTH_TOKEN_INVALID` | 401 | Token tidak valid / malformed |
| `AUTH_REFRESH_TOKEN_EXPIRED` | 401 | Refresh token kedaluwarsa, perlu login ulang |
| `AUTH_REFRESH_TOKEN_REUSED` | 401 | Terdeteksi reuse refresh token (potensi pencurian token), semua sesi di-revoke |
| `AUTH_EMAIL_ALREADY_REGISTERED` | 409 | Email sudah terdaftar |
| `AUTH_PASSWORD_TOO_WEAK` | 422 | Password tidak memenuhi kebijakan (min 8 karakter, huruf besar, kecil, angka) |
| **WARGA_*** | | |
| `WARGA_NOT_FOUND` | 404 | Data warga tidak ditemukan |
| `WARGA_NIK_DUPLICATE` | 409 | NIK sudah terdaftar |
| `WARGA_KK_DUPLICATE` | 409 | Nomor KK sudah terdaftar untuk kepala keluarga lain |
| `WARGA_NOT_VERIFIED` | 422 | Data warga belum diverifikasi pengurus |
| `WARGA_IMPORT_FORMAT_INVALID` | 422 | Format file import (Excel) tidak sesuai template |
| **KEUANGAN_*** | | |
| `KEUANGAN_DUPLICATE_IURAN` | 409 | Iuran untuk periode tersebut sudah dibayar/diajukan |
| `KEUANGAN_TRANSAKSI_LOCKED` | 422 | Transaksi sudah dikonfirmasi, tidak bisa diubah/dihapus |
| `KEUANGAN_SALDO_INSUFFICIENT` | 422 | Saldo tidak cukup untuk transaksi pengeluaran |
| **PENGUMUMAN_*** | | |
| `PENGUMUMAN_SCHEDULE_IN_PAST` | 422 | Jadwal publikasi tidak boleh di masa lalu |
| **FORUM_*** | | |
| `FORUM_THREAD_LOCKED` | 422 | Thread dikunci, tidak bisa menambah komentar |
| `FORUM_CONTENT_FLAGGED` | 422 | Konten terdeteksi melanggar aturan komunitas |
| **PENGADUAN_*** | | |
| `PENGADUAN_ALREADY_CLOSED` | 422 | Pengaduan sudah ditutup, tidak bisa diubah |
| **KEGIATAN_*** | | |
| `KEGIATAN_RSVP_CLOSED` | 422 | Periode RSVP sudah berakhir |
| `KEGIATAN_CAPACITY_FULL` | 422 | Kuota peserta kegiatan penuh |
| **POLLING_*** | | |
| `POLLING_ALREADY_VOTED` | 409 | Pengguna sudah memberikan suara pada polling ini |
| `POLLING_CLOSED` | 422 | Periode polling sudah berakhir |
| **FILE_*** | | |
| `FILE_TYPE_NOT_ALLOWED` | 422 | Tipe/ekstensi file tidak diizinkan |
| `FILE_TOO_LARGE` | 422 | Ukuran file melebihi batas maksimum (5MB) |
| `FILE_MIME_MISMATCH` | 422 | MIME type tidak sesuai isi file (gagal validasi magic bytes) |
| **PERMISSION_*** | | |
| `PERMISSION_DENIED` | 403 | Role tidak memiliki akses ke aksi/resource ini |
| `PERMISSION_DENIED_OBJECT_LEVEL` | 403 | Pengguna tidak memiliki akses ke objek spesifik ini (mis. data warga lain) |
| **VALIDATION_*** | | |
| `VALIDATION_ERROR` | 400 | Kesalahan validasi input umum (lihat array `errors`) |
| `FIELD_REQUIRED` | 400 | Field wajib diisi (digunakan di dalam array `errors`) |
| `FIELD_INVALID_FORMAT` | 400 | Format field tidak valid (mis. email, nomor telepon) |
| **RATE_LIMIT_*** | | |
| `RATE_LIMIT_EXCEEDED` | 429 | Terlalu banyak permintaan, coba lagi nanti |

> Catatan: Tabel ini adalah daftar awal dan **wajib diperluas** setiap kali endpoint baru ditambahkan. Setiap kode error baru harus didaftarkan di sini sebelum dipakai di kode (lihat 10-AI-RULES.md — dokumentasi & kode harus sinkron).

### 1.8 API Versioning Strategy

- **Skema versi:** URL path versioning — `/api/v1/...`, `/api/v2/...`. Versi mayor dinaikkan hanya untuk **breaking change** (mis. mengubah struktur response, menghapus/mengganti nama field, mengubah tipe data, mengubah alur autentikasi).
- **Non-breaking change** (menambah field baru yang opsional, menambah endpoint baru, menambah parameter query opsional) **tidak** memerlukan versi baru.
- **Kebijakan dukungan versi lama:** Versi API yang di-deprecate tetap didukung minimal **6 bulan** sejak versi baru dirilis, untuk memberi waktu klien (web, PWA, kemungkinan aplikasi mobile di masa depan) bermigrasi.
- **Pemberitahuan deprecation:**
  - Header response `Deprecation: true` dan `Sunset: <tanggal-berakhir-dukungan>` pada endpoint yang akan di-deprecate.
  - Pengumuman di `CHANGELOG.md` dan (jika relevan) banner di admin panel.
- **Dokumentasi:** Setiap rilis versi baru wajib memperbarui dokumen ini (06-API-CONTRACT.md) dengan tabel perbedaan ringkas antara versi lama dan baru.
- **Saat ini:** Proyek berada di `v1` — belum ada rencana `v2`. Bagian ini menjadi acuan jika/ketika kebutuhan versi baru muncul.

---

## 1.9 System Endpoints

### 1.9.1 Health Check
```
GET /healthz
```
**Auth:** Not required (public)
**Deskripsi:** Cek kesiapan service backend (dipakai oleh smoke test CI/CD — lihat 12-CICD.md §6 — dan monitoring uptime — lihat 13-MONITORING.md). Tidak melakukan query database; hanya menandakan proses Django sudah up dan menerima request.

**Response 200:**
```json
{ "status": "ok" }
```

---

## 2. Auth Endpoints

### 2.1 Register
```
POST /auth/register
```
**Body:**
```json
{
  "email": "ahmad@email.com",
  "phone": "081234567890",
  "password": "password123",
  "passwordConfirmation": "password123"
}
```
**Response 201:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "email": "ahmad@email.com",
    "phone": "081234567890",
    "role": "warga",
    "status": "pending"
  },
  "message": "Registrasi berhasil. Menunggu verifikasi pengurus."
}
```
**Errors:** 400 (validation), 409 (email/phone sudah terdaftar)

---

### 2.2 Login
```
POST /auth/login
```
**Body:**
```json
{
  "email": "ahmad@email.com",
  "password": "password123"
}
```
**Response 200:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "ahmad@email.com",
      "phone": "081234567890",
      "role": "warga",
      "status": "active"
    },
    "accessToken": "eyJhbG...NiIs...",
    "expiresIn": 1800
  }
}
```
**Cookies (httpOnly):**
```
Set-Cookie: refresh_token=eyJhbG...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=1209600
```
**Errors:** 401 (kredensial salah), 403 (akun belum diverifikasi/ditolak)

---

### 2.2.1 Refresh Token
```
POST /auth/token/refresh
```
**Auth:** Refresh token (httpOnly cookie, auto-sent by browser)
**Body:** (empty — refresh token dari cookie)
**Response 200:**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbG...new...",
    "expiresIn": 1800
  }
}
```
**Cookies (httpOnly):**
```
Set-Cookie: refresh_token=eyJhbG...new...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=1209600
```
**Errors:** 401 (refresh token invalid/expired)

**Note:** Refresh token di-rotate setiap request. Refresh token lama di-blacklist.

---

### 2.3 Logout
```
POST /auth/logout
```
**Auth:** Required (access token + refresh token cookie)
**Body:** (empty)
**Response 200:**
```json
{ "status": "success", "message": "Logout berhasil" }
```
**Effect:**
- Refresh token di-blacklist (ditambahkan ke OutstandingToken blacklist table).
- Access token dihapus dari frontend state.
- Cookie refresh_token dihapus (Set-Cookie dengan Max-Age=0).

---

### 2.5 Get Current User
```
GET /auth/me
```
**Auth:** Required
**Response 200:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "email": "ahmad@email.com",
    "phone": "081234567890",
    "role": "warga",
    "status": "active",
    "profile": {
      "namaLengkap": "Ahmad Fauzi",
      "foto": "https://..."
    }
  }
}
```

---

### 2.6 Change Password
```
PUT /auth/password
```
**Auth:** Required
**Body:**
```json
{
  "currentPassword": "lama123",
  "newPassword": "baru123",
  "newPasswordConfirmation": "baru123"
}
```
**Response 200:**
```json
{ "status": "success", "message": "Password berhasil diubah" }
```
**Errors:** 400 (validation), 401 (password lama salah)

---

## 3. Warga Endpoints

### 3.1 List Warga
```
GET /warga?page=1&limit=20&search=ahmad&status=aktif&blok=A
```
**Auth:** Admin/Sekretaris/Bendahara/Pengurus/Warga
**Object-level:** Queryset dan field response wajib di-scope berdasarkan role. Warga hanya melihat data publik/own profile; NIK/no KK di-mask untuk role yang tidak berhak.
**Field Visibility:** Mengikuti `docs/11-SECURITY.md` — Admin/Sekretaris full, Bendahara/Pengurus terbatas/masked.

**Response 200 (Admin/Sekretaris):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "nik": "3201010101010001",
      "noKk": "3201010101010001",
      "namaLengkap": "Ahmad Fauzi",
      "blok": "A",
      "noRumah": "15",
      "phone": "081234567890",
      "email": "ahmad@email.com",
      "alamat": "Jl. Merdeka No. 10",
      "status": "aktif",
      "foto": "https://..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
}
```

**Response 200 (Warga — list profil sendiri):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "nikMasked": "3201********0001",
      "namaLengkap": "Ahmad Fauzi",
      "blok": "A",
      "noRumah": "15",
      "status": "aktif"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

**Field Visibility per Role:**

| Field | Admin | Sekretaris | Bendahara | Pengurus | Warga (own) | Warga (other) |
|-------|-------|------------|-----------|----------|-------------|---------------|
| id | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| nik | ✅ full | ✅ full | ✅ masked | ✅ masked | ✅ full | ❌ |
| noKk | ✅ full | ✅ full | ✅ masked | ✅ masked | ✅ full | ❌ |
| namaLengkap | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| blok | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| noRumah | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| phone | ✅ | ✅ | ✅ masked | ✅ masked | ✅ own only | ❌ |
| email | ✅ | ✅ | ❌ | ❌ | ✅ own only | ❌ |
| alamat | ✅ | ✅ | ✅ terbatas | ✅ terbatas (blok/noRumah only) | ✅ own only | ❌ |
| status | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| foto | ✅ | ✅ | ✅ | ✅ masked | ✅ own only | ❌ |

---

### 3.2 Get Warga Detail
```
GET /warga/:id
```
**Auth:** Admin/Sekretaris/Bendahara/Pengurus/Warga
**Object-level:** Admin/Sekretaris bisa akses full; Bendahara/Pengurus menerima field terbatas/masked; Warga hanya bisa akses profil sendiri atau data publik yang diizinkan.

**Response 200 (Admin/Sekretaris):**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "nik": "3201010101010001",
    "namaLengkap": "Ahmad Fauzi",
    "tempatLahir": "Palangkaraya",
    "tanggalLahir": "1990-05-15",
    "jenisKelamin": "L",
    "agama": "Islam",
    "statusPerkawinan": "KAWIN",
    "pendidikan": "S1",
    "pekerjaan": "PNS",
    "noKk": "3201010101010001",
    "hubunganKeluarga": "kepala_keluarga",
    "alamat": "Jl. Merdeka No. 10",
    "blok": "A",
    "noRumah": "15",
    "phone": "081234567890",
    "email": "ahmad@email.com",
    "status": "aktif",
    "foto": "https://...",
    "createdAt": "2026-06-06T10:00:00Z",
    "updatedAt": "2026-06-06T10:00:00Z"
  }
}
```

**Response 200 (Warga — profil sendiri, full own data):**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "nik": "3201010101010001",
    "namaLengkap": "Ahmad Fauzi",
    "tempatLahir": "Palangkaraya",
    "tanggalLahir": "1990-05-15",
    "jenisKelamin": "L",
    "agama": "Islam",
    "statusPerkawinan": "KAWIN",
    "pendidikan": "S1",
    "pekerjaan": "PNS",
    "noKk": "3201010101010001",
    "hubunganKeluarga": "kepala_keluarga",
    "alamat": "Jl. Merdeka No. 10",
    "blok": "A",
    "noRumah": "15",
    "phone": "081234567890",
    "email": "ahmad@email.com",
    "status": "aktif",
    "foto": "https://...",
    "createdAt": "2026-06-06T10:00:00Z",
    "updatedAt": "2026-06-06T10:00:00Z"
  }
}
```

**Errors:** 403 (bukan profil sendiri untuk role warga), 404 (tidak ditemukan)

---

### 3.3 Create Warga
```
POST /warga
```
**Auth:** Sekretaris/Admin
**Body:**
```json
{
  "nik": "1234567890123456",
  "namaLengkap": "Ahmad Fauzi",
  "tempatLahir": "Palangkaraya",
  "tanggalLahir": "1990-05-15",
  "jenisKelamin": "L",
  "agama": "Islam",
  "statusPerkawinan": "KAWIN",
  "pendidikan": "S1",
  "pekerjaan": "PNS",
  "noKk": "1234567890123456",
  "hubunganKeluarga": "kepala_keluarga",
  "alamat": "Jl. Merdeka No. 10",
  "blok": "A",
  "noRumah": "15",
  "phone": "081234567890"
}
```
**Response 201:**
```json
{
  "status": "success",
  "data": { "id": "uuid", "namaLengkap": "Ahmad Fauzi" },
  "message": "Data warga berhasil ditambahkan"
}
```

---

### 3.4 Update Warga
```
PUT /warga/:id
```
**Auth:** Sekretaris/Admin
**Body:** Same as Create (partial update supported)
**Response 200:**
```json
{
  "status": "success",
  "data": { "id": "uuid", "namaLengkap": "Ahmad Fauzi" },
  "message": "Data warga berhasil diperbarui"
}
```

---

### 3.5 Delete Warga
```
DELETE /warga/:id
```
**Auth:** Admin only
**Response 200:**
```json
{ "status": "success", "message": "Data warga berhasil dihapus" }
```

---

### 3.6 Import Warga (Excel)
```
POST /warga/import
Content-Type: multipart/form-data
```
**Auth:** Sekretaris/Admin
**Body:** `file: <excel_file>`
**Response 200:**
```json
{
  "status": "success",
  "message": "Import selesai",
  "data": { "imported": 45, "failed": 2, "errors": ["Row 10: NIK sudah ada"] }
}
```

---

### 3.7 Export Warga
```
GET /warga/export?fmt=excel&status=aktif
GET /warga/export?fmt=pdf&blok=A
```
**Auth:** Sekretaris/Admin only
**Object-level:** Warga tidak bisa akses export.
**Audit:** Ya — setiap export dicatat di audit_logs (action: export, table: warga).
**Query Params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| fmt | string | Yes | `excel` or `pdf`. **Catatan:** Menggunakan `fmt` (bukan `format`) untuk menghindari konflik dengan DRF `URL_FORMAT_OVERRIDE` yang mencegat query param `?format=`. |
| status | string | No | Filter by status |
| blok | string | No | Filter by blok |
| fullData | boolean | No | Default `false`. Jika `true` dan role = admin, export menyertakan data sensitif lengkap (NIK, no KK, alamat, phone, email). Jika `false`, field sensitif di-mask. |

**Response:** File download (Content-Type: application/vnd.openxmlformats / application/pdf)

**Errors:** 403 (role warga), 400 (invalid format)

---

### 3.8 Verify Warga
```
PUT /warga/:id/verify
```
**Auth:** Sekretaris/Admin
**Body:**
```json
{ "status": "active", "keterangan": "Data valid" }
```
**Response 200:**
```json
{ "status": "success", "message": "Warga berhasil diverifikasi" }
```

---

## 4. Keuangan Endpoints

### 4.1 List Transaksi
```
GET /keuangan?page=1&limit=20&tipe=pemasukan&dari=2026-01-01&sampai=2026-06-30
```
**Auth:** Bendahara/Admin
**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "kategori": { "id": "uuid", "nama": "Iuran Bulanan" },
      "jumlah": 50000,
      "keterangan": "Iuran bulan Juni",
      "tanggal": "2026-06-01",
      "tipe": "pemasukan",
      "status": "confirmed",
      "buktiUrl": null,
      "createdBy": { "id": "uuid", "namaLengkap": "Budi" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 30, "totalPages": 2 }
}
```

---

### 4.2 Create Transaksi
```
POST /keuangan
```
**Auth:** Bendahara/Admin
**Body:**
```json
{
  "kategoriId": "uuid",
  "jumlah": 50000,
  "keterangan": "Iuran bulan Juni",
  "tanggal": "2026-06-01",
  "tipe": "pemasukan"
}
```
**Response 201:**
```json
{
  "status": "success",
  "data": { "id": "uuid", "jumlah": 50000 },
  "message": "Transaksi berhasil ditambahkan"
}
```

---

### 4.3 Update Transaksi
```
PUT /keuangan/:id
```
**Auth:** Bendahara/Admin
**Body:** Same as Create (partial)
**Response 200**

---

### 4.4 Delete Transaksi
```
DELETE /keuangan/:id
```
**Auth:** Admin only
**Response 200**

---

### 4.5 Kategori Transaksi CRUD
```
GET    /keuangan/kategori          — List all
POST   /keuangan/kategori          — Create { "nama": "Sumbangan", "tipe": "pemasukan" }
PUT    /keuangan/kategori/:id      — Update
DELETE /keuangan/kategori/:id      — Delete (Admin only)
```
**Auth:** Bendahara/Admin

---

### 4.6 Upload Bukti Iuran
```
POST /iuran/upload
Content-Type: multipart/form-data
```
**Auth:** Warga
**Object-level:** Warga hanya bisa upload untuk iuran miliknya sendiri.

**Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| bulan | integer | Yes | 1-12 |
| tahun | integer | Yes | e.g., 2026 |
| jumlah | decimal | Yes | Nominal iuran |
| buktiTransfer | file | Yes | Gambar bukti transfer |

**File Upload Rules:**
| Rule | Value |
|------|-------|
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| Allowed extensions | `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf` |
| Max file size | 5 MB |
| Filename storage | Random UUID (original filename tidak disimpan) |
| Storage path | `bukti-iuran/{uuid}/{random_filename}` |
| Access control | Private — hanya pemilik, bendahara, admin |
| URL access | Signed URL atau protected route via Django |

**Response 201:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "bulan": 6,
    "tahun": 2026,
    "jumlah": 50000,
    "status": "pending",
    "buktiUrl": null  // URL hanya bisa diakses oleh pemilik/bendahara/admin
  },
  "message": "Bukti transfer berhasil diupload. Menunggu konfirmasi bendahara."
}
```

**Errors:** 400 (validation), 403 (bukan iuran sendiri), 413 (file terlalu besar), 415 (MIME type tidak diizinkan)

---

### 4.7 Konfirmasi Iuran
```
PUT /iuran/:id/confirm
```
**Auth:** Bendahara/Admin
**Body:**
```json
{ "status": "lunas", "keterangan": "Pembayaran valid" }
```
**Response 200:**
```json
{ "status": "success", "message": "Iuran berhasil dikonfirmasi" }
```

---

### 4.8 Riwayat Iuran Saya
```
GET /iuran/saya?tahun=2026
```
**Auth:** Warga
**Response 200:**
```json
{
  "status": "success",
  "data": [
    { "id": "uuid", "bulan": 6, "tahun": 2026, "jumlah": 50000, "status": "lunas" },
    { "id": "uuid", "bulan": 5, "tahun": 2026, "jumlah": 50000, "status": "lunas" }
  ]
}
```

---

### 4.9 Dashboard Keuangan
```
GET /keuangan/dashboard?tahun=2026
```
**Auth:** Bendahara/Admin
**Response 200:**
```json
{
  "status": "success",
  "data": {
    "saldo": 15000000,
    "totalPemasukan": 5000000,
    "totalPengeluaran": 2000000,
    "bulanan": [
      { "bulan": 1, "pemasukan": 3000000, "pengeluaran": 500000 },
      { "bulan": 2, "pemasukan": 2000000, "pengeluaran": 1500000 }
    ]
  }
}
```

---

### 4.10 Laporan Keuangan (PDF)
```
GET /keuangan/laporan?dari=2026-01-01&sampai=2026-06-30&format=pdf
```
**Auth:** Bendahara/Admin
**Response:** PDF file download

---

## 5. Pengumuman Endpoints

### 5.1 List Pengumuman
```
GET /pengumuman?page=1&limit=10&kategori=penting
```
**Auth:** Required
**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "judul": "Kerja Bakti Minggu Depan",
      "isi": "Dimohon kehadiran seluruh warga...",
      "kategori": "acara",
      "gambar": "https://...",
      "createdAt": "2026-06-06T10:00:00Z",
      "createdBy": { "namaLengkap": "Ketua RT" }
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
}
```

---

### 5.2 Get Pengumuman Detail
```
GET /pengumuman/:id
```
**Auth:** Required
**Response 200:** Single pengumuman object

---

### 5.3 Create Pengumuman
```
POST /pengumuman
Content-Type: multipart/form-data
```
**Auth:** Sekretaris/Pengurus/Admin
**Body:**
```json
{
  "judul": "Kerja Bakti",
  "isi": "Dimohon kehadiran...",
  "kategori": "acara",
  "scheduledAt": "2026-06-07T08:00:00Z",
  "gambar": "<file>"
}
```
**Response 201**

---

### 5.4 Update Pengumuman
```
PUT /pengumuman/:id
```
**Auth:** Sekretaris/Pengurus/Admin
**Response 200**

---

### 5.5 Delete Pengumuman
```
DELETE /pengumuman/:id
```
**Auth:** Sekretaris/Pengurus/Admin
**Response 200**

---

## 6. Forum Endpoints

### 6.1 List Threads
```
GET /forum?page=1&limit=20&kategori=keamanan&sort=terbaru
```
**Auth:** Required
**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "judul": "Jaga Malam Minggu Ini",
      "kategori": "keamanan",
      "status": "active",
      "createdAt": "2026-06-06T10:00:00Z",
      "createdBy": { "namaLengkap": "Ahmad" },
      "commentCount": 5
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 10, "totalPages": 1 }
}
```

---

### 6.2 Get Thread Detail
```
GET /forum/:id
```
**Auth:** Required
**Response 200:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "judul": "Jaga Malam",
    "kategori": "keamanan",
    "status": "active",
    "createdBy": { "namaLengkap": "Ahmad" },
    "createdAt": "2026-06-06T10:00:00Z",
    "comments": [
      {
        "id": "uuid",
        "isi": "Saya bisa jaga jam 10-12",
        "createdBy": { "namaLengkap": "Budi" },
        "createdAt": "2026-06-06T11:00:00Z",
        "replies": [
          {
            "id": "uuid",
            "isi": "Baik, terima kasih Budi",
            "createdBy": { "namaLengkap": "Ahmad" },
            "createdAt": "2026-06-06T11:30:00Z"
          }
        ]
      }
    ]
  }
}
```

---

### 6.3 Create Thread
```
POST /forum
```
**Auth:** Required
**Body:**
```json
{
  "judul": "Jaga Malam Minggu Ini",
  "kategori": "keamanan",
  "isi": "Mohon yang bisa jaga malam..."
}
```
**Response 201**

---

### 6.4 Update Thread
```
PUT /forum/:id
```
**Auth:** Owner/Sekretaris/Pengurus/Admin
**Body:** { "judul": "...", "isi": "..." }
**Response 200**

---

### 6.5 Delete Thread
```
DELETE /forum/:id
```
**Auth:** Sekretaris/Pengurus/Admin
**Response 200**

---

### 6.6 Add Comment
```
POST /forum/:id/comments
```
**Auth:** Required
**Body:**
```json
{
  "isi": "Saya bisa jaga jam 10-12",
  "parentId": "uuid (optional, untuk reply)"
}
```
**Response 201**

---

### 6.7 Delete Comment
```
DELETE /forum/comments/:id
```
**Auth:** Sekretaris/Pengurus/Admin
**Response 200**

---

### 6.8 Moderation
```
PUT /forum/:id/pin     — Pin thread (Sekretaris/Pengurus/Admin)
PUT /forum/:id/lock    — Lock thread (Sekretaris/Pengurus/Admin)
```
**Body:** { "status": "pinned" } / { "status": "locked" }
**Response 200**

---

## 7. Pengaduan Endpoints

### 7.1 List Pengaduan
```
GET /pengaduan?page=1&limit=20&status=diproses&kategori=keamanan
```
**Auth:** Required
**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "judul": "Lampu Jalan Mati",
      "kategori": "infrastruktur",
      "status": "diproses",
      "foto": "https://...",
      "createdAt": "2026-06-06T10:00:00Z",
      "warga": { "namaLengkap": "Ahmad" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

---

### 7.2 Get Pengaduan Detail
```
GET /pengaduan/:id
```
**Auth:** Required
**Response 200:** Single pengaduan with timeline

---

### 7.3 Create Pengaduan
```
POST /pengaduan
Content-Type: multipart/form-data
```
**Auth:** Warga
**Body:**
```json
{
  "judul": "Lampu Jalan Mati",
  "deskripsi": "Lampu jalan di depan rumah no. 15 mati sejak 3 hari lalu",
  "kategori": "infrastruktur",
  "foto": "<file>"
}
```
**Response 201**

---

### 7.4 Update Status Pengaduan
```
PUT /pengaduan/:id/status
```
**Auth:** Sekretaris/Pengurus/Admin
**Body:**
```json
{
  "status": "diproses",
  "keterangan": "Sudah ditukang untuk perbaikan"
}
```
**Response 200:**
```json
{
  "status": "success",
  "message": "Status pengaduan diperbarui",
  "data": { "id": "uuid", "status": "diproses" }
}
```

---

### 7.5 Pengaduan Saya
```
GET /pengaduan/saya?page=1&limit=20
```
**Auth:** Warga
**Response 200:** List pengaduan milik user

---

## 8. Kegiatan Endpoints

### 8.1 List Kegiatan
```
GET /kegiatan?dari=2026-06-01&sampai=2026-06-30
```
**Auth:** Required
**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "nama": "Kerja Bakti",
      "deskripsi": "Bersih-bersih lingkungan",
      "tanggal": "2026-06-10T07:00:00Z",
      "lokasi": "Balai RT",
      "penanggungJawab": { "namaLengkap": "Budi" },
      "rsvpCount": 15
    }
  ]
}
```

---

### 8.2 Get Kegiatan Detail
```
GET /kegiatan/:id
```
**Auth:** Required
**Response 200:** Single kegiatan with RSVP list

---

### 8.3 Create Kegiatan
```
POST /kegiatan
```
**Auth:** Sekretaris/Pengurus/Admin
**Body:**
```json
{
  "nama": "Kerja Bakti",
  "deskripsi": "Bersih-bersih lingkungan",
  "tanggal": "2026-06-10T07:00:00Z",
  "lokasi": "Balai RT",
  "penanggungJawabId": "uuid"
}
```
**Response 201**

---

### 8.4 Update Kegiatan
```
PUT /kegiatan/:id
```
**Auth:** Sekretaris/Pengurus/Admin
**Response 200**

---

### 8.5 Delete Kegiatan
```
DELETE /kegiatan/:id
```
**Auth:** Sekretaris/Pengurus/Admin
**Response 200**

---

### 8.6 RSVP Kegiatan
```
POST /kegiatan/:id/rsvp
```
**Auth:** Required
**Body:**
```json
{ "status": "hadir" }
```
**Response 200:**
```json
{ "status": "success", "message": "RSVP berhasil" }
```

---

## 9. Polling Endpoints

### 9.1 List Polling
```
GET /polling?status=aktif
```
**Auth:** Required
**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "pertanyaan": "Kapan waktu kerja bakti?",
      "deadline": "2026-06-07T23:59:59Z",
      "createdBy": { "namaLengkap": "Ketua RT" },
      "hasVoted": false
    }
  ]
}
```

---

### 9.2 Get Polling Detail
```
GET /polling/:id
```
**Auth:** Required
**Response 200:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "pertanyaan": "Kapan waktu kerja bakti?",
    "opsi": ["Sabtu pagi", "Minggu pagi", "Sabtu sore"],
    "deadline": "2026-06-07T23:59:59Z",
    "results": { "Sabtu pagi": 10, "Minggu pagi": 5, "Sabtu sore": 2 },
    "totalVotes": 17,
    "hasVoted": false
  }
}
```

---

### 9.3 Create Polling
```
POST /polling
```
**Auth:** Sekretaris/Pengurus/Admin
**Body:**
```json
{
  "pertanyaan": "Kapan waktu kerja bakti?",
  "opsi": ["Sabtu pagi", "Minggu pagi", "Sabtu sore"],
  "deadline": "2026-06-07T23:59:59Z"
}
```
**Response 201**

---

### 9.4 Vote
```
POST /polling/:id/vote
```
**Auth:** Required
**Body:**
```json
{ "opsiIndex": 0 }
```
**Response 200:**
```json
{ "status": "success", "message": "Vote berhasil" }
```
**Errors:** 400 (sudah vote), 403 (polling expired)

---

## 10. Dashboard Endpoints

### 10.1 Dashboard Pengurus
```
GET /dashboard/pengurus
```
**Auth:** Sekretaris/Pengurus/Admin
**Response 200:**
```json
{
  "status": "success",
  "data": {
    "totalWarga": 150,
    "wargaAktif": 145,
    "saldoKas": 15000000,
    "pengaduanAktif": 3,
    "pengaduanSelesai": 27,
    "kegiatanMendatang": 2,
    "iuranBulanIni": { "lunas": 120, "belum": 30 },
    "recentActivity": [
      { "type": "pengaduan", "judul": "Lampu Jalan Mati", "time": "2026-06-06T10:00:00Z" }
    ]
  }
}
```

---

### 10.2 Dashboard Warga
```
GET /dashboard/warga
```
**Auth:** Warga
**Response 200:**
```json
{
  "status": "success",
  "data": {
    "iuranBulanIni": { "status": "lunas", "jumlah": 50000 },
    "pengumumanTerbaru": [
      { "id": "uuid", "judul": "Kerja Bakti", "createdAt": "2026-06-06T10:00:00Z" }
    ],
    "pengaduanSaya": [
      { "id": "uuid", "judul": "Lampu Jalan Mati", "status": "diproses" }
    ],
    "kegiatanMendatang": [
      { "id": "uuid", "nama": "Kerja Bakti", "tanggal": "2026-06-10T07:00:00Z" }
    ]
  }
}
```

---

## 11. Notification Endpoints

### 11.1 List Notifications
```
GET /notifications?page=1&limit=20&isRead=false
```
**Auth:** Required
**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "judul": "Pengumuman Baru",
      "isi": "Kerja Bakti Minggu Depan",
      "tipe": "info",
      "isRead": false,
      "createdAt": "2026-06-06T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

---

### 11.2 Mark as Read
```
PUT /notifications/:id/read
```
**Auth:** Required
**Response 200**

---

### 11.3 Mark All as Read
```
PUT /notifications/read-all
```
**Auth:** Required
**Response 200**

---

## 12. File Upload

### 12.1 Upload File
```
POST /upload
Content-Type: multipart/form-data
```
**Auth:** Required
**Body:** `file: <file>`
**Response 201:**
```json
{
  "status": "success",
  "data": {
    "url": "https://.../uploads/foto-profil/uuid.jpg",
    "filename": "uuid.jpg",
    "size": 102400,
    "mimetype": "image/jpeg"
  }
}
```

**Allowed types:** jpg, jpeg, png, pdf
**Max size:** 5MB

---

## 13. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-06 | Initial API contract |
| 1.1.0 | 2026-06-07 | Expanded auth annotations to 5 roles: Sekretaris (CRUD warga, verifikasi, pengumuman, forum moderation), Bendahara (CRUD keuangan, konfirmasi iuran, dashboard keuangan). Updated field visibility table to 6 columns. Fixed typo "lokai" → "lokasi". |
| 1.2.0 | 2026-06-07 | Added §1.7 Error Code Dictionary (machine-readable `code` field per module: AUTH, WARGA, KEUANGAN, PENGUMUMAN, FORUM, PENGADUAN, KEGIATAN, POLLING, FILE, PERMISSION, VALIDATION, RATE_LIMIT). Added §1.8 API Versioning Strategy (URL path versioning, breaking-change policy, 6-month deprecation window, Deprecation/Sunset headers). |
| 1.2.1 | 2026-06-07 | Fixed header version to match Revision History (was showing 1.0.0). |
| 1.3.0 | 2026-06-08 | Added §1.9 System Endpoints: `GET /healthz` (public health check, used by CI/CD smoke test in 12-CICD.md and uptime monitoring in 13-MONITORING.md — was referenced there but not yet documented in the API Contract). |
| 1.4.0 | 2026-06-14 | Phase 3 implemented. Fixed §3.7 Export query param: `?format=` → `?fmt=` — DRF `URL_FORMAT_OVERRIDE` (default key `format`) intercepts `?format=excel` before it reaches the view, causing 404. Using `?fmt=` bypasses this. Implementation note added to param table. |
