# Smart-RT — Software Requirements Specification (SRS)

**Version:** 1.0.0
**Date:** June 6, 2026
**Based on:** PRD v1.0.0
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose
Dokumen ini mendetailkan spesifikasi teknis perangkat lunak untuk Smart-RT, mencakup functional requirements, non-functional requirements, interface specifications, dan constraints.

### 1.2 Scope
Smart-RT adalah platform digital berbasis web + PWA untuk pengelolaan RT yang mencakup: data warga, keuangan, pengumuman, forum, pengaduan, kegiatan, polling, dan pelaporan.

### 1.3 Definitions & Acronyms

| Term | Definition |
|------|-----------|
| RT | Rukun Tetangga |
| PWA | Progressive Web App |
| JWT | JSON Web Token |
| RBAC | Role-Based Access Control |
| CRUD | Create, Read, Update, Delete |
| MVP | Minimum Viable Product |

---

## 2. Functional Requirements

### 2.1 Authentication & Authorization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | Sistem harus mendukung register dengan email dan no. HP | High |
| FR-AUTH-02 | Sistem harus mendukung login dengan email/no. HP + password | High |
| FR-AUTH-03 | Sistem harus memiliki 5 role: Admin, Sekretaris, Bendahara, Pengurus, Warga | High |
| FR-AUTH-04 | Warga harus diverifikasi oleh pengurus sebelum bisa login | High |
| FR-AUTH-05 | Sistem harus menggunakan JWT untuk session management | High |
| FR-AUTH-06 | Sistem harus mendukung logout & token expiration | Medium |
| FR-AUTH-07 | Sistem harus mendukung reset password via email/no. HP | Medium |

### 2.2 Data Warga

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-WRG-01 | Sistem harus menyimpan data lengkap warga (NIK, nama, TTL, jenis kelamin, agama, status perkawinan, pendidikan, pekerjaan, no. HP, email, foto) | High |
| FR-WRG-02 | Sistem harus menyimpan data keluarga (No. KK, hubungan, alamat) | High |
| FR-WRG-03 | Sistem harus mendukung CRUD data warga | High |
| FR-WRG-04 | Sistem harus mendukung import data dari Excel | Medium |
| FR-WRG-05 | Sistem harus mendukung export data ke Excel dan PDF | High |
| FR-WRG-06 | Sistem harus mendukung pencarian & filter (blok, status, usia) | High |
| FR-WRG-07 | Sistem harus menampilkan kartu keluarga digital | Medium |
| FR-WRG-08 | Sistem harus mencatat audit log setiap perubahan data | Medium |
| FR-WRG-09 | Sistem harus mendukung upload foto profil warga | Low |

### 2.3 Keuangan RT

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-FIN-01 | Sistem harus mencatat pemasukan (iuran, sumbangan, kas, lainnya) | High |
| FR-FIN-02 | Sistem harus mencatat pengeluaran (kebersihan, listrik, perbaikan, acara, lainnya) | High |
| FR-FIN-03 | Warga harus bisa upload bukti transfer pembayaran iuran | High |
| FR-FIN-04 | Pengurus harus bisa konfirmasi/tolak pembayaran | High |
| FR-FIN-05 | Sistem harus menampilkan dashboard saldo real-time | High |
| FR-FIN-06 | Sistem harus generate laporan keuangan bulanan/tahunan (PDF) | High |
| FR-FIN-07 | Sistem harus menampilkan grafik pemasukan/pengeluaran | Medium |
| FR-FIN-08 | Sistem harus mendukung kategori transaksi customizable | Low |

### 2.4 Pengumuman

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ANN-01 | Pengurus harus bisa membuat pengumuman (judul, isi, gambar) | High |
| FR-ANN-02 | Sistem harus mengkategorikan pengumuman (Penting, Biasa, Acara) | Medium |
| FR-ANN-03 | Sistem harus mengirim push notification ke warga | High |
| FR-ANN-04 | Sistem harus mendukung penjadwalan pengumuman | Medium |
| FR-ANN-05 | Sistem harus menampilkan riwayat pengumuman | High |
| FR-ANN-06 | Warga harus bisa melihat detail pengumuman | High |

### 2.5 Forum Diskusi

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-FOR-01 | Warga & pengurus harus bisa membuat thread diskusi | High |
| FR-FOR-02 | Sistem harus mengkategorikan thread (Keamanan, Kebersihan, Acara, Usul, Lainnya) | Medium |
| FR-FOR-03 | Pengguna harus bisa berkomentar & membalas thread | High |
| FR-FOR-04 | Sistem harus mendukung voting/polling dalam thread | Medium |
| FR-FOR-05 | Pengurus harus bisa moderasi (hapus, pin, lock thread) | Medium |

### 2.6 Pengaduan

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-COMP-01 | Warga harus bisa membuat pengaduan (judul, deskripsi, kategori, foto) | High |
| FR-COMP-02 | Sistem harus mencatat status pengaduan (Diterima, Diproses, Selesai, Ditolak) | High |
| FR-COMP-03 | Pengurus harus bisa update status pengaduan | High |
| FR-COMP-04 | Sistem harus mengirim notifikasi perubahan status ke pelapor | High |
| FR-COMP-05 | Warga harus bisa melihat riwayat pengaduan sendiri | High |
| FR-COMP-06 | Pengurus harus bisa melihat semua pengaduan dengan filter status | High |

### 2.7 Kegiatan & Kalender

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-EVT-01 | Pengurus harus bisa membuat kegiatan (nama, tanggal, lokasi, deskripsi) | High |
| FR-EVT-02 | Sistem harus menampilkan kalender kegiatan | High |
| FR-EVT-03 | Warga harus bisa RSVP/tanda hadir | Medium |
| FR-EVT-04 | Sistem harus mengirim reminder ke warga | Medium |
| FR-EVT-05 | Pengurus harus bisa upload dokumentasi foto kegiatan | Low |

### 2.8 Polling & Voting

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-POLL-01 | Pengurus harus bisa membuat poling (pertanyaan, opsi, deadline) | Medium |
| FR-POLL-02 | Warga harus bisa vote (1 warga = 1 suara) | Medium |
| FR-POLL-03 | Sistem harus menampilkan hasil real-time dengan grafik | Medium |
| FR-POLL-04 | Sistem harus menampilkan riwayat poling | Low |

### 2.9 Dashboard & Laporan

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DASH-01 | Dashboard pengurus harus menampilkan: total warga, saldo, pengaduan aktif, kegiatan mendatang | High |
| FR-DASH-02 | Dashboard warga harus menampilkan: status iuran, pengumuman terbaru, pengaduan saya | High |
| FR-DASH-03 | Sistem harus generate laporan PDF (bulanan, tahunan, custom) | High |
| FR-DASH-04 | Sistem harus menampilkan grafik statistik | Medium |

---

## 3. Non-Functional Requirements

### 3.1 Performance
- Page load time < 2 detik pada koneksi 4G
- API response time < 500ms untuk 95% requests
- Support hingga 500 warga per RT
- Support hingga 50 concurrent users

### 3.2 Security
- Semua password di-hash menggunakan Django password hasher (default production: Argon2, fallback: PBKDF2-SHA256)
- JWT token expiration: 24 jam
- Role-based access control (RBAC) di setiap endpoint
- Input validation & sanitization di semua form
- SQL injection prevention via Django ORM
- XSS prevention via output encoding
- Rate limiting: 100 requests/menit per IP

### 3.2.1 Data Protection Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| SEC-01 | Sistem harus melakukan masking NIK dan no KK pada list view untuk role warga. | High |
| SEC-02 | Sistem hanya boleh menampilkan data lengkap warga kepada admin/sekretaris yang berwenang; bendahara/pengurus hanya menerima field terbatas/masked. | High |
| SEC-03 | Warga hanya boleh melihat data profil miliknya sendiri kecuali data publik yang memang disetujui. | High |
| SEC-04 | Semua perubahan pada data warga wajib tercatat di audit log. | High |
| SEC-05 | Semua file upload wajib divalidasi MIME type, extension, ukuran, dan disimpan dengan nama random. | High |
| SEC-06 | Bukti transfer hanya boleh dilihat oleh pemilik, bendahara, dan admin. | High |
| SEC-07 | Pengaduan pribadi hanya boleh dilihat oleh pelapor, admin, serta sekretaris/pengurus yang ditugaskan. | High |
| SEC-08 | Backup database wajib terenkripsi. | High |
| SEC-09 | Secret key, JWT signing key, database password, dan credential lain wajib berasal dari environment variable. | High |
| SEC-10 | API harus mencegah IDOR dengan object-level permission. | High |

### 3.3 Availability
- Target uptime: 99.5%
- Daily database backup
- Error logging & monitoring

### 3.4 Usability
- Responsive design (desktop, tablet, mobile)
- PWA installable di mobile
- Offline cache untuk halaman statis
- WCAG 2.1 AA compliant
- Bahasa Indonesia

### 3.5 Compatibility
- Chrome, Firefox, Safari, Edge (2 versi terakhir)
- iOS 15+ (Safari)
- Android 10+ (Chrome)
- Screen resolution: 320px - 2560px

---

## 4. Data Requirements

### 4.1 User Table
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| phone | VARCHAR(20) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL (hashed) |
| role | ENUM (admin, sekretaris, bendahara, pengurus, warga) | NOT NULL |
| status | ENUM (pending, active, rejected) | DEFAULT pending |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | AUTO UPDATE |

### 4.2 Warga Profile Table
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| nik | VARCHAR(16) | UNIQUE |
| nama_lengkap | VARCHAR(255) | NOT NULL |
| tempat_lahir | VARCHAR(100) | |
| tanggal_lahir | DATE | |
| jenis_kelamin | ENUM (L, P) | |
| agama | VARCHAR(50) | |
| status_perkawinan | ENUM | |
| pendidikan | VARCHAR(100) | |
| pekerjaan | VARCHAR(100) | |
| no_kk | VARCHAR(16) | |
| hubungan_keluarga | VARCHAR(50) | |
| alamat | TEXT | |
| blok | VARCHAR(10) | |
| no_rumah | VARCHAR(10) | |
| status | ENUM (aktif, tidak_aktif, pindah, meninggal) | DEFAULT aktif |
| foto | VARCHAR(500) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 4.3 Keuangan Tables
- **kategori_transaksi**: id, nama, tipe (pemasukan/pengeluaran)
- **transaksi**: id, kategori_id, jumlah, keterangan, tanggal, tipe, status, bukti_url, created_by, confirmed_by
- **iuran_warga**: id, warga_id, bulan, tahun, jumlah, status (lunas/belum), bukti_url, confirmed_by

### 4.4 Pengumuman Table
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| judul | VARCHAR(255) | NOT NULL |
| isi | TEXT | NOT NULL |
| kategori | ENUM (penting, biasa, acara) | |
| gambar | VARCHAR(500) | |
| scheduled_at | TIMESTAMP | |
| created_by | UUID | FK → User |
| created_at | TIMESTAMP | |

### 4.5 Forum Tables
- **threads**: id, judul, kategori, created_by, status (active, pinned, locked), created_at
- **comments**: id, thread_id, parent_id, isi, created_by, created_at

### 4.6 Pengaduan Table
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| judul | VARCHAR(255) | NOT NULL |
| deskripsi | TEXT | NOT NULL |
| kategori | ENUM | |
| status | ENUM (diterima, diproses, selesai, ditolak) | DEFAULT diterima |
| foto | VARCHAR(500) | |
| warga_id | UUID | FK → User |
| assigned_to | UUID | FK → User |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 4.7 Kegiatan Table
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| nama | VARCHAR(255) | NOT NULL |
| deskripsi | TEXT | |
| tanggal | TIMESTAMP | NOT NULL |
| lokasi | VARCHAR(255) | |
| penanggung_jawab | UUID | FK → User |
| created_at | TIMESTAMP | |

### 4.8 Polling Tables
- **polls**: id, pertanyaan, opsi (JSON), deadline, created_by, created_at
- **votes**: id, poll_id, user_id, opsi_index, created_at

---

## 5. Interface Requirements

### 5.1 User Interfaces
- **Login/Register Page** — Email/no. HP + password
- **Dashboard** — Role-based (Pengurus vs Warga)
- **Data Warga** — Table + filter + search + CRUD modal
- **Keuangan** — Table transaksi + form + grafik
- **Pengumuman** — List + detail view + form
- **Forum** — Thread list + detail + comment
- **Pengaduan** — Form + list + tracking
- **Kegiatan** — Kalender + detail + RSVP
- **Profil** — Edit profil + ganti password

### 5.2 API Interfaces
- RESTful API dengan JSON response format
- Base URL: `/api/v1/`
- Authentication: Bearer Token (JWT)
- Standard HTTP status codes
- Pagination: `?page=1&limit=20`
- Error format: `{ "status": "error", "message": "...", "errors": [] }`

---

## 6. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-06 | Initial SRS |
| 1.1.0 | 2026-06-07 | Koreksi SQL injection prevention via Django ORM. Tambah §3.2.1 Data Protection Requirements (SEC-01 s/d SEC-10). |
