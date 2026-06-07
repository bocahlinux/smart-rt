# Smart-RT — CI/CD Pipeline & Deployment

**Version:** 1.0.0
**Date:** June 7, 2026
**Status:** Draft

---

## 1. Tujuan

Dokumen ini melengkapi 09-TEST-PLAN.md §9.4 (yang berisi contoh workflow pengujian dasar) dengan **pipeline CI/CD lengkap**: dari lint & test, build image, hingga deploy ke staging/production. Tujuannya agar AI/developer tahu persis tahapan otomasi yang harus disiapkan di Phase 0 dan disempurnakan di Phase 9 (lihat 07-TASK-BREAKDOWN.md).

---

## 2. Platform & Tools

| Kebutuhan | Tool |
|-----------|------|
| CI/CD Runner | GitHub Actions |
| Container Registry | GitHub Container Registry (ghcr.io) |
| Backend Lint/Format | Ruff, Black |
| Backend Security Scan | bandit, `pip-audit` |
| Frontend Lint/Format | ESLint, Prettier |
| Frontend Security Scan | `npm audit` |
| Container Build | Docker Buildx |
| Deployment Target | VPS via Docker Compose + Nginx (lihat 04-SDD.md §6 Deployment Architecture) |
| Secret Management | GitHub Actions Secrets (encrypted) |

---

## 3. Pipeline Stages (Overview)

```
┌──────────┐   ┌────────┐   ┌───────┐   ┌────────────┐   ┌─────────┐   ┌────────┐
│  Lint &  │ → │  Test  │ → │ Build │ → │  Security  │ → │ Deploy  │ → │ Smoke  │
│  Format  │   │+Coverage│   │ Image │   │   Scan     │   │(staging/│   │  Test  │
│          │   │        │   │       │   │            │   │  prod)  │   │        │
└──────────┘   └────────┘   └───────┘   └────────────┘   └─────────┘   └────────┘
```

Setiap stage **harus lulus** sebelum lanjut ke stage berikutnya (fail-fast). Pipeline dipicu oleh:
- **Pull Request → `develop`/`main`**: stage Lint, Test, Security Scan (gate untuk merge — lihat 08-CODING-STANDART.md untuk branching & commit convention)
- **Push/merge → `develop`**: tambahan stage Build & Deploy ke **staging**
- **Push/merge → `main`** (atau tag rilis `v*`): tambahan stage Build & Deploy ke **production** (memerlukan approval manual — lihat §6)

---

## 4. Workflow: Continuous Integration (Lint, Test, Security)

Berlaku untuk setiap PR dan push ke `develop`/`main`. Memperluas contoh dasar di 09-TEST-PLAN.md §9.4 dengan tambahan lint, security scan, dan artifact coverage.

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop, main]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: smartrt_test
          POSTGRES_USER: smartrt
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
      - run: pip install -r requirements/dev.txt

      - name: Lint & format check
        run: |
          ruff check .
          black --check .

      - name: Run tests with coverage
        env:
          DATABASE_URL: postgres://smartrt:test@localhost:5432/smartrt_test
          DJANGO_SETTINGS_MODULE: config.settings.test
        run: |
          pytest --cov=backend --cov-report=xml --cov-report=term --cov-fail-under=80

      - name: Security scan (bandit + pip-audit)
        run: |
          bandit -r backend/ -ll
          pip-audit -r requirements/base.txt

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: coverage.xml

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci

      - name: Lint & format check
        run: |
          npm run lint
          npm run format:check

      - name: Type check
        run: npm run type-check

      - name: Run unit & component tests with coverage
        run: npm run test:coverage -- --run

      - name: Audit dependencies
        run: npm audit --audit-level=high

      - name: Build production bundle
        run: npm run build

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: frontend/coverage
```

**Gate untuk merge PR (branch protection rule):**
- Semua job CI **wajib hijau**
- Coverage backend ≥ 80% dan frontend ≥ 70% (selaras 09-TEST-PLAN.md §1.3)
- Minimal 1 review approval (lihat 08-CODING-STANDART.md §8 Code Review Checklist)
- Tidak ada finding **High/Critical** dari bandit/`npm audit`/`pip-audit`

---

## 5. Workflow: Build & Push Image

Dipicu setelah CI lulus pada push ke `develop` atau `main`.

```yaml
# .github/workflows/build.yml
name: Build & Push Image
on:
  push:
    branches: [develop, main]
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [develop, main]

jobs:
  build:
    if: ${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'push' }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & push backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
            ghcr.io/${{ github.repository }}/backend:${{ github.ref_name }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build & push frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
            ghcr.io/${{ github.repository }}/frontend:${{ github.ref_name }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

> Image di-tag dengan SHA commit (untuk traceability & rollback presisi) **dan** nama branch (untuk kemudahan deploy).

---

## 6. Workflow: Deploy

### 6.1 Deploy ke Staging (otomatis, dari `develop`)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging
on:
  workflow_run:
    workflows: ["Build & Push Image"]
    types: [completed]
    branches: [develop]

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_SSH_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/smart-rt
            export IMAGE_TAG=${{ github.sha }}
            docker compose -f docker-compose.staging.yml pull
            docker compose -f docker-compose.staging.yml up -d
            docker compose -f docker-compose.staging.yml exec -T backend python manage.py migrate --noinput
            docker compose -f docker-compose.staging.yml exec -T backend python manage.py collectstatic --noinput

      - name: Smoke test
        run: |
          curl -sf https://staging.smartrt.yourdomain.com/api/v1/healthz/ || exit 1
```

### 6.2 Deploy ke Production (manual approval, dari `main`)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production
on:
  workflow_run:
    workflows: ["Build & Push Image"]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    environment: production   # GitHub Environment dengan "required reviewers" → manual approval gate
    steps:
      - name: Backup database before deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_SSH_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/smart-rt
            ./scripts/backup-db.sh pre-deploy-$(date +%Y%m%d-%H%M%S)

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_SSH_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/smart-rt
            export IMAGE_TAG=${{ github.sha }}
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d
            docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput
            docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

      - name: Smoke test
        run: |
          curl -sf https://smartrt.yourdomain.com/api/v1/healthz/ || exit 1

      - name: Notify on completion
        if: always()
        run: echo "Deploy ${{ job.status }} for ${{ github.sha }}"
        # TODO: ganti dengan notifikasi nyata (Slack/Telegram/email) sesuai §11 Incident Response di 11-SECURITY.md
```

> **Manual approval gate**: gunakan fitur **GitHub Environments** dengan "required reviewers" pada environment `production`, sehingga deploy ke production menunggu persetujuan eksplisit dari maintainer (mis. Ketua RT teknis / lead developer).

---

## 7. Environments & Secrets

| Environment | Branch | URL contoh | Approval |
|-------------|--------|-----------|----------|
| Development | lokal (docker-compose.yml) | `localhost` | — |
| Staging | `develop` | `staging.smartrt.yourdomain.com` | Otomatis setelah CI lulus |
| Production | `main` / tag `v*` | `smartrt.yourdomain.com` | Manual (GitHub Environment reviewer) |

**Secrets yang wajib dikonfigurasi di GitHub Actions** (Settings → Secrets and variables → Actions), **tidak pernah** disimpan di kode/`.env` yang ter-commit:

| Secret | Keterangan |
|--------|------------|
| `STAGING_HOST`, `STAGING_SSH_USER`, `STAGING_SSH_KEY` | Akses SSH server staging |
| `PROD_HOST`, `PROD_SSH_USER`, `PROD_SSH_KEY` | Akses SSH server production |
| `DJANGO_SECRET_KEY` (per environment, di server) | Django secret key |
| `DATABASE_URL` (per environment, di server) | Koneksi PostgreSQL |
| `JWT_SIGNING_KEY` (per environment, di server) | Signing key JWT, terpisah dari Django secret key |
| `GPG_BACKUP_PASSPHRASE` (di server) | Untuk enkripsi backup (lihat 11-SECURITY.md §8) |

> Catatan: kredensial *runtime* aplikasi (DB password, JWT key, dll) sebaiknya disimpan di server (`.env` dengan permission ketat / Docker secrets), **bukan** di GitHub Secrets — GitHub Secrets di sini hanya untuk kredensial *deployment* (SSH).

---

## 8. Rollback Strategy

1. **Identifikasi versi stabil terakhir** dari tag image (`ghcr.io/.../backend:<sha-lama>`).
2. **Rollback cepat (image only)**:
   ```bash
   export IMAGE_TAG=<sha-stabil-terakhir>
   docker compose -f docker-compose.prod.yml up -d
   ```
3. **Jika melibatkan migrasi database yang breaking**: gunakan backup pre-deploy yang dibuat otomatis di §6.2 step "Backup database before deploy", ikuti prosedur restorasi di 11-SECURITY.md §8 (Backup & Recovery).
4. **Selalu** tulis post-mortem singkat (lihat 11-SECURITY.md §11 Incident Response) untuk rollback yang dipicu oleh insiden produksi.

---

## 9. Branch & Release Strategy (ringkas)

- `main` — selalu mencerminkan kondisi production. Hanya menerima merge dari `develop` via PR yang sudah lulus staging.
- `develop` — integrasi fitur, auto-deploy ke staging.
- `feature/<nama>`, `fix/<nama>` — branch kerja, merge ke `develop` via PR (lihat 08-CODING-STANDART.md untuk konvensi penamaan & commit).
- Rilis ke production ditandai dengan **tag** `vX.Y.Z` mengikuti [Semantic Versioning](https://semver.org/), selaras dengan kebijakan API versioning di 06-API-CONTRACT.md §1.8.

---

## 10. Checklist Implementasi (Phase 0 & Phase 9)

- [ ] Setup branch protection rules untuk `main` dan `develop`
- [ ] Buat GitHub Environments `staging` dan `production` (dengan required reviewers untuk production)
- [ ] Daftarkan seluruh secrets di §7
- [ ] Buat `Dockerfile` untuk backend & frontend, serta `docker-compose.staging.yml` / `docker-compose.prod.yml`
- [ ] Implementasikan endpoint health check `/api/v1/healthz/` (dipakai smoke test)
- [ ] Buat script `scripts/backup-db.sh` (selaras 11-SECURITY.md §8)
- [ ] Aktifkan workflow `ci.yml`, `build.yml`, `deploy-staging.yml`, `deploy-production.yml`
- [ ] Uji rollback minimal sekali di staging sebelum go-live

---

## 11. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-07 | Initial draft: CI (lint/test/security scan), build & push image, deploy staging (auto) & production (manual approval), environments & secrets, rollback strategy, branch/release strategy, implementation checklist. Melengkapi contoh workflow dasar di 09-TEST-PLAN.md §9.4. |
