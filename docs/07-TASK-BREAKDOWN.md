# Smart-RT — Task Breakdown

**Version:** 1.0.0
**Date:** June 6, 2026
**Estimated Total:** 9 phases, ~25-30 hari kerja
**Status:** Not started

---

## Phase 0: Project Setup
**Estimated:** 1 hari
**Goal:** Initialize project structure, tooling, and base configuration

| ID | Task | Est. | Status |
|----|------|------|--------|
| 0.1 | Create project directory structure (monorepo: frontend + backend) | 30m | ⬜ |
| 0.2 | Initialize backend (Node.js + Express + TypeScript) | 30m | ⬜ |
| 0.3 | Initialize frontend (Vite + React + TypeScript) | 30m | ⬜ |
| 0.4 | Setup Tailwind CSS 4 | 20m | ⬜ |
| 0.5 | Setup Prisma + PostgreSQL connection | 30m | ⬜ |
| 0.6 | Setup ESLint + Prettier | 20m | ⬜ |
| 0.7 | Setup Docker + docker-compose.yml | 30m | ⬜ |
| 0.8 | Setup PWA plugin (Vite PWA) | 20m | ⬜ |
| 0.9 | Create .env.example for frontend & backend | 10m | ⬜ |
| 0.10 | GitHub repo initialization + initial push | 20m | ⬜ |

## Phase 1: Authentication & Role System
**Estimated:** 2 hari
**Goal:** Complete auth system with role-based access

| ID | Task | Est. | Status |
|----|------|------|--------|
| 1.1 | Database schema: users table (Prisma) | 30m | ⬜ |
| 1.2 | Register endpoint + validation (Zod) | 45m | ⬜ |
| 1.3 | Login endpoint + JWT generation | 45m | ⬜ |
| 1.4 | Auth middleware (verify JWT) | 30m | ⬜ |
| 1.5 | RBAC middleware (admin, pengurus, warga) | 30m | ⬜ |
| 1.6 | Logout + token blacklist | 20m | ⬜ |
| 1.7 | Get current user endpoint | 15m | ⬜ |
| 1.8 | Change password endpoint | 20m | ⬜ |
| 1.9 | Frontend: Login page UI | 45m | ⬜ |
| 1.10 | Frontend: Register page UI | 45m | ⬜ |
| 1.11 | Frontend: Auth store (Zustand) | 30m | ⬜ |
| 1.12 | Frontend: Protected route component | 20m | ⬜ |
| 1.13 | Frontend: API client (axios + interceptors) | 30m | ⬜ |
| 1.14 | Auth flow testing (register → login → access) | 30m | ⬜ |

## Phase 2: Data Warga
**Estimated:** 2 hari
**Goal:** Complete warga management with full data

| ID | Task | Est. | Status |
|----|------|------|--------|
| 2.1 | Database schema: warga_profiles table | 30m | ⬜ |
| 2.2 | CRUD endpoints for warga | 60m | ⬜ |
| 2.3 | Search & filter endpoint | 30m | ⬜ |
| 2.4 | Pagination endpoint | 20m | ⬜ |
| 2.5 | Import from Excel endpoint | 45m | ⬜ |
| 2.6 | Export to Excel endpoint | 30m | ⬜ |
| 2.7 | Export to PDF (kartu keluarga) | 45m | ⬜ |
| 2.8 | Warga verification endpoint | 20m | ⬜ |
| 2.9 | Audit log for data changes | 30m | ⬜ |
| 2.10 | Frontend: Warga list page (table + filter) | 60m | ⬜ |
| 2.11 | Frontend: Warga detail page | 45m | ⬜ |
| 2.12 | Frontend: Warga form (create/edit) | 60m | ⬜ |
| 2.13 | Frontend: Import/Export buttons | 20m | ⬜ |
| 2.14 | Frontend: Kartu keluarga view | 30m | ⬜ |

## Phase 3: Keuangan RT
**Estimated:** 2 hari
**Goal:** Financial management with manual confirmation

| ID | Task | Est. | Status |
|----|------|------|--------|
| 3.1 | Database schema: kategori_transaksi, transaksi, iuran_warga | 30m | ⬜ |
| 3.2 | CRUD endpoints for transaksi | 45m | ⬜ |
| 3.3 | Kategori transaksi CRUD | 20m | ⬜ |
| 3.4 | Iuran bulanan auto-generate | 30m | ⬜ |
| 3.5 | Upload bukti transfer endpoint | 30m | ⬜ |
| 3.6 | Konfirmasi/tolak iuran endpoint | 20m | ⬜ |
| 3.7 | Dashboard saldo endpoint | 20m | ⬜ |
| 3.8 | Laporan keuangan endpoint (PDF) | 45m | ⬜ |
| 3.9 | Frontend: Keuangan list page | 45m | ⬜ |
| 3.10 | Frontend: Transaksi form | 30m | ⬜ |
| 3.11 | Frontend: Upload bukti transfer (warga) | 30m | ⬜ |
| 3.12 | Frontend: Konfirmasi iuran (pengurus) | 20m | ⬜ |
| 3.13 | Frontend: Grafik pemasukan/pengeluaran | 45m | ⬜ |
| 3.14 | Frontend: Laporan view + download PDF | 30m | ⬜ |

## Phase 4: Pengumuman & Notifikasi
**Estimated:** 1 hari
**Goal:** Announcement system with push notifications

| ID | Task | Est. | Status |
|----|------|------|--------|
| 4.1 | Database schema: pengumuman | 15m | ⬜ |
| 4.2 | CRUD endpoints for pengumuman | 30m | ⬜ |
| 4.3 | Penjadwalan pengumuman | 20m | ⬜ |
| 4.4 | Push notification service (Web Push) | 45m | ⬜ |
| 4.5 | Frontend: Pengumuman list page | 30m | ⬜ |
| 4.6 | Frontend: Pengumuman detail page | 20m | ⬜ |
| 4.7 | Frontend: Pengumuman form (pengurus) | 30m | ⬜ |
| 4.8 | Frontend: Push notification subscription | 20m | ⬜ |

## Phase 5: Forum Diskusi
**Estimated:** 2 hari
**Goal:** Community discussion forum

| ID | Task | Est. | Status |
|----|------|------|--------|
| 5.1 | Database schema: threads, comments | 20m | ⬜ |
| 5.2 | Thread CRUD endpoints | 30m | ⬜ |
| 5.3 | Comment CRUD endpoints | 20m | ⬜ |
| 5.4 | Moderation endpoints (pin, lock, delete) | 20m | ⬜ |
| 5.5 | Voting dalam thread endpoint | 20m | ⬜ |
| 5.6 | Frontend: Forum list page (thread list) | 45m | ⬜ |
| 5.7 | Frontend: Thread detail + comments | 45m | ⬜ |
| 5.8 | Frontend: Create thread form | 20m | ⬜ |
| 5.9 | Frontend: Comment form + reply | 20m | ⬜ |
| 5.10 | Frontend: Moderation controls | 15m | ⬜ |

## Phase 6: Pengaduan Warga
**Estimated:** 1.5 hari
**Goal:** Complaint management with status tracking

| ID | Task | Est. | Status |
|----|------|------|--------|
| 6.1 | Database schema: pengaduan | 15m | ⬜ |
| 6.2 | CRUD endpoints for pengaduan | 30m | ⬜ |
| 6.3 | Update status endpoint | 15m | ⬜ |
| 6.4 | Notifikasi perubahan status | 20m | ⬜ |
| 6.5 | Filter by status endpoint | 15m | ⬜ |
| 6.6 | Frontend: Pengaduan list page | 30m | ⬜ |
| 6.7 | Frontend: Pengaduan form (warga) | 30m | ⬜ |
| 6.8 | Frontend: Pengaduan detail + status tracking | 30m | ⬜ |
| 6.9 | Frontend: Update status (pengurus) | 15m | ⬜ |
| 6.10 | Frontend: Filter by status | 15m | ⬜ |

## Phase 7: Kegiatan & Polling
**Estimated:** 1.5 hari
**Goal:** Events calendar and voting system

| ID | Task | Est. | Status |
|----|------|------|--------|
| 7.1 | Database schema: kegiatan, rsvp | 15m | ⬜ |
| 7.2 | Kegiatan CRUD endpoints | 30m | ⬜ |
| 7.3 | RSVP endpoint | 15m | ⬜ |
| 7.4 | Database schema: polls, votes | 15m | ⬜ |
| 7.5 | Poll CRUD endpoints | 30m | ⬜ |
| 7.6 | Vote endpoint (1 user = 1 vote) | 20m | ⬜ |
| 7.7 | Frontend: Kalender kegiatan | 45m | ⬜ |
| 7.8 | Frontend: Kegiatan detail + RSVP | 20m | ⬜ |
| 7.9 | Frontend: Poll list + vote | 30m | ⬜ |
| 7.10 | Frontend: Poll result (grafik) | 20m | ⬜ |

## Phase 8: Dashboard & Laporan
**Estimated:** 1 hari
**Goal:** Role-based dashboard and report generation

| ID | Task | Est. | Status |
|----|------|------|--------|
| 8.1 | Dashboard pengurus endpoint (statistik) | 30m | ⬜ |
| 8.2 | Dashboard warga endpoint | 20m | ⬜ |
| 8.3 | Laporan PDF generation service | 45m | ⬜ |
| 8.4 | Frontend: Dashboard pengurus | 45m | ⬜ |
| 8.5 | Frontend: Dashboard warga | 30m | ⬜ |
| 8.6 | Frontend: Grafik statistik | 30m | ⬜ |
| 8.7 | Frontend: Laporan view + download | 20m | ⬜ |

## Phase 9: Polish, Testing & Deployment
**Estimated:** 2 hari
**Goal:** Testing, PWA, and production deployment

| ID | Task | Est. | Status |
|----|------|------|--------|
| 9.1 | Backend unit tests (auth, warga, keuangan) | 60m | ⬜ |
| 9.2 | Backend integration tests | 45m | ⬜ |
| 9.3 | Frontend component tests | 45m | ⬜ |
| 9.4 | PWA: Service worker + offline cache | 30m | ⬜ |
| 9.5 | PWA: Install prompt + manifest | 20m | ⬜ |
| 9.6 | Responsive design fix (mobile) | 45m | ⬜ |
| 9.7 | Accessibility audit + fix | 30m | ⬜ |
| 9.8 | Performance optimization | 30m | ⬜ |
| 9.9 | Docker production setup | 30m | ⬜ |
| 9.10 | Deployment to VPS | 30m | ⬜ |
| 9.11 | README + documentation | 30m | ⬜ |
| 9.12 | Final verification + bug fix | 30m | ⬜ |

---

## Summary

| Phase | Name | Est. Days | Tasks | Status |
|-------|------|-----------|-------|--------|
| 0 | Project Setup | 1h | 10 | ⬜ |
| 1 | Authentication & Role System | 2h | 14 | ⬜ |
| 2 | Data Warga | 2h | 14 | ⬜ |
| 3 | Keuangan RT | 2h | 14 | ⬜ |
| 4 | Pengumuman & Notifikasi | 1h | 8 | ⬜ |
| 5 | Forum Diskusi | 2h | 10 | ⬜ |
| 6 | Pengaduan Warga | 1.5h | 10 | ⬜ |
| 7 | Kegiatan & Polling | 1.5h | 10 | ⬜ |
| 8 | Dashboard & Laporan | 1h | 7 | ⬜ |
| 9 | Polish, Testing & Deployment | 2h | 12 | ⬜ |
| **Total** | | **~16.5h** | **109** | |

---

## Execution Order

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9
           │          │          │          │          │          │          │          │
           │          │          │          │          │          │          │          └── Dashboard, laporan
           │          │          │          │          │          │          └── Kegiatan, polling
           │          │          │          │          │          └── Pengaduan
           │          │          │          │          └── Forum
           │          │          │          └── Pengumuman, notifikasi
           │          │          └── Keuangan
           │          └── Data warga
           └── Auth, role system
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-06 | Initial Task Breakdown |
