# Smart-RT — Monitoring & Observability

**Version:** 1.0.0
**Date:** June 7, 2026
**Status:** Draft

---

## 1. Tujuan & Ruang Lingkup

11-SECURITY.md §9 (Logging & Audit) sudah mencakup **audit trail** (siapa melakukan apa terhadap data). Dokumen ini melengkapi dengan **kesehatan & performa sistem** di level operasional production: apakah server hidup, seberapa cepat respons API, seberapa sering terjadi error, dan kapan tim harus diberi tahu.

Dua hal ini saling melengkapi dan **tidak boleh tertukar**:
- **Audit log** (11-SECURITY.md §9) → who did what, untuk akuntabilitas & investigasi insiden data.
- **Monitoring/observability** (dokumen ini) → is the system healthy, untuk deteksi dini masalah operasional.

---

## 2. Pilar Observability

| Pilar | Pertanyaan yang dijawab | Tools |
|-------|------------------------|-------|
| **Uptime / Availability** | Apakah aplikasi & API bisa diakses? | UptimeRobot / Healthchecks.io (gratis, cukup untuk skala RT) |
| **Error Tracking** | Error apa yang terjadi, di mana, seberapa sering? | Sentry (backend Django + frontend React) |
| **Metrics** | Berapa response time, error rate, resource usage? | Django + `django-prometheus` atau metrik dasar dari Nginx/Docker logs |
| **Logs** | Apa yang terjadi persis sebelum error? | Structured logging (JSON) → file + opsional log aggregation (Loki/Grafana untuk skala lebih besar) |
| **Alerting** | Siapa yang harus diberi tahu, dan bagaimana? | Sentry alerts, UptimeRobot notification → email/Telegram/WhatsApp grup pengurus teknis |

> **Catatan skala:** Smart-RT ditujukan untuk skala satu RT (puluhan-ratusan warga). Pilih tools tier gratis/murah dan setup minimal — hindari over-engineering (mis. tidak perlu Prometheus + Grafana stack penuh kecuali traffic bertumbuh signifikan).

---

## 3. Health Check Endpoint

Tambahkan endpoint publik (tanpa autentikasi, tanpa data sensitif) untuk dipakai oleh uptime monitor & smoke test deployment (lihat 12-CICD.md §6):

```
GET /api/v1/healthz/
```
**Response 200:**
```json
{
  "status": "ok",
  "database": "ok",
  "timestamp": "2026-06-07T10:00:00Z"
}
```
**Response 503** (jika DB tidak terhubung):
```json
{
  "status": "error",
  "database": "unreachable",
  "timestamp": "2026-06-07T10:00:00Z"
}
```

> Endpoint ini **tidak boleh** mengembalikan informasi versi, stack trace, atau detail infrastruktur — cukup status biner agar tidak membocorkan informasi yang berguna bagi penyerang (selaras prinsip *information disclosure prevention* di 11-SECURITY.md).

---

## 4. Error Tracking (Sentry)

### 4.1 Setup
- **Backend (Django):** `sentry-sdk[django]`, diaktifkan hanya di environment staging & production (bukan development) via `SENTRY_DSN` env var.
- **Frontend (React):** `@sentry/react`, source map upload saat build untuk stack trace yang readable.

### 4.2 Aturan Scrubbing (WAJIB — selaras 11-SECURITY.md §9 "What NOT to log")
Sentry **tidak boleh** menerima data berikut dalam payload error/breadcrumb:
- Password, token (access/refresh/JWT), session cookie
- NIK, No. KK, nomor telepon, email warga (data pribadi)
- Isi file upload (bukti transfer, foto, dokumen)

Implementasi: gunakan `before_send` hook untuk redaksi field sensitif, dan set `send_default_pii=False`.

```python
# config/settings/production.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

SENSITIVE_KEYS = {"password", "token", "access", "refresh", "nik", "no_kk", "phone", "email"}

def scrub_sensitive_data(event, hint):
    def scrub(d):
        if isinstance(d, dict):
            return {k: ("[Filtered]" if k.lower() in SENSITIVE_KEYS else scrub(v)) for k, v in d.items()}
        if isinstance(d, list):
            return [scrub(i) for i in d]
        return d
    return scrub(event)

sentry_sdk.init(
    dsn=env("SENTRY_DSN"),
    integrations=[DjangoIntegration()],
    send_default_pii=False,
    before_send=scrub_sensitive_data,
    traces_sample_rate=0.1,   # sampling, bukan 100% — hemat kuota
    environment=env("ENVIRONMENT"),  # "staging" | "production"
)
```

### 4.3 Alert Rules
| Kondisi | Aksi |
|---------|------|
| Error baru (belum pernah terjadi) muncul di production | Notifikasi langsung ke channel teknis |
| Error rate > 5% dari total request dalam 5 menit | Notifikasi "high priority" |
| Error yang sama terjadi > 50x dalam 1 jam | Eskalasi (lihat klasifikasi insiden 11-SECURITY.md §11) |

---

## 5. Uptime Monitoring

- **Tools:** UptimeRobot (atau Healthchecks.io / Better Uptime — pilih salah satu, tier gratis cukup)
- **Endpoint yang dipantau:**
  - `GET /api/v1/healthz/` — tiap 5 menit
  - `GET /` (frontend) — tiap 5 menit
- **Notifikasi saat down:** email + (opsional) bot Telegram/WhatsApp ke grup pengurus teknis
- **Status page (opsional):** halaman publik sederhana yang menunjukkan uptime historis — berguna untuk transparansi ke warga jika terjadi gangguan lama

---

## 6. Metrik Operasional & Threshold

Selaras dengan target performa di 09-TEST-PLAN.md §6.2, tetapi untuk **monitoring production berkelanjutan** (bukan load test sesaat):

| Metrik | Threshold Normal | Threshold Alert |
|--------|-----------------|-----------------|
| API response time (p95) | < 500ms | > 1s selama 5 menit |
| Error rate (5xx) | < 0.5% | > 2% selama 5 menit |
| Database connection pool usage | < 70% | > 90% |
| Disk usage (server) | < 70% | > 85% |
| Memory usage (container) | < 75% | > 90% |
| Background job (mis. pengiriman notifikasi) gagal | 0 | > 3 berturut-turut |

**Sumber data:**
- Response time & error rate: Sentry Performance Monitoring (sampling) atau Nginx access log + script agregasi sederhana
- Resource usage server: `docker stats`, atau agen ringan seperti Netdata (self-hosted, gratis)

---

## 7. Structured Logging

Gunakan logging terstruktur (JSON) di backend agar mudah di-grep/agregasi, dan **konsisten dengan aturan redaksi di 11-SECURITY.md §9**:

```python
# config/settings/base.py
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "json"},
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "/var/log/smartrt/app.log",
            "maxBytes": 10 * 1024 * 1024,
            "backupCount": 10,
            "formatter": "json",
        },
    },
    "root": {"handlers": ["console", "file"], "level": "INFO"},
}
```

**Wajib di-log:** request ID, endpoint, status code, durasi, user ID (bukan nama/email), role.
**Dilarang di-log:** password, token, NIK/KK/nomor telepon/email mentah, isi file upload — sama persis dengan daftar "what NOT to log" di 11-SECURITY.md §9.

---

## 8. Eskalasi & Tanggung Jawab

Mengacu pada klasifikasi insiden di 11-SECURITY.md §11 (Critical/High/Medium/Low):

| Severity | Contoh Pemicu Monitoring | Waktu Respons Target | PIC |
|----------|--------------------------|---------------------|-----|
| Critical | Aplikasi down total, database unreachable | < 30 menit | Lead developer / admin teknis |
| High | Error rate tinggi, endpoint kritis (login, pembayaran) gagal | < 2 jam | Developer on-duty |
| Medium | Performa menurun, error sporadis pada fitur non-kritis | < 1 hari kerja | Tim development |
| Low | Warning, deprecation notice, anomali kecil | Backlog sprint berikutnya | Tim development |

Setiap insiden Critical/High yang terdeteksi dari monitoring **wajib** mengikuti prosedur post-incident review di 11-SECURITY.md §11.

---

## 9. Checklist Implementasi (Phase 10 — Polish, Testing & Deployment)

- [ ] Implementasikan endpoint `/api/v1/healthz/`
- [ ] Daftarkan project Sentry (backend & frontend), set `SENTRY_DSN` sebagai secret
- [ ] Konfigurasi `before_send` scrubbing sesuai §4.2 — **uji** bahwa data sensitif benar-benar terredaksi sebelum go-live
- [ ] Setup UptimeRobot/Healthchecks.io untuk endpoint healthz & frontend
- [ ] Konfigurasi structured logging (JSON) dengan rotasi
- [ ] Setup channel notifikasi (Telegram bot / email grup) untuk alert Sentry & uptime monitor
- [ ] Dokumentasikan kontak on-duty & eskalasi (selaras 11-SECURITY.md §11)
- [ ] Lakukan drill: simulasikan error & downtime, pastikan alert benar-benar sampai ke channel yang tepat

---

## 10. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-07 | Initial draft: observability pillars, health check endpoint spec, Sentry setup with PII scrubbing rules (aligned with 11-SECURITY.md §9), uptime monitoring, operational metrics & thresholds, structured logging, escalation matrix, implementation checklist. |
