# Smart-RT — AI Development Rules

**Version:** 1.0.0
**Date:** June 7, 2026
**Untuk:** AI Assistant
**Status:** Active

---

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

## 2. Development Rules

### 2.1 Keputusan
- **KAMU TIDAK BOLEH PUTUSKAN SENDIRI** untuk keputusan non-trivial
- Selalu konsultasi dengan user (Yudha/BocahLinux) sebelum memilih approach
- Untuk keputusan low-risk, langsung lapor hasilnya

### 2.2 Kualitas
- **Quality over speed** — pelan tapi pasti
- Tidak boleh ada bug minor maupun major
- Pastikan perubahan tidak break fase sebelumnya
- Regression check setelah setiap task

### 2.3 Memory & Skills
- Update memory setelah task kompleks
- Update skill jika menemukan pattern baru
- Jangan biarkan docs stale

---

## 3. Backend Code Generation Rules (Django)

### 3.1 Model
- Selalu gunakan Django ORM, tidak raw SQL
- Selalu buat migration untuk schema change
- Gunakan `select_related` / `prefetch_related` untuk optimasi query
- Selalu handle relasi dengan benar (on_delete, related_name)

### 3.2 Serializer
- Validasi input di serializer, bukan di view
- Gunakan `read_only_fields` untuk field auto-generated
- Custom validation dengan `validate_{field_name}`

### 3.3 View
- Gunakan ViewSet, bukan APIView manual
- Override `get_queryset` untuk filter/search
- Override `get_permissions` untuk RBAC
- Gunakan `@action` untuk custom endpoint

### 3.4 Error Handling
- Raise `NotFound` untuk data tidak ditemukan
- Raise `ValidationError` untuk input tidak valid
- Selalu return format: `{ status: "error", message: "...", errors: [] }`

### 3.5 Testing
- Write tests alongside code (TDD)
- Gunakan Django TestCase & APITestCase
- Test edge cases, bukan cuma happy path
- Coverage minimum 80%

---

## 4. Frontend Code Generation Rules (React)

### 4.1 Component
- Selalu TypeScript, no `any`
- Komponen harus reusable
- Mobile-first responsive design
- Selalu handle loading & error state

### 4.2 State Management
- Zustand untuk global state
- Local state untuk UI-only state
- Jangan over-engineer state

### 4.3 API Client
- Axios dengan interceptors
- Base URL dari env variable (`import.meta.env.VITE_API_BASE_URL`)
- Error handling terpusat

### 4.4 Styling
- Tailwind CSS utility classes
- Tidak inline styles
- Dark mode support

---

## 5. Database Rules

- Selalu gunakan Django ORM
- Selalu buat migration untuk schema change
- Jangan hapus kolom tanpa migration
- Gunakan `unique_together` untuk composite unique constraint
- Index field yang sering di-filter/search

---

## 6. File Naming Rules

- **Python:** `snake_case.py` (models.py, serializers.py, views.py)
- **Django apps:** lowercase (accounts, keuangan)
- **Components:** `PascalCase.tsx` (WargaTable.tsx)
- **Hooks:** `useCamelCase.ts` (useAuth.ts)
- **Stores:** `camelCaseStore.ts` (authStore.ts)
- **Tests:** `test_*.py` (backend), `*.test.tsx` (frontend)

---

## 7. Git Conventions

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

## 8. Communication Style

- Progress pakai **checklist format**
- Bahasa: **mix Indonesian-English**, casual tapi profesional
- Kalau ada blocker, langsung bilang jangan diem
- Laporan hasil: concise, jelas, tidak bertele-tele

---

## 9. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-07 | Initial AI rules |
