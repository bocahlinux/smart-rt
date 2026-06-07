# Smart-RT — Task Breakdown

**Version:** 1.2.0
**Date:** June 7, 2026
**Estimated Total:** 10 phases, ~16 hari kerja
**Status:** Not started

---

## Phase 0: Project Setup
**Estimated:** 1 hari
**Goal:** Initialize project structure, tooling, and base configuration

| ID | Task | Est. | Status |
|----|------|------|--------|
|| 0.1 | Create project directory structure (monorepo: frontend + backend) | 30m | ⬜ |
|| 0.2 | Initialize backend (Django + DRF + Python 3.12) | 45m | ⬜ |
|| 0.3 | Initialize frontend (Vite + React + TypeScript) | 30m | ⬜ |
|| 0.4 | Setup Tailwind CSS 4 | 20m | ⬜ |
|| 0.5 | Setup PostgreSQL connection (Django settings + .env) | 30m | ⬜ |
|| 0.6 | Setup Django apps structure (accounts, keuangan, pengumuman, forum, pengaduan, kegiatan, polling, audit, notifications) | 30m | ⬜ |
|| 0.7 | Setup SimpleJWT (access + refresh token config) | 20m | ⬜ |
|| 0.8 | Setup ESLint + Prettier (frontend) + Ruff/Black (backend) | 20m | ⬜ |
|| 0.9 | Setup Docker + docker-compose.yml (Django + PostgreSQL + Nginx) | 30m | ⬜ |
|| 0.10 | Setup PWA plugin (Vite PWA) | 20m | ⬜ |
|| 0.11 | Create .env.example for frontend & backend | 10m | ⬜ |
|| 0.12 | Setup pytest + APITestCase base config | 20m | ⬜ |
|| 0.13 | GitHub repo initialization + initial push | 20m | ⬜ |

---

## Phase 1: Authentication & Role System
**Estimated:** 2 hari
**Goal:** Complete auth system with role-based access and security hardening

| ID | Task | Est. | Status |
|----|------|------|--------|
|| 1.1 | Database schema: users table (Django AbstractUser extended) | 30m | ⬜ |
|| 1.2 | Register endpoint + validation (DRF Serializer) | 45m | ⬜ |
|| 1.3 | Login endpoint + JWT generation (access + refresh token) | 45m | ⬜ |
|| 1.4 | Auth classes (SimpleJWT authentication + custom permission) | 30m | ⬜ |
|| 1.5 | RBAC permission classes (IsAdmin, IsSekretaris, IsBendahara, IsPengurus, IsOwnerOrSekretaris, IsOwnerOrBendahara) | 45m | ⬜ |
|| 1.5a | Role-based serializer variants (Admin, Sekretaris, Bendahara, Pengurus, Warga) | 30m | ⬜ |
|| 1.5b | Field masking per role (NIK, KK, phone, email) | 20m | ⬜ |
|| 1.6 | Token refresh endpoint + rotation | 20m | ⬜ |
|| 1.7 | Logout + token blacklist | 20m | ⬜ |
|| 1.8 | Get current user endpoint | 15m | ⬜ |
|| 1.9 | Change password endpoint | 20m | ⬜ |
|| 1.10 | **Security:** Configure SimpleJWT access lifetime (15-30 min) + refresh lifetime (7-14 days) | 15m | ⬜ |
|| 1.11 | **Security:** Implement token blacklist/rotation via SimpleJWT OutstandingToken | 20m | ⬜ |
|| 1.12 | **Security:** Add login rate limit (10 attempts / 5 min per IP) | 20m | ⬜ |
|| 1.13 | **Security:** Add password strength validation (min 8 chars, uppercase, lowercase, digit) | 15m | ⬜ |
|| 1.14 | **Security:** Configure Django password hasher (Argon2 default) | 10m | ⬜ |
|| 1.15 | Frontend: Login page UI | 45m | ⬜ |
|| 1.16 | Frontend: Register page UI | 45m | ⬜ |
|| 1.17 | Frontend: Auth store (Zustand — access token in-memory only) | 30m | ⬜ |
|| 1.18 | Frontend: Protected route component | 20m | ⬜ |
|| 1.19 | Frontend: API client (axios + interceptors + refresh token flow) | 45m | ⬜ |
|| 1.20 | **Security Tests:** Auth flow testing (register → login → access → refresh → logout) | 30m | ⬜ |
|| 1.21 | **Security Tests:** Expired token → 401, invalid token → 401, reused refresh token → 401 | 20m | ⬜ |
|| 1.22 | **Security Tests:** Rate limit test (11th login attempt → 429) | 15m | ⬜ |
|| 1.23 | **Security Tests:** Password strength validation test | 15m | ⬜ |

---

## Phase 2: Data Warga
**Estimated:** 2.5 hari
**Goal:** Complete warga management with full data, object-level permission, and audit

| ID | Task | Est. | Status |
|----|------|------|--------|
|| 2.1 | Database schema: warga_profiles table (Django model) | 30m | ⬜ |
|| 2.2 | CRUD endpoints for warga (ViewSet) | 60m | ⬜ |
|| 2.3 | Search & filter endpoint | 30m | ⬜ |
|| 2.4 | Pagination endpoint | 20m | ⬜ |
|| 2.5 | Import from Excel endpoint (sekretaris/admin only) | 45m | ⬜ |
|| 2.6 | Export to Excel endpoint (sekretaris/admin only) | 30m | ⬜ |
|| 2.7 | Export to PDF — kartu keluarga (sekretaris/admin only) | 45m | ⬜ |
|| 2.8 | Warga verification endpoint (approve/reject) — sekretaris/admin | 20m | ⬜ |
|| 2.9 | Audit log for data changes (create/update/delete/verify) | 30m | ⬜ |
|| 2.10 | **Security:** Implement object-level permission (warga hanya lihat profil sendiri) | 30m | ⬜ |
|| 2.11 | **Security:** Implement field masking (NIK, no KK, phone, email per role) | 30m | ⬜ |
|| 2.12 | **Security:** Restrict export to sekretaris/admin only | 15m | ⬜ |
|| 2.13 | **Security:** Bendahara sees only masked warga data | 15m | ⬜ |
|| 2.14 | **Security:** Audit every export event (action: export, table: warga) | 15m | ⬜ |
|| 2.15 | **Security:** Mask sensitive fields by default in export (fullData=true only for admin) | 20m | ⬜ |
|| 2.16 | Frontend: Warga list page (table + filter) | 60m | ⬜ |
|| 2.17 | Frontend: Warga detail page (field visibility per role) | 45m | ⬜ |
|| 2.18 | Frontend: Warga form (create/edit) | 60m | ⬜ |
|| 2.19 | Frontend: Import/Export buttons (pengurus only) | 20m | ⬜ |
|| 2.20 | Frontend: Kartu keluarga view | 30m | ⬜ |
|| 2.21 | **Security Tests:** Warga cannot access other warga private data → 403 | 20m | ⬜ |
|| 2.22 | **Security Tests:** Field masking verification per role (5 roles) | 20m | ⬜ |
|| 2.23 | **Security Tests:** Export without sekretaris role → 403 | 10m | ⬜ |
|| 2.24 | **Security Tests:** Bendahara cannot CRUD warga data → 403 | 10m | ⬜ |
|| 2.25 | **Security Tests:** Audit log entries for all CRUD operations | 15m | ⬜ |

---

## Phase 3: Keuangan RT
**Estimated:** 2 hari
**Goal:** Financial management with manual confirmation and file upload security

| ID | Task | Est. | Status |
|----|------|------|--------|
|| 3.1 | Database schema: kategori_transaksi, transaksi, iuran_warga | 30m | ⬜ |
|| 3.2 | CRUD endpoints for transaksi (bendahara/admin only) | 45m | ⬜ |
|| 3.3 | Kategori transaksi CRUD | 20m | ⬜ |
|| 3.4 | Iuran bulanan auto-generate | 30m | ⬜ |
|| 3.5 | Upload bukti transfer endpoint | 30m | ⬜ |
|| 3.6 | Konfirmasi/tolak iuran endpoint | 20m | ⬜ |
|| 3.7 | Dashboard saldo endpoint | 20m | ⬜ |
|| 3.8 | Laporan keuangan endpoint (PDF via WeasyPrint) | 45m | ⬜ |
|| 3.9 | **Security:** Restrict bukti transfer access (only pemilik, bendahara, admin) | 20m | ⬜ |
|| 3.10 | **Security:** Bendahara cannot access data warga CRUD → 403 | 10m | ⬜ |
|| 3.11 | **Security:** Audit every confirmation/rejection of iuran (by bendahara) | 15m | ⬜ |
|| 3.12 | **Security:** Object-level permission (bendahara only access keuangan module) | 20m | ⬜ |
|| 3.13 | Frontend: Keuangan list page | 45m | ⬜ |
|| 3.14 | Frontend: Transaksi form | 30m | ⬜ |
|| 3.15 | Frontend: Upload bukti transfer (warga) | 30m | ⬜ |
|| 3.16 | Frontend: Konfirmasi iuran (pengurus) | 20m | ⬜ |
|| 3.17 | Frontend: Grafik pemasukan/pengeluaran | 45m | ⬜ |
|| 3.18 | Frontend: Laporan view + download PDF | 30m | ⬜ |
|| 3.19 | **Security Tests:** Warga cannot access other warga bukti transfer → 403 | 15m | ⬜ |
|| 3.20 | **Security Tests:** Invalid file type upload → 415, oversized file → 413 | 15m | ⬜ |
|| 3.21 | **Security Tests:** Audit log for confirmation/rejection | 10m | ⬜ |

---

## Phase 4: Pengumuman & Notifikasi
**Estimated:** 1 hari
**Goal:** Announcement system with push notifications and file upload security

| ID | Task | Est. | Status |
|----|------|------|--------|
|| 4.1 | Database schema: pengumuman | 15m | ⬜ |
|| 4.2 | CRUD endpoints for pengumuman | 30m | ⬜ |
|| 4.3 | Penjadwalan pengumuman | 20m | ⬜ |
|| 4.4 | Push notification service (Web Push) | 45m | ⬜ |
|| 4.5 | **Security:** Validate upload file type/size for pengumuman images | 15m | ⬜ |
|| 4.6 | **Security:** Restrict pengumuman CRUD to pengurus/admin | 10m | ⬜ |
|| 4.7 | Frontend: Pengumuman list page | 30m | ⬜ |
|| 4.8 | Frontend: Pengumuman detail page | 20m | ⬜ |
|| 4.9 | Frontend: Pengumuman form (pengurus) | 30m | ⬜ |
|| 4.10 | Frontend: Push notification subscription | 20m | ⬜ |
|| 4.11 | **Security Tests:** Warga cannot create/update/delete pengumuman → 403 | 10m | ⬜ |

---

## Phase 5: Forum Diskusi
**Estimated:** 1.5 hari
**Goal:** Community discussion forum with moderation

| ID | Task | Est. | Status |
|----|------|------|--------|
|| 5.1 | Database schema: threads, comments | 20m | ⬜ |
|| 5.2 | Thread CRUD endpoints | 30m | ⬜ |
|| 5.3 | Comment CRUD endpoints | 20m | ⬜ |
|| 5.4 | Moderation endpoints (pin, lock, delete) | 20m | ⬜ |
|| 5.5 | Voting dalam thread endpoint | 20m | ⬜ |
|| 5.6 | **Security:** Object-level permission (owner can edit own thread/comment) | 15m | ⬜ |
|| 5.7 | **Security:** Moderation restricted to pengurus/admin | 10m | ⬜ |
|| 5.8 | Frontend: Forum list page (thread list) | 45m | ⬜ |
|| 5.9 | Frontend: Thread detail + comments | 45m | ⬜ |
|| 5.10 | Frontend: Create thread form | 20m | ⬜ |
|| 5.11 | Frontend: Comment form + reply | 20m | ⬜ |
|| 5.12 | Frontend: Moderation controls (pengurus) | 15m | ⬜ |
|| 5.13 | **Security Tests:** Non-owner cannot edit/delete other's thread → 403 | 10m | ⬜ |
|| 5.14 | **Security Tests:** Non-pengurus cannot moderate → 403 | 10m | ⬜ |

---

## Phase 6: Pengaduan Warga
**Estimated:** 1.5 hari
**Goal:** Complaint management with status tracking and privacy

| ID | Task | Est. | Status |
|----|------|------|--------|
|| 6.1 | Database schema: pengaduan | 15m | ⬜ |
|| 6.2 | CRUD endpoints for pengaduan | 30m | ⬜ |
|| 6.3 | Update status endpoint | 15m | ⬜ |
|| 6.4 | Notifikasi perubahan status | 20m | ⬜ |
|| 6.5 | Filter by status endpoint | 15m | ⬜ |
|| 6.6 | **Security:** Object-level permission (pelapor only access own pengaduan) | 20m | ⬜ |
|| 6.7 | **Security:** Pengaduan sensitif tidak tampil publik | 15m | ⬜ |
|| 6.8 | **Security:** Validate upload file (foto pengaduan) — MIME, size, random filename | 15m | ⬜ |
|| 6.9 | **Security:** Audit log for status changes | 10m | ⬜ |
|| 6.10 | Frontend: Pengaduan list page (filtered by role) | 30m | ⬜ |
|| 6.11 | Frontend: Pengaduan form (warga) | 30m | ⬜ |
|| 6.12 | Frontend: Pengaduan detail + status tracking | 30m | ⬜ |
|| 6.13 | Frontend: Update status (pengurus) | 15m | ⬜ |
|| 6.14 | Frontend: Filter by status | 15m | ⬜ |
|| 6.15 | **Security Tests:** Warga cannot access other warga pengaduan → 403 | 15m | ⬜ |
|| 6.16 | **Security Tests:** Pengaduan sensitif not visible to other warga | 10m | ⬜ |

---

## Phase 7: Kegiatan & Polling
**Estimated:** 1.5 hari
**Goal:** Events calendar and voting system with access control

| ID | Task | Est. | Status |
|----|------|------|--------|
|| 7.1 | Database schema: kegiatan, rsvp | 15m | ⬜ |
|| 7.2 | Kegiatan CRUD endpoints | 30m | ⬜ |
|| 7.3 | RSVP endpoint | 15m | ⬜ |
|| 7.4 | Database schema: polls, votes | 15m | ⬜ |
|| 7.5 | Poll CRUD endpoints | 30m | ⬜ |
|| 7.6 | Vote endpoint (1 user = 1 vote) | 20m | ⬜ |
|| 7.7 | **Security:** Restrict kegiatan/poll CRUD to pengurus/admin | 10m | ⬜ |
|| 7.8 | **Security:** Prevent double voting (unique_together constraint) | 10m | ⬜ |
|| 7.9 | **Security:** Poll results only visible after deadline or to pengurus | 10m | ⬜ |
|| 7.10 | Frontend: Kalender kegiatan | 45m | ⬜ |
|| 7.11 | Frontend: Kegiatan detail + RSVP | 20m | ⬜ |
|| 7.12 | Frontend: Poll list + vote | 30m | ⬜ |
|| 7.13 | Frontend: Poll result (grafik) | 20m | ⬜ |
|| 7.14 | **Security Tests:** Double vote → 409 Conflict | 10m | ⬜ |
|| 7.15 | **Security Tests:** Non-pengurus cannot create poll → 403 | 10m | ⬜ |

---

## Phase 8: Dashboard & Laporan
**Estimated:** 1 hari
**Goal:** Role-based dashboard and report generation with data protection

| ID | Task | Est. | Status |
|----|------|------|--------|
|| 8.1 | Dashboard pengurus endpoint (statistik agregat) | 30m | ⬜ |
|| 8.2 | Dashboard warga endpoint (own data only) | 20m | ⬜ |
|| 8.3 | Laporan PDF generation service (WeasyPrint) | 45m | ⬜ |
|| 8.4 | **Security:** Dashboard data filtered by role (warga only see own stats) | 15m | ⬜ |
|| 8.5 | **Security:** Laporan restricted to pengurus/admin | 10m | ⬜ |
|| 8.6 | **Security:** Audit log for report generation | 10m | ⬜ |
|| 8.7 | Frontend: Dashboard pengurus | 45m | ⬜ |
|| 8.8 | Frontend: Dashboard warga | 30m | ⬜ |
|| 8.9 | Frontend: Grafik statistik | 30m | ⬜ |
|| 8.10 | Frontend: Laporan view + download | 20m | ⬜ |
|| 8.11 | **Security Tests:** Warga cannot access pengurus dashboard → 403 | 10m | ⬜ |
|| 8.12 | **Security Tests:** Audit log for each report download | 10m | ⬜ |

---

## Phase 9: Polish, Testing & Deployment
**Estimated:** 2 hari
**Goal:** Testing, PWA, security hardening, and production deployment

| ID | Task | Est. | Status |
|----|------|------|--------|
|| 9.1 | Backend unit tests (auth, warga, keuangan models) | 60m | ⬜ |
|| 9.2 | Backend integration tests (API endpoints) | 60m | ⬜ |
|| 9.3 | **Security Tests:** IDOR tests (change UUID in URL → 403) | 30m | ⬜ |
|| 9.4 | **Security Tests:** RBAC tests (each role → correct access) | 30m | ⬜ |
|| 9.5 | **Security Tests:** Token tests (expired, invalid, reused, blacklisted) | 20m | ⬜ |
|| 9.6 | **Security Tests:** File upload tests (invalid MIME, oversized, random filename) | 20m | ⬜ |
|| 9.7 | **Security Tests:** Audit log verification for all sensitive operations | 20m | ⬜ |
|| 9.8 | Frontend component tests | 45m | ⬜ |
|| 9.9 | PWA: Service worker + offline cache | 30m | ⬜ |
|| 9.10 | PWA: Install prompt + manifest | 20m | ⬜ |
|| 9.11 | Responsive design fix (mobile) | 45m | ⬜ |
|| 9.12 | Accessibility audit + fix (WCAG 2.1 AA) | 30m | ⬜ |
|| 9.13 | Performance optimization | 30m | ⬜ |
|| 9.14 | **Security:** Security headers (HSTS, X-Content-Type-Options, X-Frame-Options) | 15m | ⬜ |
|| 9.15 | **Security:** Django SecurityMiddleware configuration | 15m | ⬜ |
|| 9.16 | **Security:** Backup encryption setup (GPG AES256) | 15m | ⬜ |
|| 9.17 | Docker production setup | 30m | ⬜ |
|| 9.18 | Deployment to VPS | 30m | ⬜ |
|| 9.19 | README + documentation | 30m | ⬜ |
|| 9.20 | Final verification + bug fix | 30m | ⬜ |

---

## Summary

| Phase | Name | Est. Days | Tasks | Status |
|-------|------|-----------|-------|--------|
|| 0 | Project Setup | 1 | 13 | ⬜ |
|| 1 | Authentication & Role System | 2 | 23 | ⬜ |
|| 2 | Data Warga | 2.5 | 25 | ⬜ |
|| 3 | Keuangan RT | 2 | 21 | ⬜ |
|| 4 | Pengumuman & Notifikasi | 1 | 11 | ⬜ |
|| 5 | Forum Diskusi | 1.5 | 14 | ⬜ |
|| 6 | Pengaduan Warga | 1.5 | 16 | ⬜ |
|| 7 | Kegiatan & Polling | 1.5 | 15 | ⬜ |
|| 8 | Dashboard & Laporan | 1 | 12 | ⬜ |
|| 9 | Polish, Testing & Deployment | 2 | 20 | ⬜ |
|| **Total** | | **~16 days** | **170** | |

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
           │          └── Data warga + object-level permission + masking
           └── Auth, RBAC, token rotation, rate limit
```

---

## Security Checklist per Phase

### Phase 1 — Auth
- [ ] SimpleJWT access/refresh lifetime configured
- [ ] Token blacklist/rotation implemented
- [ ] Login rate limit (10 attempts / 5 min)
- [ ] Password strength validation
- [ ] Django Argon2 password hasher
- [ ] Tests: expired/invalid/reused token → 401
- [ ] Tests: rate limit → 429

### Phase 2 — Data Warga
- [ ] Object-level permission (warga only own profile)
- [ ] Field masking (NIK, no KK, phone, email per role)
- [ ] Export restricted to pengurus/admin
- [ ] Audit log for all CRUD + export
- [ ] Mask sensitive fields in export by default
- [ ] Tests: warga cannot access other warga data → 403

### Phase 3 — Keuangan
- [ ] Bukti transfer access restricted (owner + pengurus keuangan)
- [ ] File upload validation (MIME, extension, size)
- [ ] Random UUID filename for uploads
- [ ] Audit log for confirmation/rejection
- [ ] Object-level permission (warga only own iuran)
- [ ] Tests: invalid file type → 415, oversized → 413

### Phase 4 — Pengumuman
- [ ] File upload validation for images
- [ ] CRUD restricted to pengurus/admin
- [ ] Tests: warga cannot create pengumuman → 403

### Phase 5 — Forum
- [ ] Object-level permission (owner edit own content)
- [ ] Moderation restricted to pengurus/admin
- [ ] Tests: non-owner cannot edit → 403

### Phase 6 — Pengaduan
- [ ] Object-level permission (pelapor only own pengaduan)
- [ ] Pengaduan sensitif not public
- [ ] File upload validation for photos
- [ ] Audit log for status changes
- [ ] Tests: warga cannot access other pengaduan → 403

### Phase 7 — Kegiatan & Polling
- [ ] CRUD restricted to pengurus/admin
- [ ] Double vote prevention
- [ ] Tests: double vote → 409

### Phase 8 — Dashboard & Laporan
- [ ] Dashboard data filtered by role
- [ ] Laporan restricted to pengurus/admin
- [ ] Audit log for report generation
- [ ] Tests: warga cannot access pengurus dashboard → 403

### Phase 9 — Polish & Deployment
- [ ] IDOR tests (change UUID → 403)
- [ ] RBAC tests (each role)
- [ ] Token tests (expired/invalid/reused/blacklisted)
- [ ] File upload tests
- [ ] Security headers (HSTS, X-Content-Type-Options, X-Frame-Options)
- [ ] Backup encryption (GPG AES256)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
|| 1.0.0 | 2026-06-06 | Initial Task Breakdown |
|| 1.1.0 | 2026-06-07 | Migrated from Express/Prisma/TypeScript to Django/DRF/Python. Added security tasks per phase (token config, rate limit, object-level permission, field masking, file upload validation, audit log). Added security checklist per phase. Added security test tasks. Updated task counts and estimates. |
|| 1.2.0 | 2026-06-08 | Fixed duplicate task IDs in Phase 2 (2.15) and Phase 3 (3.2, 3.9). Renumbered affected tasks. Normalized all table rows to use 2 pipes (||). Updated phase count from 9 to 10. Adjusted total tasks from 169 to 170 and estimated days to ~16. |
