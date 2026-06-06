# Smart-RT — System Design Document (SDD)

**Version:** 1.0.0
**Date:** June 6, 2026
**Based on:** PRD v1.0.0, SRS v1.0.0
**Status:** Draft

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
│  │              Express.js Server                    │        │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────┐      │        │
│  │  │  Auth   │ │  RBAC    │ │  Rate Limit  │      │        │
│  │  │Middleware│ │Middleware│ │  Middleware  │      │        │
│  │  └─────────┘ └──────────┘ └──────────────┘      │        │
│  └────────────────────────┬─────────────────────────┘        │
│                           │                                  │
│  ┌────────────────────────┴─────────────────────────┐        │
│  │                   ROUTES                          │        │
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
│  │              Prisma ORM                           │        │
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
│  │           File Storage (Local)                    │        │
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
| **Backend** | Node.js + Express 5 | Mature, large ecosystem |
| **Language** | TypeScript 6 | Type safety, better DX |
| **ORM** | Prisma | Type-safe queries, migrations |
| **Database** | PostgreSQL 16 | Reliable, ACID, JSON support |
| **Auth** | JWT + bcrypt | Stateless, scalable |
| **File Upload** | Multer | Simple, Express-native |
| **PDF** | PDFKit | Lightweight PDF generation |
| **Validation** | Zod | Type-safe validation |
| **Deployment** | Docker + Docker Compose | Consistent environments |

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
| POST | `/api/v1/auth/logout` | Logout | JWT |
| GET | `/api/v1/auth/me` | Get current user | JWT |
| PUT | `/api/v1/auth/password` | Ganti password | JWT |

### 3.2 Warga Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/warga` | List warga (paginated, filter) | Pengurus+ |
| GET | `/api/v1/warga/:id` | Detail warga | Pengurus+ |
| POST | `/api/v1/warga` | Tambah warga | Pengurus+ |
| PUT | `/api/v1/warga/:id` | Update warga | Pengurus+ |
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
| POST | `/api/v1/iuran` | Upload bukti iuran | Warga |
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
| GET | `/api/v1/pengaduan` | List pengaduan | JWT |
| GET | `/api/v1/pengaduan/:id` | Detail pengaduan | JWT |
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
2. Server verify password (bcrypt compare)
3. Server generate JWT (access token, 24h expiry)
4. Client store JWT (httpOnly cookie or localStorage)
5. Setiap request: Authorization: Bearer <token>
6. Server verify JWT di middleware
7. Token expired → 401 → redirect login
```

### 4.2 Role-Based Access Control (RBAC)

| Role | Access |
|------|--------|
| **Admin** | Full access, hapus data, manage pengurus |
| **Pengurus** | CRUD warga, keuangan, pengumuman, forum, pengaduan, kegiatan, polling |
| **Warga** | Lihat pengumuman, upload iuran, forum, pengaduan, RSVP, vote |

### 4.3 Security Measures
- Password hashing: bcrypt (12 rounds)
- JWT secret: env variable, min 256-bit
- Rate limiting: 100 req/min per IP
- Input validation: Zod schema di semua endpoint
- SQL injection: Prisma ORM (parameterized queries)
- XSS: React auto-escape + Content-Security-Policy header
- CORS: whitelist origin
- File upload: validate type (jpg, png, pdf), max 5MB

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
- **authStore**: user, token, role, login, logout
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
localhost:3001  → Express dev server (backend)
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
│  │  │ :5173    │  │ :3001    │     │    │
│  │  └──────────┘  └──────────┘     │    │
│  │  ┌──────────────────────────┐   │    │
│  │  │     PostgreSQL :5432     │   │    │
│  │  └──────────────────────────┘   │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 6.3 Environment Variables
```env
# Backend
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@db:5432/smartrt
JWT_SECRET=your-secret-key-min-256-bits
CORS_ORIGIN=https://smartrt.yourdomain.com

# Frontend
VITE_API_URL=https://smartrt.yourdomain.com/api/v1
```

---

## 7. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-06 | Initial SDD |
