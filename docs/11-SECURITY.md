# Smart-RT — Security & Privacy Policy

**Version:** 1.1.0
**Date:** June 8, 2026
**Status:** Active
**Author:** BocahLinux
**Classification:** Internal

---

> **Catatan:** Dokumen ini adalah **source of truth** untuk semua kebijakan keamanan dan privasi di project Smart-RT. Semua dokumen lain (PRD, SRS, SDD, Database, API Contract, Coding Standard, Test Plan) harus mereferensi dokumen ini. Jika ada konflik, utamakan dokumen ini.

---

## 1. Data Classification

Semua data dalam sistem Smart-RT diklasifikasikan ke dalam 4 tingkat. Setiap tingkat menentukan siapa yang boleh mengakses, bagaimana data disimpan, dan bagaimana data ditampilkan.

### 1.1 Public
Data yang boleh dilihat oleh semua role termasuk warga.

| Data | Lokasi DB | Keterangan |
|------|-----------|------------|
| Nama kegiatan | `kegiatan.nama` | — |
| Deskripsi kegiatan | `kegiatan.deskripsi` | — |
| Pengumuman publik | `pengumuman.judul`, `.isi` | — |
| Thread forum (non-sensitif) | `threads.judul`, `comments.isi` | — |
| Polling pertanyaan & hasil agregat | `polls.pertanyaan` | — |
| Statistik agregat (dashboard public) | Computed | Total warga aktif, dll |

### 1.2 Internal
Data untuk internal RT, tidak di-expose ke publik di luar sistem.

| Data | Lokasi DB | Keterangan |
|------|-----------|------------|
| Nama lengkap warga | `warga_profiles.nama_lengkap` | — |
| Blok & no rumah | `warga_profiles.blok`, `.no_rumah` | — |
| Status warga | `warga_profiles.status` | Aktif/pindah/meninggal |
| Status iuran agregat | `iuran_warga.status` | Total lunas/belum |
| Forum internal | `threads` kategori internal | — |

### 1.3 Sensitive
Data pribadi warga. Akses terbatas berdasarkan role + object-level permission. **Di-mask untuk role yang tidak berhak.**

| Data | Lokasi DB | Aturan Akses | Masking |
|------|-----------|-------------|---------|
| NIK | `warga_profiles.nik` | Pemilik, sekretaris, admin | `3201********0001` untuk bendahara/pengurus/warga lain |
| No. KK | `warga_profiles.no_kk` | Pemilik, sekretaris, admin | `3201********5678` untuk bendahara/pengurus/warga lain |
| Alamat lengkap | `warga_profiles.alamat` | Pemilik, sekretaris, admin | — |
| Tanggal lahir | `warga_profiles.tanggal_lahir` | Pemilik, sekretaris, admin | — |
| Nomor HP | `users.phone` | Pemilik, sekretaris, bendahara, admin | `0812****5678` untuk pengurus/warga lain |
| Email | `users.email` | Pemilik, sekretaris, admin | — |
| Foto profil | `warga_profiles.foto` | Pemilik, sekretaris, bendahara, admin | — |
| Bukti transfer | `transaksi.bukti_url`, `iuran_warga.bukti_url` | Pemilik transaksi, bendahara, admin | — |
| Data pengaduan | `pengaduan.*` | Pelapor & sekretaris/pengurus berwenang & admin | Sensitif: tidak publik |

### 1.4 Restricted
Data sistem. **Tidak boleh di-expose ke mana pun** kecuali ke sistem itu sendiri.

| Data | Lokasi | Aturan |
|------|--------|--------|
| Password hash | `users.password` | Never exposed. Django Argon2/PBKDF2 hash. |
| JWT signing key / SECRET_KEY | Environment variable | Never in DB or code. |
| Refresh token | httpOnly cookie | Not accessible via JavaScript. |
| Audit log detail | `audit_logs.*` | Hanya admin yang boleh akses. |
| Backup database | File system / cloud | Terenkripsi (GPG AES256). Akses terbatas. |
| API keys / credentials | Environment variable | Never in code or repository. |

---

## 2. Role & Permission Matrix

### 2.1 Role Definitions

| Role | Deskripsi | Akses Global |
|------|-----------|-------------|
| **Admin** | Ketua RT / Super admin | Full access. Manage semua role. Hapus data. Export full. Lihat audit log. |
| **Sekretaris** | Mengelola data warga & administrasi | CRUD data warga, verifikasi warga, import/export, pengumuman, pengaduan. Tidak bisa hapus user. Tidak akses keuangan. |
| **Bendahara** | Mengelola keuangan RT | CRUD transaksi, konfirmasi/tolak iuran, lihat bukti transfer, export laporan keuangan. Tidak bisa CRUD data warga. |
| **Pengurus** | Pengurus RT lainnya | Lihat data warga (masked), kelola forum (moderasi), kelola kegiatan, kelola polling, update status pengaduan. Tidak bisa CRUD warga, tidak akses keuangan. |
| **Warga** | Warga terverifikasi | Lihat pengumuman, upload iuran, forum, pengaduan, RSVP, vote. Lihat profil sendiri. |

### 2.2 Role Hierarchy

```
Admin (Ketua RT)
├── Sekretaris  → Data warga + administrasi
├── Bendahara   → Keuangan
└── Pengurus    → Forum, kegiatan, polling, moderasi
    Warga       → Akses terbatas ke data sendiri
```

### 2.3 Global Permission Matrix

| Action | Admin | Sekretaris | Bendahara | Pengurus | Warga |
|--------|-------|------------|-----------|----------|-------|
| **User Management** | | | | | |
| Create pengurus/sekretaris/bendahara | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete user | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Data Warga** | | | | | |
| List all warga | ✅ | ✅ | ❌ | ✅ (masked) | ❌ (own only) |
| View full profil | ✅ | ✅ | ❌ | ❌ (masked) | ❌ (own only, full) |
| View masked profil | ❌ | ❌ | ✅ | ✅ | ✅ (own, masked) |
| Create warga | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update warga | ✅ | ✅ | ❌ | ❌ | ❌ (own only, limited) |
| Delete warga | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verify warga | ✅ | ✅ | ❌ | ❌ | ❌ |
| Import warga | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export warga | ✅ (full) | ✅ (masked) | ❌ | ❌ | ❌ |
| **Keuangan** | | | | | |
| View all transaksi | ✅ | ❌ | ✅ | ❌ | ❌ |
| Create transaksi | ✅ | ❌ | ✅ | ❌ | ❌ |
| Update transaksi | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete transaksi | ✅ | ❌ | ❌ | ❌ | ❌ |
| Confirm/reject iuran | ✅ | ❌ | ✅ | ❌ | ❌ |
| View own iuran | ✅ | ❌ | ✅ | ❌ | ✅ |
| Upload bukti transfer | ✅ | ❌ | ✅ | ❌ | ✅ (own only) |
| View own bukti transfer | ✅ | ❌ | ✅ | ❌ | ✅ |
| View other bukti transfer | ✅ | ❌ | ✅ | ❌ | ❌ |
| Export laporan keuangan | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Pengumuman** | | | | | |
| Create/Update/Delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| View list | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Forum** | | | | | |
| Create thread/comment | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own content | ✅ | ✅ | ✅ | ✅ | ✅ |
| Moderate (pin/lock/delete) | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Pengaduan** | | | | | |
| Create pengaduan | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own pengaduan | ✅ | ✅ | ✅ | ✅ | ✅ |
| View other pengaduan | ✅ | ✅ | ❌ | ✅ | ❌ (unless publik) |
| View sensitif pengaduan | ✅ | ✅ | ❌ | ✅ | ❌ |
| Update status | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Kegiatan** | | | | | |
| CRUD kegiatan | ✅ | ✅ | ❌ | ✅ | ❌ |
| RSVP | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Polling** | | | | | |
| CRUD polling | ✅ | ✅ | ❌ | ✅ | ❌ |
| Vote | ✅ | ✅ | ✅ | ✅ | ✅ |
| View results | ✅ | ✅ | ✅ | ✅ | ✅ (after deadline) |
| **Dashboard** | | | | | |
| Admin dashboard | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sekretaris dashboard | ❌ | ✅ | ❌ | ❌ | ❌ |
| Bendahara dashboard | ❌ | ❌ | ✅ | ❌ | ❌ |
| Pengurus dashboard | ❌ | ❌ | ❌ | ✅ | ❌ |
| Warga dashboard | ❌ | ❌ | ❌ | ❌ | ✅ (own data only) |
| **Audit Log** | | | | | |
| View audit log | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Field Visibility Matrix

Detail field-level visibility untuk endpoint data warga:

| Field | Admin | Sekretaris | Bendahara | Pengurus | Warga (own) | Warga (other) |
|-------|-------|------------|-----------|----------|-------------|---------------|
| id | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| nik | ✅ full | ✅ full | ✅ masked | ✅ masked | ✅ full | ❌ |
| no_kk | ✅ full | ✅ full | ✅ masked | ✅ masked | ✅ full | ❌ |
| nama_lengkap | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| tempat_lahir | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| tanggal_lahir | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| jenis_kelamin | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| agama | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| status_perkawinan | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| pendidikan | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| pekerjaan | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| alamat | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| blok | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| no_rumah | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| phone | ✅ | ✅ | ✅ | ✅ masked | ✅ | ❌ |
| email | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| status | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| foto | ✅ | ✅ | ✅ | ✅ masked | ✅ | ❌ |
| created_at | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| updated_at | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

---

## 4. Authentication Policy

### 4.1 Token Strategy
| Policy | Value |
|--------|-------|
| **Access Token Lifetime** | 15-30 menit |
| **Refresh Token Lifetime** | 7-14 hari |
| **Access Token Storage** | Frontend in-memory state (Zustand) — **NO localStorage, NO persist** |
| **Refresh Token Storage** | httpOnly Secure SameSite=Strict cookie — **Not accessible via JavaScript** |
| **Token Rotation** | ✅ Ya — setiap refresh menghasilkan access + refresh token baru |
| **Blacklist After Rotation** | ✅ Ya — refresh token lama di-blacklist via `rest_framework_simplejwt.token_blacklist` |
| **Blacklist After Logout** | ✅ Ya — refresh token di-blacklist saat logout |

### 4.2 Login Security
| Policy | Value |
|--------|-------|
| **Max Login Attempts** | 10 attempts per 5 minutes per IP |
| **Account Lockout** | Otomatis setelah rate limit exceeded |
| **Password Min Length** | 8 characters |
| **Password Complexity** | Min 1 uppercase, 1 lowercase, 1 digit |
| **Password Hashing** | Django Argon2 (default), fallback PBKDF2-SHA256 |
| **Plaintext Password** | **NEVER** stored or logged |

### 4.3 Session Security
| Policy | Value |
|--------|-------|
| **CSRF Protection** | ✅ Enabled (Django CSRF middleware) |
| **Session Cookie** | Secure, HttpOnly |
| **Session Expiry** | Browser session (no server-side session for API) |
| **Concurrent Sessions** | Allowed (stateless JWT) |

---

## 5. Authorization Policy

### 5.1 RBAC (Role-Based Access Control)
- Setiap Django ViewSet **WAJIB** punya `permission_classes`.
- Global permission checked via `has_permission()`.
- Role defined di model: `admin`, `sekretaris`, `bendahara`, `pengurus`, `warga`.

### 5.2 Object-Level Permission
- Setiap endpoint dengan `:id` parameter **WAJIB** melakukan object-level permission check.
- Check via `has_object_permission()` — verify `obj.user == request.user`.
- Jika user tidak berhak → return **403 Forbidden** (bukan 404, untuk menghindari information leakage).
- **DILARANG** hanya mengandalkan frontend filtering.

### 5.3 Queryset Scoping
- Setiap ViewSet `get_queryset()` **WAJIB** memfilter berdasarkan role:
  - Admin → full queryset
  - Sekretaris → full queryset untuk data warga
  - Bendahara → hanya data keuangan
  - Pengurus → data warga (masked), forum, kegiatan, polling
  - Warga → hanya data milik sendiri (`filter(user=request.user)`)
- **DILARANG** return `Model.objects.all()` tanpa filter role.

### 5.4 IDOR Prevention
- Semua URL dengan `:id` parameter di-validate:
  - User boleh akses object milik sendiri
  - Admin/sekretaris boleh akses semua object warga
  - Bendahara hanya akses object keuangan
  - Cross-user access → **403 Forbidden**
- **DILARANG** return 404 untuk object yang ada tapi user tidak berhak (menghindari enumeration).

### 5.5 Permission Classes (Django)

```python
# accounts/permissions.py
from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsSekretaris(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'sekretaris']

class IsBendahara(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'bendahara']

class IsPengurus(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'sekretaris', 'pengurus']

class IsPengurusPlus(permissions.BasePermission):
    """Admin + sekretaris + pengurus (tidak termasuk bendahara)"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'sekretaris', 'pengurus']

class IsOwnerOrSekretaris(permissions.BasePermission):
    """Object-level: pemilik data atau sekretaris/admin"""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['admin', 'sekretaris']:
            return True
        return hasattr(obj, 'user') and obj.user == request.user

class IsOwnerOrBendahara(permissions.BasePermission):
    """Object-level: pemilik data atau bendahara/admin (untuk bukti transfer)"""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['admin', 'bendahara']:
            return True
        if hasattr(obj, 'warga'):
            return obj.warga.user == request.user
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        return False
```

---

## 6. Sensitive Data Handling

### 6.1 Masking Rules
| Data | Masked Format | Example |
|------|--------------|---------|
| NIK | `3201********0001` | First 4 + `********` + last 4 |
| No. KK | `3201********5678` | First 4 + `********` + last 4 |
| No. HP | `0812****5678` | First 4 + `****` + last 4 |
| Email | `ah***@gmail.com` | First 2 + `***` + domain |
| Alamat | Not shown to non-authorized | — |

### 6.2 Redaction Rules (Audit Log)
Audit log (`audit_logs`) **TIDAK BOLEH** menyimpan:
- Password (old or new)
- Token (access or refresh)
- Secret keys / credentials
- File content (binary)
- Raw NIK, no KK, phone, email (harus di-mask)

Audit log field sensitif yang di-mask:
| Field | Masked Format |
|-------|--------------|
| nik | `3201********0001` |
| no_kk | `3201********5678` |
| phone | `0812****5678` |
| email | `ah***@domain.com` |
| alamat | Redacted |

### 6.3 Data Minimization
- Hanya kumpulkan data yang benar-benar diperlukan.
- Field opsional tidak wajib diisi saat registrasi.
- Jangan simpan data yang tidak digunakan.

### 6.4 Data Retention
| Data | Retention |
|------|-----------|
| Warga aktif | Selama aktif |
| Warga pindah/meninggal | Soft delete, simpan maks 2 tahun, lalu hard delete |
| Audit log | 2 tahun |
| Backup | Daily 30 hari, weekly 12 minggu, monthly 12 bulan |

### 6.5 Right to Access & Deletion
- Warga bisa mengunduh data pribadinya sendiri (export profil).
- Warga bisa meminta penghapusan data (sesuai regulasi).
- Proses penghapusan memerlukan verifikasi admin.

---

## 7. File Upload Security

### 7.1 Allowed File Types
| Type | Allowed MIME | Allowed Extensions | Max Size |
|------|-------------|-------------------|----------|
| Foto profil | `image/jpeg`, `image/png`, `image/webp` | `.jpg`, `.jpeg`, `.png`, `.webp` | 5 MB |
| Bukti transfer | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf` | 5 MB |
| Foto pengaduan | `image/jpeg`, `image/png`, `image/webp` | `.jpg`, `.jpeg`, `.png`, `.webp` | 5 MB |
| Gambar pengumuman | `image/jpeg`, `image/png`, `image/webp` | `.jpg`, `.jpeg`, `.png`, `.webp` | 5 MB |

### 7.2 Blocked File Types
| Type | Reason |
|------|--------|
| `.php`, `.php5`, `.pht`, `.phtml` | Server-side code execution |
| `.exe`, `.bat`, `.cmd`, `.sh` | Executable files |
| `.svg` | XSS via SVG payload |
| `.html`, `.htm`, `.js` | XSS |
| `.zip`, `.tar`, `.gz` | Archive bomb / malware |
| Double extensions (`.jpg.php`) | Bypass attempt |
| Null byte (`file.php%00.jpg`) | Path traversal |

### 7.3 Upload Security Rules
| Rule | Implementation |
|------|---------------|
| **MIME Validation** | Validate via `python-magic` (magic bytes), bukan cuma extension |
| **Extension Validation** | Whitelist only allowed extensions |
| **Size Validation** | Max 5MB, checked server-side |
| **Filename** | Generate random UUID, never use original filename |
| **Storage Path** | `media/{folder}/{uuid}/{uuid.ext}` |
| **Path Traversal** | Validate path doesn't escape `MEDIA_ROOT` |
| **Access Control** | Private media — served via Django view with permission check |
| **Public URL** | **NEVER** expose media URL directly |
| **Virus Scan** | Optional for production (ClamAV integration) |

### 7.4 Private Media Access
```python
# urls.py
path('media/<str:file_path>', serve_private_file, name='serve_media')

# views.py
def serve_private_file(request, file_path):
    if not request.user.is_authenticated:
        raise Http404
    
    # Prevent path traversal
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    if not full_path.startswith(os.path.realpath(settings.MEDIA_ROOT)):
        raise Http404
    
    # Object-level permission check
    # ... verify user has access to this file ...
    
    if os.path.exists(full_path):
        return FileResponse(open(full_path, 'rb'))
    raise Http404
```

---

## 8. Backup & Recovery Security

### 8.1 Backup Policy
| Policy | Value |
|--------|-------|
| **Frequency** | Daily at 02:00 |
| **Encryption** | GPG AES256 (`gpg --symmetric --cipher-algo AES256`) |
| **Key Storage** | Separate from backup file (environment variable or key management service) |
| **Retention** | Daily: 30 hari, Weekly: 12 minggu, Monthly: 12 bulan |
| **Storage** | Off-site or cloud storage with server-side encryption |
| **Access** | File permission `600` (owner only) |

### 8.2 Backup Command
```bash
# Encrypted backup
pg_dump -U smartrt smartrt | gzip | gpg --symmetric --cipher-algo AES256 \
  --passphrase-file /root/.backup_key \
  -o /backup/smartrt_$(date +\%Y\%m\%d).sql.gz.gpg
```

### 8.3 Restore Drill
| Policy | Value |
|--------|-------|
| **Frequency** | Monthly di non-production environment |
| **Procedure** | Decrypt → Decompress → Restore → Verify data integrity |
| **Verification** | Row count comparison + spot check sensitive fields |
| **Documentation** | Restore log dengan timestamp + verifier |

### 8.4 Backup Access Control
| Rule | Implementation |
|------|---------------|
| **File Permission** | `600` (owner read/write only) |
| **Directory** | Separate from application directory |
| **Git** | Backup files **NEVER** in repository (add to `.gitignore`) |
| **Cloud** | Server-side encryption + IAM restricted access |

---

## 9. Logging & Audit

### 9.1 What to Log
| Event | Action | Fields |
|-------|--------|--------|
| User login | `login` | user_id, role, timestamp, IP |
| User logout | `logout` | user_id, timestamp |
| Create warga | `create` | user_id, role, table, record_id, new_data (masked) |
| Update warga | `update` | user_id, role, table, record_id, old_data (masked), new_data (masked) |
| Delete warga | `delete` | user_id, role, table, record_id, old_data (masked) |
| Verify warga | `verify` | user_id, role, table, record_id, status |
| Confirm iuran | `confirm` | user_id, role, table, record_id |
| Export data | `export` | user_id, role, table, format, record_count |
| Failed login | `login_failed` | email_attempted, timestamp, IP |
| Permission denied | `access_denied` | user_id, role, endpoint, timestamp |
| File upload | `file_upload` | user_id, role, file_type, file_size |

### 9.2 What NOT to Log
| Data | Reason |
|------|--------|
| Password (plaintext or hash) | Credential exposure |
| Access/refresh token | Token hijacking |
| Secret key / API key | System compromise |
| Raw NIK / no KK / phone / email | Privacy violation |
| File content (binary) | Data exposure |
| Full request body with sensitive fields | Data exposure |

### 9.3 Audit Log Access
| Role | Access |
|------|--------|
| Admin | Full access to audit log |
| Sekretaris | ❌ Cannot access audit log |
| Bendahara | ❌ Cannot access audit log |
| Pengurus | ❌ Cannot access audit log |
| Warga | ❌ Cannot access audit log |

---

## 10. Security Testing Checklist

### 10.1 Authentication & Session
| ID | Test Case | Expected | Tool |
|----|-----------|----------|------|
| SEC-01 | Expired access token | 401 Unauthorized | Manual |
| SEC-02 | Invalid JWT signature | 401 | Manual |
| SEC-03 | JWT with "none" algorithm | 401 | Manual |
| SEC-04 | Tampered JWT payload | 401 | Manual |
| SEC-05 | Reuse blacklisted refresh token | 401 | Manual |
| SEC-06 | Access after logout | 401 | Manual |
| SEC-07 | Login rate limit (11 failed attempts) | 429 on 11th | Manual |
| SEC-08 | Password "123456" rejected | 400 | Manual |
| SEC-09 | Password "password" rejected | 400 | Manual |
| SEC-10 | Password stored as Argon2 hash | Not plaintext | DB check |

### 10.2 Authorization & Access Control (5 Roles)
| ID | Test Case | Expected | Tool |
|----|-----------|----------|------|
| SEC-11 | Warga A GET profil Warga B | 403 Forbidden | Manual |
| SEC-12 | Warga A GET iuran Warga B | 403 | Manual |
| SEC-13 | Warga A GET bukti transfer Warga B | 403 | Manual |
| SEC-14 | Warga A GET pengaduan private Warga B | 403 | Manual |
| SEC-15 | Bendahara GET data warga | ✅ (masked fields only) | Manual |
| SEC-16 | Bendahara POST transaksi | 201 | Manual |
| SEC-17 | Bendahara PUT data warga | 403 | Manual |
| SEC-18 | Sekretaris CRUD warga | 200/201 | Manual |
| SEC-19 | Sekretaris POST transaksi | 403 | Manual |
| SEC-20 | Pengurus GET data warga | ✅ (masked) | Manual |
| SEC-21 | Pengurus POST transaksi | 403 | Manual |
| SEC-22 | Pengurus moderate forum | 200 | Manual |
| SEC-23 | Admin access any resource | 200 | Manual |
| SEC-24 | Change UUID in URL (IDOR) | 403 | Manual |

### 10.3 Field Masking (5 Roles)
| ID | Test Case | Expected | Tool |
|----|-----------|----------|------|
| SEC-25 | List warga (warga) → NIK masked | `3201********0001` | Manual |
| SEC-26 | List warga (pengurus) → NIK masked | `3201********0001` | Manual |
| SEC-27 | List warga (bendahara) → NIK masked | `3201********0001` | Manual |
| SEC-28 | List warga (sekretaris) → NIK full | `3201010101010001` | Manual |
| SEC-29 | List warga (admin) → NIK full | `3201010101010001` | Manual |
| SEC-30 | Export default → NIK masked | Masked | Manual |
| SEC-31 | Export fullData → NIK full | Full | Manual |

### 10.4 File Upload
| ID | Test Case | Expected | Tool |
|----|-----------|----------|------|
| SEC-32 | Upload .php | 415 Unsupported Media Type | Manual |
| SEC-33 | Upload .exe | 415 | Manual |
| SEC-34 | Upload file > 5MB | 413 Payload Too Large | Manual |
| SEC-35 | Upload fake MIME (.jpg but .exe) | 415 | Manual |
| SEC-36 | Upload path traversal (../) | 404 | Manual |
| SEC-37 | Access file without auth | 401 | Manual |
| SEC-38 | Filename is UUID (not original) | UUID filename | DB check |

### 10.5 OWASP Top 10
| ID | Risk | Test Case | Expected | Tool |
|----|------|-----------|----------|------|
| SEC-39 | A01: Broken Access Control | IDOR via UUID manipulation | 403 | Manual |
| SEC-40 | A02: Cryptographic Failures | Password stored as Argon2 | Not plaintext | DB check |
| SEC-41 | A02: Cryptographic Failures | Backup encrypted (GPG) | .gpg file | Manual |
| SEC-42 | A03: Injection | SQL injection via search | Blocked by ORM | sqlmap |
| SEC-43 | A03: Injection | XSS via input field | Sanitized | Manual |
| SEC-44 | A05: Security Misconfiguration | DEBUG=False in production | No debug info | Manual |
| SEC-45 | A05: Security Misconfiguration | Security headers present | HSTS, X-Frame-Options | Manual |
| SEC-46 | A07: Auth Failures | Brute force protection | Rate limited | Manual |
| SEC-47 | A08: Data Integrity | CSRF protection | Token validated | Manual |
| SEC-48 | A09: Logging Failures | Audit log for sensitive ops | Logged | DB check |
| SEC-49 | A09: Logging Failures | No sensitive data in logs | No password/token | Log check |

### 10.6 Audit Log
| ID | Test Case | Expected | Tool |
|----|-----------|----------|------|
| SEC-50 | Create warga → audit log entry | action=create | DB check |
| SEC-51 | Update warga → audit log masked | NIK masked in old/new_data | DB check |
| SEC-52 | Audit log NO password | No password field | DB check |
| SEC-53 | Audit log NO token | No token field | DB check |
| SEC-54 | Non-admin cannot access audit log | 403 | Manual |

### 10.7 CORS & CSRF
| ID | Test Case | Expected | Tool |
|----|-----------|----------|------|
| SEC-55 | Request from non-whitelisted origin | Blocked | curl |
| SEC-56 | CSRF token missing on state-changing request | 403 | Manual |
| SEC-57 | CSRF token present and valid | 200 | Manual |

---

## 11. Incident Response

### 11.1 Incident Classification

| Level | Description | Example | Response Time |
|-------|-------------|---------|---------------|
| **Critical** | Data breach confirmed, active exploitation | Database leaked, account takeover | < 1 jam |
| **High** | Vulnerability discovered, potential breach | IDOR found, unauthorized access detected | < 4 jam |
| **Medium** | Suspicious activity, policy violation | Unusual login pattern, failed brute force | < 24 jam |
| **Low** | Minor issue, no immediate risk | Missing security header, outdated dependency | < 7 hari |

### 11.2 Response Procedures

#### Data Breach (Critical)
1. **Identify** — Determine scope: which data, how many users affected.
2. **Contain** — Revoke all active tokens, force logout all users, take affected endpoint offline.
3. **Assess** — Analyze logs to determine attack vector and data exposure.
4. **Notify** — Inform affected users within 24 hours.
5. **Remediate** — Patch vulnerability, rotate all secrets/keys.
6. **Restore** — Restore from verified clean backup if needed.
7. **Document** — Write incident report with timeline, impact, and remediation steps.

#### Account Compromised (High)
1. **Identify** — Confirm compromise via audit log analysis.
2. **Contain** — Blacklist all tokens for affected user, force password reset.
3. **Assess** — Check what data was accessed/modified.
4. **Notify** — Inform affected user immediately.
5. **Remediate** — Reset password, review access patterns.
6. **Monitor** — Enhanced monitoring for affected account and related accounts.

#### Vulnerability Discovered (Medium/High)
1. **Identify** — Document vulnerability with reproduction steps.
2. **Prioritize** — Assess severity (use checklist §10).
3. **Patch** — Create fix branch, test, deploy.
4. **Verify** — Run security tests to confirm fix.
5. **Monitor** — Enhanced logging for related endpoints.

### 11.3 Contact & Escalation

| Situation | Contact | Method |
|-----------|---------|--------|
| Data breach | Admin (BocahLinux) | Telegram |
| Account compromised | User + Admin | In-app notification + Telegram |
| Vulnerability found | Admin | GitHub Issue (private) |
| Emergency | Admin | Direct call/message |

### 11.4 Post-Incident Review
Setiap insiden Critical/High harus memiliki:
1. **Timeline** — Kapan terjadi, kapan terdeteksi, kapan di-resolve.
2. **Root Cause** — Apa yang menyebabkan insiden.
3. **Impact** — Berapa data/user terdampak.
4. **Remediation** — Apa yang sudah diperbaiki.
5. **Prevention** — Apa yang akan dilakukan agar tidak terulang.

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-08 | Initial Security & Privacy Policy |
| 1.1.0 | 2026-06-08 | Expanded from 3 roles to 5 roles (Admin, Sekretaris, Bendahara, Pengurus, Warga). Updated all permission matrices, field visibility matrices, data classification access rules, permission classes, and security tests. Added role hierarchy diagram. |
