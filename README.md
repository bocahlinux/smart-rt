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

### 👤 Multi-Role Authentication
- Register dengan email/no. HP → akun status `pending`
- Verifikasi oleh pengurus → approve untuk aktifkan akun
- Login hanya bisa setelah akun aktif
- 5 role: **Admin** (Ketua RT), **Sekretaris**, **Bendahara**, **Pengurus**, **Warga**
- JWT-based authentication

### 📋 Data Warga
- Data lengkap: NIK, nama, TTL, jenis kelamin, agama, status perkawinan, pendidikan, pekerjaan, no. HP, email, foto
- Data keluarga: No. KK, hubungan, alamat lengkap
- Import dari Excel, export ke Excel/PDF
- Kartu keluarga digital
- Audit log perubahan data

### 💰 Keuangan RT
- Pencatatan pemasukan & pengeluaran
- Upload bukti transfer + konfirmasi manual
- Dashboard saldo real-time
- Laporan keuangan otomatis (PDF)
- Grafik pemasukan vs pengeluaran

### 📢 Pengumuman & Notifikasi
- Buat pengumuman dengan kategori
- Push notification ke warga (Web Push PWA)
- Penjadwalan pengumuman
- Riwayat pengumuman

### 💬 Forum Diskusi
- Thread per topik dengan kategori
- Komentar & balasan
- Voting/polling dalam thread
- Moderasi oleh pengurus

### 📝 Pengaduan Warga
- Form pengaduan dengan upload foto
- Tracking status: Diterima → Diproses → Selesai / Ditolak
- Notifikasi perubahan status
- Riwayat pengaduan

### 📅 Kegiatan & Kalender
- Kalender kegiatan RT
- RSVP/tanda hadir
- Notifikasi reminder
- Dokumentasi foto

### 📊 Polling & Voting
- Buat poling dengan deadline
- 1 warga = 1 suara
- Hasil real-time dengan grafik

### 📈 Dashboard & Laporan
- Dashboard pengurus: statistik warga, keuangan, pengaduan aktif
- Dashboard warga: status iuran, pengumuman terbaru
- Laporan otomatis (PDF)

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Django** | 5.x | Web framework |
| **Django REST Framework** | 3.x | API development |
| **Python** | 3.12 | Programming language |
| **PostgreSQL** | 16 | Database |
| **Django ORM** | built-in | Object-relational mapping |
| **SimpleJWT** | 5.x | JWT authentication |
| **WeasyPrint** | 60.x | PDF generation |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.x | UI library |
| **Vite** | 8.x | Build tool |
| **TypeScript** | 6.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS |
| **Zustand** | 5.x | State management |
| **Vite PWA** | latest | Progressive Web App |

### DevOps
| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-service orchestration |
| **Nginx** | Reverse proxy |

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

| Dokumen | Deskripsi |
|---------|-----------|
| [01-PRD.md](docs/01-PRD.md) | Product Requirements Document |
| [02-SRS.md](docs/02-SRS.md) | Software Requirements Specification |
| [03-UIUX-Flow.md](docs/03-UIUX-Flow.md) | UI/UX Flow & Design |
| [04-SDD.md](docs/04-SDD.md) | System Design Document |
| [05-DATABASE.md](docs/05-DATABASE.md) | Database Design & Django Models |
| [06-API-CONTRACT.md](docs/06-API-CONTRACT.md) | API Contract Specification |
| [07-TASK-BREAKDOWN.md](docs/07-TASK-BREAKDOWN.md) | Task Breakdown & Estimation |
| [08-CODING-STANDART.md](docs/08-CODING-STANDART.md) | Coding Standard & Conventions |
| [09-TEST-PLAN.md](docs/09-TEST-PLAN.md) | Test Plan & Coverage |
| [10-AI-RULES.md](docs/10-AI-RULES.md) | AI Development Rules |
| [11-SECURITY.md](docs/11-SECURITY.md) | Security & Privacy Policy |
| [12-CICD.md](docs/12-CICD.md) | CI/CD Pipeline & Deployment |
| [13-MONITORING.md](docs/13-MONITORING.md) | Monitoring & Observability |

---

## 🗺 Roadmap

| Phase | Fokus | Status |
|-------|-------|--------|
| 1 | Project Setup | ✅ Done |
| 2 | Authentication & Role System | ✅ Done |
| 3 | Data Warga | ⬜ Pending |
| 4 | Keuangan RT | ⬜ Pending |
| 5 | Pengumuman & Notifikasi | ⬜ Pending |
| 6 | Forum Diskusi | ⬜ Pending |
| 7 | Pengaduan Warga | ⬜ Pending |
| 8 | Kegiatan & Polling | ⬜ Pending |
| 9 | Dashboard & Laporan | ⬜ Pending |
| 10 | Polish, Testing & Deployment | ⬜ Pending |

---

## 📊 Development Status

> **Last updated:** June 7, 2026

### Overall Progress

```
Phase 1-2     ████████████████████  100%  ✅
Phase 3-10    ░░░░░░░░░░░░░░░░░░░░  0%
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
| 3 | Data Warga | ⬜ Pending | — |
| 4 | Keuangan RT | ⬜ Pending | — |
| 5 | Pengumuman & Notifikasi | ⬜ Pending | — |
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

### Upcoming Milestones

- ⬜ **v0.3.0** — Data Warga
- ⬜ **v0.4.0** — Keuangan RT
- ⬜ **v0.5.0** — Pengumuman & Notifikasi
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
