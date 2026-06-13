# 🏘️ Smart-RT

<div align="center">

![Smart-RT](https://img.shields.io/badge/Smart--RT-Platform%20Digital%20RT-blue?style=for-the-badge)
![Django](https://img.shields.io/badge/Django-5.x-092E20?style=for-the-badge&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Supported-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**Platform digital modern untuk pengelolaan Rukun Tetangga (RT).**

[Fitur](#-fitur) • [Tech Stack](#-tech-stack) • [Instalasi](#-instalasi) • [Dokumentasi](#-dokumentasi) • [Status](#-development-status) • [Kontribusi](#-kontribusi)

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Arsitektur](#-arsitektur)
- [Instalasi](#-instalasi)
- [Dokumentasi](#-dokumentasi)
- [Roadmap](#-roadmap)
- [Development Status](#-development-status)
- [Security Policy](#-security-policy)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)
- [Author](#-author)

---

## 🎯 Tentang Proyek

**Smart-RT** adalah platform digital berbasis web yang dirancang untuk memodernisasi pengelolaan Rukun Tetangga (RT). Aplikasi ini menggantikan catatan manual, grup WhatsApp yang berantakan, dan proses administrasi tradisional menjadi satu platform terintegrasi yang mudah diakses oleh pengurus maupun warga.

Dibangun dengan arsitektur **web-based + PWA**, Smart-RT dapat diakses melalui desktop/laptop oleh pengurus RT dan melalui HP oleh warga — dengan pengalaman yang optimal di kedua platform.

### ✨ Mengapa Smart-RT?

| Masalah | Solusi |
|---------|--------|
| Catatan kertas mudah hilang | Semua data tersimpan digital & aman |
| Iuran tidak transparan | Dashboard keuangan real-time |
| Pengumuman tersebar di grup WA | Push notification langsung ke HP |
| Data warga tidak terstruktur | Database lengkap & terorganisir |
| Pengaduan tidak tertracking | Status tracking real-time |
| Partisipasi warga rendah | Forum diskusi & polling digital |

---

## 🚀 Fitur

### 👤 Multi-Role Authentication ✅
- Register dengan email/no. HP → akun status `pending`
- Verifikasi manual oleh sekretaris/admin → approve untuk aktifkan akun
- Login hanya bisa setelah akun aktif
- 5 role: **Admin** (Ketua RT), **Sekretaris**, **Bendahara**, **Pengurus**, **Warga**
- JWT access token (in-memory) + refresh token (httpOnly cookie, rotasi otomatis + blacklist)
- Rate limiting login: 10 percobaan / 5 menit
- Password hashing Argon2

### 📋 Data Warga ✅
- Data lengkap: NIK, nama, TTL, jenis kelamin, agama, status perkawinan, pendidikan, pekerjaan, no. HP, email, foto
- Data keluarga: No. KK, hubungan keluarga, alamat lengkap, blok, no. rumah
- **Field masking per role**: admin/sekretaris lihat full NIK; bendahara/pengurus lihat NIK masked (`3201****0001`); warga hanya lihat profil sendiri
- **Object-level permission**: warga tidak bisa mengakses data warga lain (→ 403)
- Import dari Excel (.xlsx, max 5MB), export ke Excel/PDF
- Kartu Keluarga digital — kelompok berdasarkan no. KK
- Verifikasi warga oleh sekretaris/admin
- **Soft-delete**: data tidak langsung dihapus, tercatat siapa yang menghapus
- Audit log lengkap untuk semua operasi CRUD/verify/export/import

### 💰 Keuangan RT ✅
- Pencatatan pemasukan & pengeluaran per kategori
- Upload bukti transfer + konfirmasi/tolak manual oleh bendahara
- Dashboard saldo real-time dengan grafik bulanan (bar chart)
- Laporan keuangan otomatis (PDF via WeasyPrint)
- **File upload security**: validasi MIME type, magic bytes, ekstensi, dan ukuran (maks 5MB)
- **Object-level permission**: warga hanya akses iuran miliknya sendiri
- Audit log setiap konfirmasi/penolakan iuran oleh bendahara
- Kategori transaksi: pemasukan & pengeluaran

### 📢 Pengumuman & Notifikasi ✅
- Buat pengumuman dengan 5 kategori (penting, acara, info, keamanan, lainnya)
- **Penjadwalan**: pengumuman bisa dijadwal — warga hanya melihat yang sudah published dan jadwalnya sudah tiba
- Upload gambar lampiran (JPEG/PNG/WebP, maks 5 MB) dengan validasi magic bytes
- **Web Push notification**: integrasi pywebpush + VAPID — kirim push ke semua browser yang subscribe
- **In-app notification**: setiap pengumuman baru otomatis membuat notifikasi untuk semua warga
- **CRUD dibatasi**: hanya pengurus, sekretaris, dan admin yang bisa buat/ubah/hapus pengumuman
- NotificationBell component dengan badge unread count dan polling otomatis
- Audit log setiap create/update/delete pengumuman

### 💬 Forum Diskusi _(Phase 6 — coming soon)_
- Thread per topik dengan kategori
- Komentar & balasan
- Moderasi oleh pengurus

### 📝 Pengaduan Warga _(Phase 6 — coming soon)_
- Form pengaduan dengan upload foto
- Tracking status: Diterima → Diproses → Selesai / Ditolak
- Notifikasi perubahan status
- Riwayat pengaduan

### 📅 Kegiatan & Kalender _(Phase 8 — coming soon)_
- Kalender kegiatan RT
- RSVP/tanda hadir
- Notifikasi reminder
- Dokumentasi foto

### 📊 Polling & Voting _(Phase 8 — coming soon)_
- Buat polling dengan deadline
- 1 warga = 1 suara
- Hasil real-time dengan grafik

### 📈 Dashboard & Laporan _(Phase 9 — coming soon)_
- Dashboard pengurus: statistik warga, keuangan, pengaduan aktif
- Dashboard warga: status iuran, pengumuman terbaru
- Laporan otomatis (PDF)

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.12 | Programming language |
| **Django** | 5.x | Web framework |
| **Django REST Framework** | 3.15.x | API development |
| **SimpleJWT** | 5.x | JWT authentication (access + refresh + rotation + blacklist) |
| **PostgreSQL** | 16 | Database |
| **psycopg** | 3.x | PostgreSQL driver |
| **argon2-cffi** | 23.x | Argon2 password hashing |
| **django-filter** | 24.x | Search & filter endpoint |
| **django-cors-headers** | 4.x | CORS middleware |
| **openpyxl** | 3.x | Excel import/export |
| **WeasyPrint** | 62.x | PDF export |
| **pywebpush** | 2.x | Web Push notifications via VAPID |
| **gunicorn** | 22.x | Production WSGI server |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.x | UI library |
| **TypeScript** | 6.x | Type-safe JavaScript |
| **Vite** | 8.x | Build tool |
| **Tailwind CSS** | 4.x | Utility-first CSS |
| **Zustand** | 5.x | State management (in-memory only, no localStorage) |
| **react-router-dom** | 7.x | Client-side routing |
| **axios** | 1.x | HTTP client dengan 401→refresh interceptor |
| **Vite PWA** | 1.x | Progressive Web App |

### DevOps
| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-service orchestration (db, backend, frontend, nginx) |
| **Nginx** | Reverse proxy + static file serving |

---

## 🏗 Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Desktop    │  │   Tablet     │  │   Mobile     │      │
│  │   Browser    │  │   Browser    │  │   PWA        │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         └─────────────────┼──────────────────┘               │
└───────────────────────────┼──────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────┼──────────────────────────────────┐
│                      DJANGO + DRF                            │
│  ┌────────────────────────┴─────────────────────────┐        │
│  │  Auth │ RBAC │ Rate Limit │ CORS │ Validation    │        │
│  └────────────────────────┬─────────────────────────┘        │
│  ┌────────────────────────┴─────────────────────────┐        │
│  │  /api/v1/auth │ /api/v1/warga │ /api/v1/keuangan  │        │
│  │  /api/v1/pengumuman │ /api/v1/forum │ ...         │        │
│  └────────────────────────┬─────────────────────────┘        │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌────────────────────────┴─────────────────────────┐        │
│  │              Django ORM (bawaan)                  │        │
│  └────────────────────────┬─────────────────────────┘        │
│  ┌────────────────────────┴─────────────────────────┐        │
│  │           PostgreSQL Database                     │        │
│  └──────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

---

## 📦 Instalasi

### Prerequisites
- Python 3.12+
- Node.js 20+ (untuk frontend tooling: Vite/React)
- PostgreSQL 16+
- Docker & Docker Compose (opsional)

### Quick Start

**1. Clone repository**
```bash
git clone https://github.com/bocahlinux/smart-rt.git
cd smart-rt
```

**2. Setup Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
pip install -r requirements/dev.txt
cp .env.example .env
# Edit .env dengan konfigurasi database kamu
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
# → http://localhost:8000
```

**3. Setup Frontend**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env dengan URL backend
npm run dev
# → http://localhost:5173
```

**4. Docker (Alternative)**
```bash
docker compose up --build
# → http://localhost (Nginx proxy)
```

---

## 📚 Dokumen

| Dokumen | Versi | Deskripsi |
|---------|-------|-----------|
| [01-PRD.md](docs/01-PRD.md) | v1.1.0 | Product Requirements Document |
| [02-SRS.md](docs/02-SRS.md) | v1.1.0 | Software Requirements Specification |
| [03-UIUX-Flow.md](docs/03-UIUX-Flow.md) | v1.0.0 | UI/UX Flow & Design |
| [04-SDD.md](docs/04-SDD.md) | v1.3.0 | System Design Document |
| [05-DATABASE.md](docs/05-DATABASE.md) | v1.0.0 | Database Design & Django Models |
| [06-API-CONTRACT.md](docs/06-API-CONTRACT.md) | v1.4.0 | API Contract Specification |
| [07-TASK-BREAKDOWN.md](docs/07-TASK-BREAKDOWN.md) | v1.6.0 | Task Breakdown & Estimation |
| [08-CODING-STANDART.md](docs/08-CODING-STANDART.md) | v1.0.0 | Coding Standard & Conventions |
| [09-TEST-PLAN.md](docs/09-TEST-PLAN.md) | v1.4.0 | Test Plan & Coverage |
| [10-AI-RULES.md](docs/10-AI-RULES.md) | v1.5.0 | AI Development Rules |
| [11-SECURITY.md](docs/11-SECURITY.md) | v1.0.0 | Security & Privacy Policy |
| [12-CICD.md](docs/12-CICD.md) | v1.0.0 | CI/CD Pipeline & Deployment |
| [13-MONITORING.md](docs/13-MONITORING.md) | v1.0.0 | Monitoring & Observability |

---

## 🗺 Roadmap

| Phase | Fokus | Status |
|-------|-------|--------|
| 1 | Project Setup | ✅ Done |
| 2 | Authentication & Role System | ✅ Done |
| 3 | Data Warga | ✅ Done |
| 4 | Keuangan RT | ✅ Done |
| 5 | Pengumuman & Notifikasi | ✅ Done |
| 6 | Forum Diskusi | ⬜ Pending |
| 7 | Pengaduan Warga | ⬜ Pending |
| 8 | Kegiatan & Polling | ⬜ Pending |
| 9 | Dashboard & Laporan | ⬜ Pending |
| 10 | Polish, Testing & Deployment | ⬜ Pending |

---

## 📊 Development Status

> **Last updated:** June 14, 2026

### Overall Progress

```
Phase 1-5     ██████████░░░░░░░░░░  50%  ✅
Phase 6-10    ░░░░░░░░░░░░░░░░░░░░  0%
Documentation ████████████████████  100%  ✅
```

### Status Legend

| Icon | Meaning |
|------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Completed |
| ⏸️ | On hold |
| ❌ | Cancelled |

### Phase Progress

| Phase | Fokus | Status | Notes |
|-------|-------|--------|-------|
| — | Documentation & Planning | ✅ Done | All 13 docs complete, README, AI Rules |
| 1 | Project Setup | ✅ Done | Backend (Django+DRF) & frontend (React+Vite) scaffolded, Docker/Compose, lint tooling, pytest config |
| 2 | Authentication & Role System | ✅ Done | JWT auth (access+refresh, rotation & blacklist), RBAC permissions, Argon2 hashing, rate limiting, field masking, security test suite |
| 3 | Data Warga | ✅ Done | WargaProfile model (soft-delete, UUID PK), AuditLog model, 5 role-based serializers, field masking NIK/KK/phone/email, object-level permission, import/export Excel+PDF, 23/23 security tests passing, frontend WargaListPage/DetailPage/FormPage/KKPage |
| 4 | Keuangan RT | ✅ Done | KategoriTransaksi + Transaksi + IuranWarga models; CRUD bendahara/admin; upload bukti transfer (magic bytes + MIME + size validation); object-level permission warga; audit log konfirmasi; dashboard + grafik; laporan PDF; 24/24 security tests; frontend KeuanganListPage/DashboardPage/TransaksiFormPage/IuranUploadPage/IuranKonfirmasiPage/LaporanPage |
| 5 | Pengumuman & Notifikasi | ✅ Done | Pengumuman CRUD; penjadwalan; gambar upload (magic bytes + MIME + 5MB); IsPengurusOrAdmin; in-app Notification + Web Push (pywebpush + VAPID); broadcast saat create; NotificationBell; PushSubscription; 19/19 security tests |
| 6 | Forum Diskusi | ⬜ Pending | — |
| 7 | Pengaduan Warga | ⬜ Pending | — |
| 8 | Kegiatan & Polling | ⬜ Pending | — |
| 9 | Dashboard & Laporan | ⬜ Pending | — |
| 10 | Polish, Testing & Deployment | ⬜ Pending | — |

### Completed Milestones

- ✅ **v0.1.0** — Documentation & Planning (June 7, 2026)
  - 13 documentation files (PRD, SRS, UI/UX, SDD, Database, API Contract, Task Breakdown, Coding Standard, Test Plan, AI Rules, Security & Privacy Policy, **CI/CD Pipeline**, **Monitoring & Observability**)
  - README.md with professional layout
  - AI Development Rules v1.5.0
  - Security document as single source of truth for all security policies
- ✅ **v0.1.1** — Project Setup (June 8, 2026)
  - Backend scaffold: Django 5 + DRF + SimpleJWT + Argon2, split settings (dev/prod/test), 9 app skeletons (accounts, keuangan, pengumuman, forum, pengaduan, kegiatan, polling, audit, notifications), `GET /healthz`
  - Frontend scaffold: React 19 + Vite + TypeScript, Tailwind CSS 4, PWA plugin, Zustand, react-router-dom, axios client
  - Tooling: Ruff/Black/Bandit (backend) & ESLint/Prettier (frontend), pytest + pytest-django config
  - Docker: multi-stage Dockerfiles, docker-compose (db/backend/frontend/nginx), nginx reverse proxy
- ✅ **v0.2.0** — Authentication & Role System (June 7, 2026)
  - Backend: custom `User` model (UUID, 5-role RBAC), register/login/refresh/logout/me/change-password endpoints, JWT access+refresh with rotation & blacklist (incl. `AUTH_REFRESH_TOKEN_REUSED` session-revocation), Argon2 password hashing, password strength validators, login rate limiting (10/5min), role-based serializers with field masking (NIK/KK/phone/email)
  - Frontend: Zustand auth store (in-memory token only), axios client with 401→refresh→retry interceptor, Login/Register pages, `ProtectedRoute` with httpOnly-cookie session restoration
  - Security tests: full auth flow, token edge cases (expired/invalid/reused), rate limit, password strength — `accounts/tests/test_security.py` (10/10 passing)
- ✅ **v0.3.0** — Data Warga (June 14, 2026)
  - Backend: `WargaProfile` model (UUID PK, soft-delete, 5 DB indexes), `AuditLog` model + `log_action()` dengan field masking (NIK → `****`, phone, email, alamat)
  - 5 role-based serializers: admin/sekretaris (full), bendahara/pengurus (masked NIK/KK/phone), warga (own full), public (minimal)
  - `WargaViewSet`: CRUD + search/filter (`WargaFilter`) + pagination + object-level permission (warga → 403 bukan 404)
  - Endpoints: verify warga, export Excel (openpyxl) + PDF (WeasyPrint), import Excel (max 5MB)
  - URL patterns explicit — menghindari konflik DRF router dengan path `export/` dan `import/`; export pakai `?fmt=` bukan `?format=` (DRF URL_FORMAT_OVERRIDE conflict)
  - Frontend: `WargaListPage` (table+filter+pagination+import/export), `WargaDetailPage` (field per role+verify), `WargaFormPage` (create/edit), `WargaKKPage` (Kartu Keluarga grouped by noKk), 5 routes di App.tsx
  - Security tests: `test_warga_security.py` — **23/23 passing** (object-level, field masking, export permission, CRUD permission, audit log)

- ✅ **v0.4.0** — Keuangan RT (June 14, 2026)
  - Backend: `KategoriTransaksi`, `Transaksi`, `IuranWarga` models (UUID PK, DB indexes), migration applied
  - CRUD ViewSets: `KategoriTransaksiViewSet` (bendahara/admin), `TransaksiViewSet` (CRUD + laporan PDF)
  - `IuranWargaViewSet`: upload bukti transfer (warga), konfirmasi/tolak (bendahara/admin), riwayat iuran, list semua iuran
  - **File upload security**: magic bytes detection (JPEG/PNG/WebP/PDF), ekstensi whitelist, MIME type check, size limit 5MB — semua tanpa `imghdr` (dihapus di Python 3.13)
  - Object-level permission: warga hanya bisa upload/akses iuran miliknya sendiri (403 untuk iuran warga lain)
  - Audit log: setiap create transaksi, konfirmasi/tolak iuran, upload iuran tercatat di AuditLog
  - Dashboard endpoint: saldo total, pemasukan, pengeluaran, ringkasan bulanan
  - Laporan PDF (WeasyPrint): filter by periode, download dengan HTML template
  - `keuangan.urls`: explicit URL patterns (UUID regex) menghindari ambiguitas routing
  - Frontend: `KeuanganListPage` (tabel transaksi + filter), `KeuanganDashboardPage` (summary cards + grafik bar chart), `TransaksiFormPage`, `IuranUploadPage` (form upload + riwayat), `IuranKonfirmasiPage` (modal konfirmasi), `LaporanPage` (download PDF), 6 routes di App.tsx
  - Security tests: `test_keuangan_security.py` — **24/24 passing** (object-level iuran, file upload rejection, audit log, RBAC bendahara)

- ✅ **v0.5.0** — Pengumuman & Notifikasi (June 14, 2026)
  - Backend: `Pengumuman` model (UUID PK, FileField gambar, scheduled_at, is_published), `Notification` + `PushSubscription` models, migrations applied
  - `PengumumanListCreateView` + `PengumumanDetailView`: CRUD dengan `IsPengurusOrAdmin` permission; warga hanya lihat yang published dan jadwalnya sudah tiba
  - File upload security: magic bytes (JPEG/PNG/WebP), ekstensi whitelist, MIME check, 5MB max — `FileField` (bukan `ImageField`) agar tidak conflict dengan Pillow validation
  - Penjadwalan: `scheduled_at` → `is_published=False` jika di masa depan; auto publish oleh pengurus/admin
  - Web Push: `pywebpush` + VAPID keys (`VAPID_PRIVATE_PEM`, `VAPID_PUBLIC_KEY` di settings); `broadcast_pengumuman()` service kirim push ke semua `PushSubscription`
  - In-app Notification: setiap create pengumuman baru otomatis membuat `Notification` untuk semua user aktif
  - Endpoints: `GET/POST /pengumuman/`, `GET/PUT/DELETE /pengumuman/:id/`, `GET /notifications/`, `PUT /notifications/:id/read/`, `PUT /notifications/read-all/`, `POST/DELETE /notifications/push/subscribe|unsubscribe/`, `GET /notifications/push/vapid-public-key/`
  - Audit log setiap create/update/delete pengumuman (menggunakan `new_data` field AuditLog)
  - Frontend: `PengumumanListPage` (filter kategori + pagination), `PengumumanDetailPage`, `PengumumanFormPage` (create/edit + gambar preview), `NotificationBell` (dropdown + badge unread + mark read + polling 60s), `PushNotificationSubscription` (SW + PushManager API)
  - `pengumumanService.ts`: semua API calls + `urlBase64ToUint8Array` helper untuk VAPID key
  - 4 routes di `App.tsx`: `/pengumuman`, `/pengumuman/baru`, `/pengumuman/:id`, `/pengumuman/:id/edit`
  - Security tests: `test_pengumuman_security.py` — **19/19 passing** (warga cannot write, pengurus/admin CRUD, sekretaris create, image validation, notification access control)

### Upcoming Milestones

- ⬜ **v0.6.0** — Forum & Pengaduan
- ⬜ **v0.7.0** — Kegiatan & Polling
- ⬜ **v0.8.0** — Dashboard & Laporan
- ⬜ **v1.0.0** — Polish, Testing & Deployment

---

## 🔒 Security Policy

Untuk detail lengkap tentang kebijakan keamanan dan privasi, lihat **[docs/11-SECURITY.md](docs/11-SECURITY.md)**.

Ringkasan:
- **Data Classification:** Public, Internal, Sensitive, Restricted
- **Authentication:** SimpleJWT dengan access token (15-30 menit) + refresh token (7-14 hari, httpOnly cookie)
- **Authorization:** RBAC + object-level permission untuk setiap endpoint
- **Field Masking:** NIK, no KK, phone, email di-mask untuk role yang tidak berhak
- **File Upload:** Validasi MIME magic bytes, extension, max 5MB, UUID filename
- **Backup:** Terenkripsi GPG AES256
- **Audit Log:** Semua operasi sensitif tercatat, field sensitif di-mask di log
- **Incident Response:** Prosedur untuk data breach, compromised account, vulnerability

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan buka [Issue](https://github.com/bocahlinux/smart-rt/issues) atau buat [Pull Request](https://github.com/bocahlinux/smart-rt/pulls).

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/nama-fitur`)
3. Commit perubahan (`git commit -m "feat: tambah fitur X"`)
4. Push ke branch (`git push origin feature/nama-fitur`)
5. Buat Pull Request

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

## 👤 Author

<div align="center">

### BocahLinux

[![GitHub](https://img.shields.io/badge/GitHub-bocahlinux-181717?style=for-the-badge&logo=github)](https://github.com/bocahlinux)
[![Telegram](https://img.shields.io/badge/Telegram-@bocahlinux-2CA5E0?style=for-the-badge&logo=telegram)](https://t.me/bocahlinux)

**Platform Digital untuk Kemajuan Komunitas**

</div>

---

<div align="center">

**⭐ Star repository ini jika kamu menemukannya berguna!**

Dibuat dengan ❤️ oleh **BocahLinux**

</div>
