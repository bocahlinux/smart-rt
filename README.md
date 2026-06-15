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

[Fitur](#-fitur) • [Tech Stack](#-tech-stack) • [Instalasi](#-instalasi) • [Status](#-development-status) • [Kontribusi](#-kontribusi)

</div>

---

## 💖 Dukung Proyek Ini

<div align="center">

Proyek ini dikembangkan secara independen dan sepenuhnya bersumber terbuka (*open-source*).
Jika Smart-RT memberikan manfaat bagi Anda — baik sebagai referensi, inspirasi, maupun solusi nyata untuk komunitas Anda — pertimbangkan untuk memberikan dukungan kepada pengembangnnya.

Setiap bentuk dukungan, sekecil apapun, sangat berarti dan membantu keberlangsungan pengembangan proyek ini ke depannya.

<a href="https://teer.id/bocahlinux" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Dukung%20di%20Teer-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Dukung via Teer" />
</a>

**<a href="https://teer.id/bocahlinux" target="_blank" rel="noopener noreferrer">teer.id/bocahlinux</a>**

> *"Good software takes time, care, and coffee."*

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Arsitektur](#-arsitektur)
- [Instalasi](#-instalasi)
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

### 💬 Forum Diskusi ✅
- Thread diskusi per topik dengan 5 kategori (keamanan, kebersihan, acara, usul, lainnya)
- Komentar & balasan bersarang (satu level nesting)
- Toggle upvote per thread (satu user satu vote)
- **Object-level permission**: hanya owner yang bisa edit thread/komentar miliknya (→ 403 untuk non-owner)
- **Moderasi oleh pengurus/sekretaris/admin**: pin thread, lock thread, hapus thread/komentar
- Thread terkunci tidak bisa menerima komentar baru (→ 422)
- Thread pinned tampil di atas daftar
- Filter per kategori & pagination

### 📝 Pengaduan Warga ✅
- Form pengaduan dengan upload foto (JPEG/PNG/WebP, max 5MB, magic bytes validation)
- 5 kategori: Infrastruktur, Keamanan, Kebersihan, Sosial, Lainnya
- **Object-level permission**: warga hanya bisa akses pengaduan miliknya (→ 403 untuk non-owner)
- Status tracking: Diajukan → Diproses → Selesai / Ditolak dengan timeline history
- Notifikasi in-app ke pelapor setiap kali status diperbarui
- Filter by status dan kategori, pagination, `/pengaduan/saya/` endpoint
- Queryset scoping: warga lihat sendiri, pengurus/sekretaris/admin lihat semua
- Audit log tercatat saat create dan update status

### 📅 Kegiatan & Kalender ✅
- List kegiatan dengan filter mendatang/lampau
- Detail kegiatan: tanggal, lokasi, penanggung jawab, kuota peserta
- RSVP interaktif: Hadir / Masih Ragu / Tidak Hadir (upsert — 1 per user)
- Daftar peserta RSVP per kegiatan
- Create/edit/delete kegiatan (hanya pengurus/sekretaris/admin)

### 📊 Polling & Voting ✅
- List polling dengan filter aktif/berakhir
- Vote: 1 user = 1 vote, double vote → 409 Conflict
- Hasil poll: tersembunyi sebelum deadline untuk warga, moderator bisa lihat kapan saja
- Bar chart hasil vote (inline CSS, no library)
- Create poll dengan dynamic opsi (min 2, maks 10) hanya untuk pengurus/sekretaris/admin

### 📈 Dashboard & Laporan ✅
- Dashboard pengurus: statistik warga aktif, saldo kas, pengaduan aktif/selesai, kegiatan mendatang, iuran bulan ini (lunas/pending)
- Dashboard warga: status iuran bulan ini, pengumuman terbaru (5), pengaduan saya (5 terkini), kegiatan mendatang (3 terdekat)
- Role-based conditional rendering: pengurus/admin/sekretaris/bendahara → statistik pengurus; warga → data personal
- **RBAC enforced**: warga → 403 jika akses endpoint dashboard pengurus

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

## 🗺 Roadmap

| Phase | Fokus | Status |
|-------|-------|--------|
| 1 | Project Setup | ✅ Done |
| 2 | Authentication & Role System | ✅ Done |
| 3 | Data Warga | ✅ Done |
| 4 | Keuangan RT | ✅ Done |
| 5 | Pengumuman & Notifikasi | ✅ Done |
| 6 | Forum Diskusi | ✅ Done |
| 7 | Pengaduan Warga | ✅ Done |
| 8 | Kegiatan & Polling | ✅ Done |
| 9 | Dashboard & Laporan | ✅ Done |
| 10 | Polish, Testing & Deployment | ✅ Done |

---

## 📊 Development Status

> **Last updated:** June 14, 2026 — Phase 10 complete (10/10) 🎉

### Overall Progress

```
Phase 1-10    ████████████████████  100%  ✅
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
| 6 | Forum Diskusi | ✅ Done | Thread + Comment + ThreadVote models; CRUD APIView; IsModerator + IsOwnerOrModerator; toggle vote; pin/lock moderation; reply bersarang; admin.py; 22/22 security tests; frontend ForumListPage/ThreadDetailPage/ThreadFormPage; 4 routes App.tsx |
| 7 | Pengaduan Warga | ✅ Done | Pengaduan model (UUID PK, 5 Kategori + 4 Status, JSON status_history, FileField foto UUID-named); IsOwnerOrPengurus + CanUpdateStatus; queryset scoping per role; foto upload validation (magic bytes + MIME + ekstensi + 5MB); notify_status_change in-app notification; audit log create+update; admin.py; 23/23 security tests; frontend PengaduanListPage/FormPage/DetailPage; 3 routes App.tsx |
| 8 | Kegiatan & Polling | ✅ Done | Kegiatan model (UUID PK, kuota_peserta, rsvp_buka/tutup_at) + RSVP model (unique_together, upsert via update_or_create); Poll model (UUID PK, opsi JSONField, is_expired property, get_results()) + Vote model (unique_together 409 Conflict); IsPengurusOrAdmin; filter tanggal + status aktif/expired; poll results gating (hidden sebelum deadline untuk warga); 35/35 security tests; frontend KegiatanListPage/DetailPage/FormPage + PollingListPage/DetailPage/FormPage; 7 routes App.tsx |
| 9 | Dashboard & Laporan | ✅ Done | `dashboard` app: DashboardPengurusView + DashboardWargaView; role-based frontend DashboardPage; 4/4 RBAC tests passing |
| 10 | Polish, Testing & Deployment | ✅ Done | Security headers (XSS/NOSNIFF/X-Frame), IDOR tests (warga→403), RBAC cross-role tests; 11/11 security tests passing |

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

- ✅ **v0.6.0** — Forum Diskusi (June 14, 2026)
  - Backend: `Thread` model (UUID PK, Kategori + Status TextChoices, 3 DB indexes), `Comment` model (self-referential FK untuk reply bersarang), `ThreadVote` model (unique_together)
  - `ThreadListCreateView`, `ThreadDetailView`, `CommentListCreateView`, `CommentDetailView`, `ThreadModerationView`, `ThreadVoteView`
  - Permission: `IsModerator` (pengurus/sekretaris/admin), `IsOwnerOrModerator` (owner edit, moderator akses semua)
  - Toggle vote (get_or_create pattern), pin/lock toggle, thread ordering (pinned di atas), reply validation (parent harus di thread yang sama)
  - `admin.py`: `ThreadAdmin`, `CommentAdmin`, `ThreadVoteAdmin` dengan list_display, list_filter, search_fields
  - Frontend: `ForumListPage` (filter kategori + pagination + moderasi controls), `ThreadDetailPage` (komentar + reply + vote + moderasi), `ThreadFormPage` (create + edit dengan pre-fill)
  - `forumService.ts` (semua API calls), `types/forum.ts`, 4 routes di `App.tsx`
  - Security tests: `test_forum_security.py` — **22/22 passing** (FT-01 s/d FT-17 + list/filter/reply tests)

- ✅ **v0.7.0** — Pengaduan Warga (June 14, 2026)
  - Backend: `Pengaduan` model (UUID PK, 5 Kategori TextChoices, 4 Status TextChoices, `status_history` JSON untuk timeline, `foto` FileField dengan UUID upload path, 4 DB indexes)
  - `PengaduanListCreateView` (role-scoped queryset), `PengaduanDetailView` (object-level 403), `PengaduanStatusUpdateView` (pengurus only), `PengaduanSayaView`
  - Permission: `IsOwnerOrPengurus` (object-level — pelapor atau moderator), `CanUpdateStatus` (global — hanya pengurus/sekretaris/admin)
  - `PengaduanFilter`: filter by status dan kategori via django-filters
  - File upload: magic bytes (JPEG/PNG/WebP), ekstensi whitelist, MIME check, max 5MB — tanpa imghdr (Python 3.13 compatible)
  - Status update: append `status_history` JSON, audit log, kirim `notify_status_change()` in-app notification ke pelapor
  - `admin.py`: `PengaduanAdmin` dengan list_display, list_filter, search_fields, readonly_fields
  - Frontend: `PengaduanListPage` (filter status + kategori, pagination, badge berwarna), `PengaduanFormPage` (kategori cards, foto preview, client-side validation), `PengaduanDetailPage` (detail + timeline riwayat status reversed + form update status pengurus)
  - `pengaduanService.ts` (semua API calls + FormData upload), `types/pengaduan.ts`, 3 routes di `App.tsx`
  - Security tests: `test_pengaduan_security.py` — **23/23 passing** (PT-01 s/d PT-16)

- ✅ **v0.8.0** — Kegiatan & Polling (June 14, 2026)
  - Backend: `Kegiatan` model (UUID PK, kuota_peserta, rsvp_buka/tutup_at, penanggung_jawab SET_NULL, created_by PROTECT, 2 DB indexes) + `RSVP` model (unique_together kegiatan+user, 3 status choices, update_at auto)
  - `Poll` model (UUID PK, opsi JSONField, deadline DateTimeField, is_expired property, get_results() dict method) + `Vote` model (unique_together poll+user, opsi_index int)
  - CRUD Views: `KegiatanListCreateView`, `KegiatanDetailView`, `RSVPView` (upsert via update_or_create), `PollListCreateView`, `PollDetailView`, `PollVoteView`
  - Permission: `IsPengurusOrAdmin` (kegiatan + polling) — warga & bendahara → 403
  - RSVP upsert: 1 RSVP per user per kegiatan; re-POST → update status (bukan error)
  - Double vote protection: `IntegrityError` unique_together → 409 Conflict dengan code `POLLING_ALREADY_VOTED`
  - Poll result gating: `results` dan `totalVotes` = null jika belum expired dan bukan moderator
  - Filter: `KegiatanFilter` (dari/sampai DateTimeFilter), `PollFilter` (status aktif|expired via deadline comparison)
  - Audit log untuk create/update/delete kegiatan dan poll
  - `admin.py`: KegiatanAdmin + RSVPAdmin + PollAdmin (is_expired indicator) + VoteAdmin
  - Frontend: `KegiatanListPage` (filter mendatang/lampau), `KegiatanDetailPage` (RSVP 3 tombol + daftar peserta), `KegiatanFormPage` (create+edit), `PollingListPage` (filter aktif/expired + countdown), `PollingDetailPage` (vote + bar chart hasil), `PollingFormPage` (dynamic opsi)
  - `kegiatanService.ts`, `pollingService.ts`, `types/kegiatan.ts`, `types/polling.ts`, 7 routes di `App.tsx`
  - Security tests: Kegiatan **15/15** + Polling **20/20** = **35/35 passing**

- ✅ **v0.9.0** — Dashboard & Laporan (June 14, 2026)
  - Backend: `dashboard` app — `DashboardPengurusView` (GET `/dashboard/pengurus/`) dan `DashboardWargaView` (GET `/dashboard/warga/`); no migrations (views only)
  - `DashboardPengurusView`: aggregate totalWarga, wargaAktif, saldoKas, pengaduanAktif, pengaduanSelesai, kegiatanMendatang, iuranBulanIni (lunas + pending)
  - `DashboardWargaView`: iuran bulan ini (per WargaProfile), pengumuman terbaru 5, pengaduan saya 5, kegiatan mendatang 3
  - `IsPengurus` permission class: hanya admin/sekretaris/bendahara/pengurus yang bisa akses endpoint pengurus
  - Frontend: `DashboardPage.tsx` diupdate dari placeholder → role-aware dashboard; `dashboardService.ts`; `types/dashboard.ts`
  - Navigasi menu quick-links ke semua modul (Warga, Keuangan, Pengumuman, Pengaduan, Forum, Kegiatan, Polling)
  - RBAC tests: warga → 403 dashboard pengurus, pengurus → 200, warga → 200 dashboard warga, unauth → 401

- ✅ **v1.0.0** — Polish, Testing & Deployment (June 14, 2026)
  - Security headers ditambahkan ke `base.py`: `SECURE_BROWSER_XSS_FILTER`, `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS='DENY'` (HTTPS-only headers dikomentar untuk production)
  - IDOR tests: `test_security_final.py` — warga tidak bisa edit/hapus thread orang lain → 403; nonexistent UUID → 404; admin bisa akses profil warga manapun
  - RBAC cross-role tests: warga → 403 dashboard pengurus; warga → 200 dashboard warga; unauth → 401
  - **11/11 Phase 10 security tests passing**
  - README dan TASK-BREAKDOWN diupdate status akhir

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
