# Smart-RT — AI Development Rules

**Version:** 1.5.0
**Date:** June 7, 2026
**Untuk:** AI Assistant
**Status:** Active

---

> **Security Reference:** Untuk semua kebijakan keamanan dan privasi, lihat **[docs/11-SECURITY.md](docs/11-SECURITY.md)** sebagai source of truth. Dokumen ini memuat data classification, permission matrix, field visibility matrix, auth policy, file upload security, backup security, audit logging, dan incident response.

## 1. Project Context

- **Nama:** Smart-RT
- **Deskripsi:** Platform digital untuk pengelolaan Rukun Tetangga (RT)
- **Stack:** Django + DRF (backend), React + Vite + TypeScript (frontend), PostgreSQL
- **Arsitektur:** Monorepo dengan backend/ dan frontend/ terpisah
- **Target:** Web-based + PWA (desktop & mobile)

### Struktur Folder
```
smart-rt/
├── backend/          # Django project
│   ├── accounts/     # Auth & user management
│   ├── keuangan/     # Financial management
│   ├── pengumuman/   # Announcements
│   ├── forum/        # Discussion forum
│   ├── pengaduan/    # Complaints
│   ├── kegiatan/     # Events
│   ├── polling/      # Polling
│   ├── audit/        # Audit logs
│   ├── notifications/# Push notifications
│   └── config/       # Django settings
├── frontend/         # React project
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
├── docs/             # Documentation
└── docker-compose.yml
```

---

## 2. Canonical Stack

- Backend: Django 5.x + Django REST Framework
- Auth: SimpleJWT (5 role: admin, sekretaris, bendahara, pengurus, warga)
- Database: PostgreSQL 16 via Django ORM
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS
- PDF: WeasyPrint
- Deployment: Docker Compose + Nginx

---

## 3. Development Rules

### 3.1 Keputusan
- **KAMU TIDAK BOLEH PUTUSKAN SENDIRI** untuk keputusan non-trivial
- Selalu konsultasi dengan user (Yudha/BocahLinux) sebelum memilih approach
- Untuk keputusan low-risk, langsung lapor hasilnya

### 3.2 Kualitas
- **Quality over speed** — pelan tapi pasti
- Tidak boleh ada bug minor maupun major
- Pastikan perubahan tidak break fase sebelumnya
- Regression check setelah setiap task

### 3.3 Memory & Skills
- Update memory setelah task kompleks
- Update skill jika menemukan pattern baru
- Jangan biarkan docs stale

---

## 4. Documentation & Source of Truth Rules

- Sebelum mengerjakan task, baca dokumen relevan sesuai urutan:
  1. PRD
  2. SRS
  3. UI/UX Flow
  4. SDD
  5. Database
  6. API Contract
  7. Task Breakdown
  8. Coding Standard
  9. Test Plan
  10. AI Rules
  11. Security Policy (11-SECURITY.md)
  12. CI/CD Pipeline (12-CICD.md) — terutama untuk task Phase 1 & Phase 10
  13. Monitoring & Observability (13-MONITORING.md) — terutama untuk task Phase 10
- Jika ada konflik antar dokumen, jangan ambil keputusan sendiri.
- Laporkan konflik dengan file dan section terkait.
- Tunggu keputusan user sebelum implementasi.
- Setelah keputusan dibuat, update dokumen agar konsisten.

---

## 5. Security & Privacy Rules

- Data warga seperti NIK, no KK, alamat, nomor HP, email, dan foto adalah data sensitif.
- Jangan expose data sensitif ke role yang tidak berhak.
- Gunakan RBAC di semua endpoint.
- Perubahan data sensitif wajib dicatat di audit log.
- Upload file wajib validasi MIME type, extension, dan ukuran.
- Secret, token, password, dan private key tidak boleh masuk repository.

---

## 6. Backend Code Generation Rules (Django)

### 6.1 Model
- Selalu gunakan Django ORM, tidak raw SQL
- Selalu buat migration untuk schema change
- Gunakan `select_related` / `prefetch_related` untuk optimasi query
- Selalu handle relasi dengan benar (on_delete, related_name)

### 6.2 Serializer
- Validasi input di serializer, bukan di view
- Gunakan `read_only_fields` untuk field auto-generated
- Custom validation dengan `validate_{field_name}`

### 6.3 View
- Gunakan ViewSet, bukan APIView manual
- Override `get_queryset` untuk filter/search
- Override `get_permissions` untuk RBAC
- Gunakan `@action` untuk custom endpoint

### 6.4 Error Handling
- Raise `NotFound` untuk data tidak ditemukan
- Raise `ValidationError` untuk input tidak valid
- Selalu return format: `{ status: "error", message: "...", errors: [] }`

### 6.5 Testing
- Write tests alongside code (TDD)
- Gunakan Django TestCase & APITestCase
- Test edge cases, bukan cuma happy path
- Coverage minimum 80%

---

## 7. Frontend Code Generation Rules (React)

### 7.1 Component
- Selalu TypeScript, no `any`
- Komponen harus reusable
- Mobile-first responsive design
- Selalu handle loading & error state

### 7.2 State Management
- Zustand untuk global state
- Local state untuk UI-only state
- Jangan over-engineer state

### 7.3 API Client
- Axios dengan interceptors
- Base URL dari env variable (`import.meta.env.VITE_API_BASE_URL`)
- Error handling terpusat

### 7.4 Styling
- Tailwind CSS utility classes
- Tidak inline styles
- Dark mode support

---

## 8. Database Rules

- Selalu gunakan Django ORM
- Selalu buat migration untuk schema change
- Jangan hapus kolom tanpa migration
- Gunakan `unique_together` untuk composite unique constraint
- Index field yang sering di-filter/search

---

## 9. API Consistency Rules

- Semua endpoint wajib mengikuti Standard Response Format di docs/06-API-CONTRACT.md.
- Pagination, error format, dan status code harus konsisten.
- Jika format response perlu berubah, update API Contract terlebih dahulu atau minta approval user.

---

## 10. File Naming Rules

- **Python:** `snake_case.py` (models.py, serializers.py, views.py)
- **Django apps:** lowercase (accounts, keuangan)
- **Components:** `PascalCase.tsx` (WargaTable.tsx)
- **Hooks:** `useCamelCase.ts` (useAuth.ts)
- **Stores:** `camelCaseStore.ts` (authStore.ts)
- **Tests:** `test_*.py` (backend), `*.test.tsx` (frontend)

---

## 11. Git Conventions

### Branch Naming
- `main` — Production-ready
- `develop` — Integration branch
- `feature/nama-fitur` — New feature
- `fix/nama-bug` — Bug fix
- `docs/nama-update` — Documentation

### Commit Messages (Conventional Commits)
```
feat: add warga CRUD endpoints
fix: resolve auth token expiration issue
docs: update API contract for keuangan
refactor: extract validation logic to serializer
test: add unit tests for warga model
chore: update dependencies
```

---

## 12. Implementation Workflow

- Implementasi mengikuti phase di Task Breakdown.
- Jangan lompat phase tanpa approval.
- Setiap task selesai harus mencakup:
  - code implementation
  - migration jika schema berubah
  - test relevan
  - docs update jika behavior/API/schema berubah
  - regression check

---

## 13. Communication Style

- Progress pakai **checklist format**
- Bahasa: **mix Indonesian-English**, casual tapi profesional
- Kalau ada blocker, langsung bilang jangan diem
- Laporan hasil: concise, jelas, tidak bertele-tele

---

## 14. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-07 | Initial AI rules |
| 1.1.0 | 2026-06-07 | Added Canonical Stack, Documentation & Source of Truth, Security & Privacy, API Consistency, and Implementation Workflow sections. Renumbered all sections. |
| 1.2.0 | 2026-06-07 | Added Security Reference pointer to docs/11-SECURITY.md. |
| 1.3.0 | 2026-06-07 | Updated Canonical Stack to specify 5 roles (admin, sekretaris, bendahara, pengurus, warga). |
| 1.4.0 | 2026-06-07 | Updated Authentication section with 5-role permission matrix. Added role-specific endpoint annotations. Updated field visibility table to 6 columns. |
| 1.5.0 | 2026-06-07 | Added docs/12-CICD.md and docs/13-MONITORING.md to the Documentation & Source of Truth reading order (§4). |
