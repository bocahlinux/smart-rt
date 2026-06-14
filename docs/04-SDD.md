# Smart-RT — System Design Document (SDD)

**Version:** 1.8.0
**Date:** June 14, 2026
**Based on:** PRD v1.1.0, SRS v1.1.0
**Status:** Phase 8 Implemented

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Desktop    │  │   Tablet     │  │   Mobile     │      │
│  │   Browser    │  │   Browser    │  │   PWA        │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │ HTTPS                            │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                      API GATEWAY                             │
│  ┌────────────────────────┴─────────────────────────┐        │
│  │              Django + DRF API Server              │        │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐      │        │
│  │  │  Auth    │ │  RBAC    │ │  Rate Limit  │      │        │
│  │  │(SimpleJWT)│ │(DRF Perm)│ │  Middleware  │      │        │
│  │  └──────────┘ └──────────┘ └──────────────┘      │        │
│  └────────────────────────┬─────────────────────────┘        │
│                           │                                  │
│  ┌────────────────────────┴─────────────────────────┐        │
│  │                   URL Router                      │        │
│  │  /api/v1/auth    /api/v1/warga                   │        │
│  │  /api/v1/keuangan  /api/v1/pengumuman            │        │
│  │  /api/v1/forum   /api/v1/pengaduan               │        │
│  │  /api/v1/kegiatan  /api/v1/polling               │        │
│  │  /api/v1/dashboard  /api/v1/laporan              │        │
│  └────────────────────────┬─────────────────────────┘        │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌────────────────────────┴─────────────────────────┐        │
│  │              Django ORM (bawaan)                  │        │
│  └────────────────────────┬─────────────────────────┘        │
│                           │                                  │
│  ┌────────────────────────┴─────────────────────────┐        │
│  │           PostgreSQL Database                     │        │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │        │
│  │  │ users  │ │ warga  │ │transaks│ │ threads│    │        │
│  │  └────────┘ └────────┘ └────────┘ └────────┘    │        │
│  └──────────────────────────────────────────────────┘        │
│                                                              │
│  ┌──────────────────────────────────────────────────┐        │
│  │           File Storage (Local / S3)               │        │
│  │  /uploads/foto-profil/                           │        │
│  │  /uploads/bukti-transfer/                        │        │
│  │  /uploads/pengumuman/                            │        │
│  │  /uploads/pengaduan/                             │        │
│  └──────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | React 19 + Vite 8 | Fast dev, HMR, small bundle |
| **Styling** | Tailwind CSS 4 | Utility-first, rapid UI dev |
| **State** | Zustand | Lightweight, no boilerplate |
| **PWA** | Vite PWA Plugin | Auto SW generation, offline cache |
| **Backend** | Django 5 + DRF | Mature, admin panel built-in, ORM bawaan |
| **Language** | Python 3.12 | Clean syntax, large ecosystem |
| **ORM** | Django ORM | Built-in, no extra dependency |
| **Database** | PostgreSQL 16 | Reliable, ACID, JSON support |
| **Auth** | djangorestframework-simplejwt | JWT untuk DRF |
| **File Upload** | Django FileField / django-storages | Native Django, simple |
| **PDF** | WeasyPrint | HTML-to-PDF, Python native |
| **Validation** | DRF Serializers + Django Validators | Built-in validation |
| **Password Hashing** | Django password hasher (Argon2 / PBKDF2) | Secure, Django default |
| **Background Jobs / Scheduler** | Django-Q2 | Async tasks (kirim notifikasi, scheduled pengumuman, reminder kegiatan, hard-delete data soft-deleted) & periodic tasks tanpa broker eksternal (pakai Django ORM sebagai broker) — lebih ringan dari Celery (tidak butuh Redis/RabbitMQ), cocok untuk skala RT & deployment VPS tunggal via Docker Compose (lihat 12-CICD.md §6) |
| **Deployment** | Docker + Docker Compose + Nginx | Consistent environments |

---

## 2. Database Design

### 2.1 Entity Relationship Diagram (Conceptual)

```
┌──────────┐     1:1     ┌───────────────┐
│  users   │─────────────│ warga_profiles │
└──────────┘             └───────────────┘
     │
     │ 1:N
     ▼
┌──────────────┐     N:1     ┌──────────────────┐
│  transaksi   │─────────────│ kategori_transaksi│
└──────────────┘             └──────────────────┘

┌──────────┐     1:N     ┌──────────┐
│ pengumuman│             │ (none)   │
└──────────┘             └──────────┘

┌──────────┐     1:N     ┌──────────┐
│ threads  │─────────────│ comments │
└──────────┘             └──────────┘

┌──────────┐
│ pengaduan│
└──────────┘

┌──────────┐     1:N     ┌──────────┐
│ kegiatan │─────────────│  rsvp    │
└──────────┘             └──────────┘

┌──────────┐     1:N     ┌──────────┐
│  polls   │─────────────│  votes   │
└──────────┘             └──────────┘
```

### 2.2 Key Relationships
- **User** → **WargaProfile** (1:1, optional — hanya untuk role warga)
- **User** → **Transaksi** (1:N, sebagai created_by)
- **User** → **Pengaduan** (1:N, sebagai pelapor)
- **Thread** → **Comments** (1:N)
- **Poll** → **Votes** (1:N)
- **Kegiatan** → **RSVP** (1:N)

---

## 3. API Design

### 3.1 Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register akun baru | Public |
| POST | `/api/v1/auth/login` | Login | Public |
| POST | `/api/v1/auth/logout` | Logout (blacklist refresh token) | JWT |
| POST | `/api/v1/auth/token/refresh` | Refresh access token | Refresh Token |
| GET | `/api/v1/auth/me` | Get current user | JWT |
| PUT | `/api/v1/auth/password` | Ganti password | JWT |

### 3.2 Warga Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/warga` | List warga (paginated, filter) | Pengurus+ |
| GET | `/api/v1/warga/:id` | Detail warga | Object-level |
| POST | `/api/v1/warga` | Tambah warga | Pengurus+ |
| PUT | `/api/v1/warga/:id` | Update warga | Object-level |
| DELETE | `/api/v1/warga/:id` | Hapus warga | Admin |
| POST | `/api/v1/warga/import` | Import dari Excel | Pengurus+ |
| GET | `/api/v1/warga/export` | Export ke Excel/PDF | Pengurus+ |
| PUT | `/api/v1/warga/:id/verify` | Verifikasi warga | Pengurus+ |

### 3.3 Keuangan Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/keuangan` | List transaksi | Pengurus+ |
| POST | `/api/v1/keuangan` | Tambah transaksi | Pengurus+ |
| PUT | `/api/v1/keuangan/:id` | Update transaksi | Pengurus+ |
| DELETE | `/api/v1/keuangan/:id` | Hapus transaksi | Admin |
| GET | `/api/v1/keuangan/laporan` | Laporan keuangan | Pengurus+ |
| POST | `/api/v1/iuran` | Upload bukti iuran | Object-level |
| PUT | `/api/v1/iuran/:id/confirm` | Konfirmasi iuran | Pengurus+ |

### 3.4 Pengumuman Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/pengumuman` | List pengumuman | JWT |
| GET | `/api/v1/pengumuman/:id` | Detail pengumuman | JWT |
| POST | `/api/v1/pengumuman` | Buat pengumuman | Pengurus+ |
| PUT | `/api/v1/pengumuman/:id` | Update pengumuman | Pengurus+ |
| DELETE | `/api/v1/pengumuman/:id` | Hapus pengumuman | Pengurus+ |

### 3.5 Forum Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/forum` | List threads | JWT |
| GET | `/api/v1/forum/:id` | Detail thread + comments | JWT |
| POST | `/api/v1/forum` | Buat thread | JWT |
| PUT | `/api/v1/forum/:id` | Update thread | Owner/Admin |
| DELETE | `/api/v1/forum/:id` | Hapus thread | Pengurus+ |
| POST | `/api/v1/forum/:id/comments` | Tambah komentar | JWT |
| DELETE | `/api/v1/forum/comments/:id` | Hapus komentar | Pengurus+ |

### 3.6 Pengaduan Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/pengaduan` | List pengaduan (filtered by role) | JWT |
| GET | `/api/v1/pengaduan/:id` | Detail pengaduan | Object-level |
| POST | `/api/v1/pengaduan` | Buat pengaduan | Warga |
| PUT | `/api/v1/pengaduan/:id/status` | Update status | Pengurus+ |
| GET | `/api/v1/pengaduan/saya` | Pengaduan saya | Warga |

### 3.7 Kegiatan Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/kegiatan` | List kegiatan | JWT |
| GET | `/api/v1/kegiatan/:id` | Detail kegiatan | JWT |
| POST | `/api/v1/kegiatan` | Buat kegiatan | Pengurus+ |
| PUT | `/api/v1/kegiatan/:id` | Update kegiatan | Pengurus+ |
| DELETE | `/api/v1/kegiatan/:id` | Hapus kegiatan | Pengurus+ |
| POST | `/api/v1/kegiatan/:id/rsvp` | RSVP kegiatan | JWT |

### 3.8 Polling Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/polling` | List polling | JWT |
| GET | `/api/v1/polling/:id` | Detail polling + hasil | JWT |
| POST | `/api/v1/polling` | Buat polling | Pengurus+ |
| POST | `/api/v1/polling/:id/vote` | Vote | JWT |

### 3.9 Dashboard Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/dashboard/pengurus` | Dashboard pengurus | Pengurus+ |
| GET | `/api/v1/dashboard/warga` | Dashboard warga | Warga |

---

## 4. Security Design

### 4.1 Authentication Flow

```
1. User login → email/no. HP + password
2. Server verify password via Django password hasher (Argon2/PBKDF2)
3. Server generate token pair:
   - Access token (short-lived, 15-30 min) → returned in response body
   - Refresh token (long-lived, 7-14 days) → httpOnly Secure SameSite cookie
4. Client store:
   - Access token → in-memory / frontend state (Zustand)
   - Refresh token → httpOnly cookie (NOT localStorage)
5. Setiap API request: Authorization: Bearer <access_token>
6. Server verify JWT via DRF SimpleJWT authentication classes
7. Access token expired → client use refresh token to get new access token
8. Refresh token expired or blacklisted → 401 → redirect login
```

**Token Storage Rules:**
- Access token disimpan di memory/frontend state (Zustand store).
- Refresh token disimpan di httpOnly Secure SameSite cookie.
- **Dilarang** menyimpan refresh token di localStorage.
- Access token lifetime pendek (15-30 menit).
- Refresh token di-blacklist saat logout.

### 4.2 Role-Based Access Control (RBAC)

| Role | Access |
|------|--------|
| **Admin** | Full access, hapus data, manage semua role |
| **Sekretaris** | CRUD data warga, verifikasi, import/export, pengumuman, pengaduan. Tidak akses keuangan. |
| **Bendahara** | CRUD transaksi, konfirmasi iuran, lihat bukti transfer, export laporan. Tidak akses CRUD warga. |
| **Pengurus** | Lihat data warga (masked), moderasi forum, kelola kegiatan/polling, update status pengaduan |
| **Warga** | Lihat pengumuman, upload iuran, forum, pengaduan, RSVP, vote |

### 4.3 Object-Level Permission Rules

RBAC role global saja tidak cukup. Setiap endpoint yang mengakses data spesifik harus memverifikasi object-level permission:

| Resource | Rule |
|----------|------|
| **Warga Profile** | Warga hanya boleh mengakses profil dirinya sendiri. Pengurus/Admin bisa akses semua. |
| **Iuran** | Warga hanya boleh melihat/mengupload iuran miliknya sendiri. Pengurus keuangan bisa akses semua. |
| **Pengaduan** | Warga hanya boleh melihat pengaduan miliknya sendiri. Pengaduan publik (non-sensitif) bisa dilihat semua role. Pengurus bisa akses semua. |
| **Bukti Transfer** | Hanya pemilik transaksi, bendahara, pengurus berwenang, dan admin yang boleh melihat. |
| **Data Keuangan Detail** | Hanya pengurus keuangan dan admin. Warga hanya lihat status iuran sendiri. |
| **Forum Thread/Comment** | Owner bisa edit/delete own content. Bisa dihapus oleh Pengurus (moderasi). |
| **Polling Vote** | 1 warga = 1 suara. Tidak bisa vote ulang. |

**IDOR Prevention:**
- Semua endpoint dengan `:id` parameter harus melakukan object-level permission check.
- Jika user tidak berhak akses object tersebut → return 403 Forbidden.
- Jangan pernah mengandalkan client-side filtering saja.

### 4.4 Security Measures

- **Password hashing:** Django password hasher (Argon2 default, fallback PBKDF2)
- **JWT signing key:** env variable, min 256-bit
- **Rate limiting:** 100 req/min per IP
- **Input validation:** DRF Serializers + Django Validators di semua endpoint
- **SQL injection prevention:** Django ORM (parameterized queries)
- **XSS prevention:** React auto-escape + Django template escaping
- **CORS:** django-cors-headers, whitelist origin
- **File upload validation:**
  - Validate MIME type (magic bytes), bukan cuma extension
  - Validate file extension (jpg, png, pdf only)
  - Max file size: 5MB
  - Simpan dengan nama random (UUID), bukan original filename
  - Serve dari dedicated upload path, bukan executable directory
- **Security headers:** HSTS, X-Content-Type-Options, X-Frame-Options via Django SecurityMiddleware
- **Audit log:** Semua akses dan perubahan data sensitif tercatat

### 4.5 Data Protection Rules

- Data warga (NIK, no KK, alamat, no HP, email, foto) adalah data sensitif.
- Masking NIK dan no KK pada list view untuk role warga.
- NIK ditampilkan sebagai `3201********1234`.
- No KK ditampilkan sebagai `3201********5678`.
- Nomor HP warga lain disembunyikan atau ditampilkan terbatas.
- Export PDF/Excel hanya tersedia untuk pengurus/admin.
- Backup database wajib terenkripsi.
- Secret key, JWT signing key, database password, dan credential lain wajib berasal dari environment variable.
- **Dilarang** hardcode secret/credential di source code.

---

## 5. Frontend Architecture

### 5.1 Component Structure
```
src/
├── components/
│   ├── common/          # Button, Modal, Table, Form, Card
│   ├── layout/          # Header, Sidebar, Footer, Layout
│   ├── auth/            # LoginForm, RegisterForm
│   ├── warga/           # WargaTable, WargaForm, WargaDetail
│   ├── keuangan/        # TransaksiTable, TransaksiForm, Grafik
│   ├── pengumuman/      # PengumumanList, PengumumanCard, PengumumanForm
│   ├── forum/           # ThreadList, ThreadDetail, CommentForm
│   ├── pengaduan/       # PengaduanList, PengaduanForm, StatusBadge
│   ├── kegiatan/        # Kalender, KegiatanCard, RSVPButton
│   └── polling/         # PollCard, PollForm, PollResult
├── hooks/               # useAuth, useFetch, useForm
├── stores/              # authStore, wargaStore, keuanganStore
├── services/            # API client (axios)
├── types/               # TypeScript interfaces
├── utils/               # helpers, formatters
├── App.tsx
└── main.tsx
```

### 5.2 State Management (Zustand)
- **authStore**: user, access token (in-memory), role, login, logout
- **wargaStore**: list, filters, pagination
- **keuanganStore**: transaksi, saldo, filters
- **uiStore**: sidebar, theme, notifications

### 5.3 Routing
```
/                   → Dashboard (role-based)
/login              → Login page
/register           → Register page
/warga              → Data warga list
/warga/:id          → Detail warga
/warga/:id/edit     → Edit warga
/keuangan           → Keuangan list
/keuangan/laporan   → Laporan keuangan
/pengumuman         → Pengumuman list
/pengumuman/:id     → Detail pengumuman
/forum              → Forum list
/forum/:id          → Thread detail
/pengaduan          → Pengaduan list
/pengaduan/:id      → Detail pengaduan
/kegiatan           → Kalender kegiatan
/polling            → Polling list
/profil             → Profil user
```

---

## 6. Deployment Architecture

### 6.1 Development
```
localhost:5173  → Vite dev server (frontend)
localhost:8000  → Django dev server (backend)
localhost:5432  → PostgreSQL (local/Docker)
```

### 6.2 Production
```
┌─────────────────────────────────────────┐
│              VPS (Ubuntu)                │
│  ┌─────────────────────────────────┐    │
│  │         Nginx (reverse proxy)    │    │
│  │         Port 80/443              │    │
│  └────────────┬────────────────────┘    │
│               │                          │
│  ┌────────────┴────────────────────┐    │
│  │      Docker Compose              │    │
│  │  ┌──────────┐  ┌──────────┐     │    │
│  │  │ Frontend │  │ Backend  │     │    │
│  │  │ :5173    │  │ :8000    │     │    │
│  │  └──────────┘  └──────────┘     │    │
│  │  ┌──────────────────────────┐   │    │
│  │  │     PostgreSQL :5432     │   │    │
│  │  └──────────────────────────┘   │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 6.3 Environment Variables
```env
# Backend (Django)
DEBUG=False
SECRET_KEY=your-django-secret-key
DATABASE_URL=postgresql://user:***@db:5432/smartrt
JWT_ACCESS_TOKEN_LIFETIME=15m
JWT_REFRESH_TOKEN_LIFETIME=7d
CORS_ORIGIN=https://smartrt.yourdomain.com

# Frontend
VITE_API_URL=https://smartrt.yourdomain.com/api/v1
```

---

## 7. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-06 | Initial SDD |
| 1.1.0 | 2026-06-07 | Major security rewrite: token storage (access in-memory, refresh in httpOnly cookie), object-level permission rules, IDOR prevention, Django password hasher (Argon2/PBKDF2), file upload validation detail, data protection rules. Added auth token/refresh endpoint. Updated API auth column to Object-level where applicable. |
| 1.2.0 | 2026-06-08 | Added Background Jobs/Scheduler to Technology Stack — chose Django-Q2 (over Celery) for async tasks (notifications, scheduled pengumuman, kegiatan reminders, soft-delete hard-purge job) and periodic tasks, since it needs no external broker (Redis/RabbitMQ) and fits the single-VPS Docker Compose deployment in 12-CICD.md. Resolves previously undocumented background-job technology gap. |
| 1.3.0 | 2026-06-14 | Phase 3 implemented. Backend: `WargaProfile` model (UUID PK, soft-delete, 5 DB indexes), `AuditLog` model, `log_action()` service dengan field masking untuk NIK/no_kk/phone/email/alamat. `WargaViewSet` (CRUD + search/filter + pagination + object-level permission), 5 role-based serializers, `WargaFilter`, explicit URL patterns (menghindari konflik DRF router dengan export/import paths). Frontend: `WargaListPage`, `WargaDetailPage`, `WargaFormPage`, `WargaKKPage`, `wargaService`, warga TypeScript types, App.tsx routes. |
| 1.4.0 | 2026-06-14 | Phase 4 implemented. `KategoriTransaksi` + `Transaksi` + `IuranWarga` models; CRUD bendahara/admin; file upload (magic bytes + MIME + size); IsBendaharaOrAdmin + object-level warga permission; audit log; dashboard + grafik; laporan PDF (WeasyPrint); frontend KeuanganDashboardPage/TransaksiFormPage/IuranUploadPage/IuranKonfirmasiPage/LaporanPage. |
| 1.5.0 | 2026-06-14 | Phase 5 implemented. `Pengumuman` model; penjadwalan (scheduled_at); gambar upload (magic bytes + MIME + 5MB); IsPengurusOrAdmin; `Notification` model; Web Push (pywebpush + VAPID); broadcast saat create; `NotificationBell`; `PushSubscription`. |
| 1.6.0 | 2026-06-14 | Phase 6 implemented. `Thread` + `Comment` + `ThreadVote` models; CRUD APIView; `IsModerator` + `IsOwnerOrModerator`; toggle vote; pin/lock moderation; reply bersarang; frontend `ForumListPage`/`ThreadDetailPage`/`ThreadFormPage`. |
| 1.7.0 | 2026-06-14 | Phase 7 implemented. `Pengaduan` model (UUID PK, 5 Kategori, 4 Status, JSON status_history, FileField UUID-named); `IsOwnerOrPengurus` + `CanUpdateStatus`; queryset scoping per role; foto upload validation; `notify_status_change`; frontend `PengaduanListPage`/`FormPage`/`DetailPage`. |
| 1.8.0 | 2026-06-14 | Phase 8 implemented. `Kegiatan` model (UUID PK, kuota_peserta, rsvp_buka/tutup_at, penanggung_jawab SET_NULL) + `RSVP` model (unique_together kegiatan+user, 3 status); `Poll` model (UUID PK, opsi JSONField, is_expired property, get_results()) + `Vote` model (unique_together poll+user); `IsPengurusOrAdmin`; RSVP upsert (update_or_create); double vote → 409 Conflict (IntegrityError); poll results gating (hidden sebelum deadline untuk warga); filter `KegiatanFilter` (dari/sampai) + `PollFilter` (status aktif|expired); frontend `KegiatanListPage`/`DetailPage`/`FormPage` + `PollingListPage`/`DetailPage`/`FormPage`; 7 routes App.tsx. |
