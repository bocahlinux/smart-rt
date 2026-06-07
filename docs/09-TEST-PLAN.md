# Smart-RT — Test Plan

**Version:** 1.1.0
**Date:** June 7, 2026
**Status:** Draft

---

## 1. Testing Strategy Overview

### 1.1 Testing Levels
```
┌─────────────────────────────────────────────────────────────┐
│                    E2E Tests (Manual)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Integration Tests                       │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │              Unit Tests                      │    │    │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │    │    │
│  │  │  │ Models  │ │Serializ.│ │  Views  │       │    │    │
│  │  │  └─────────┘ └─────────┘ └─────────┘       │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Testing Tools
| Layer | Tool | Purpose |
|-------|------|---------|
| Backend Unit | pytest + Django TestCase | Model, serializer, utility tests |
| Backend Integration | pytest + DRF APITestCase / APIClient | API endpoint tests |
| Backend Security | Django security checks + bandit + OWASP ZAP | Security scanning |
| Frontend Unit | Vitest | Store, hook, utility tests |
| Frontend Component | Vitest + React Testing Library | Component rendering & interaction |
| Frontend Integration | Vitest + MSW | Page-level API mocking |
| E2E | Manual | Full user flow testing |
| Performance | k6 / Locust | API load testing |
| Security | Manual + OWASP ZAP + bandit | Security testing |

### 1.3 Coverage Targets
| Layer | Target | Minimum |
|-------|--------|---------|
| Backend Models | 90% | 80% |
| Backend Serializers | 90% | 80% |
| Backend Views (API) | 90% | 80% |
| Backend Permissions | 95% | 85% |
| Backend Security | 100% | 90% |
| Frontend Stores | 90% | 80% |
| Frontend Components | 80% | 70% |
| Frontend Hooks | 85% | 75% |
| **Overall** | **85%** | **75%** |

---

## 2. Backend Test Plan

### 2.1 Unit Tests — Auth (Django TestCase)
| Test ID | Test Case | Input | Expected Output |
|---------|-----------|-------|-----------------|
| UT-AUTH-01 | Register with valid data | Valid email, phone, password | User created, status PENDING |
| UT-AUTH-02 | Register with duplicate email | Email already exists | 409 Conflict |
| UT-AUTH-03 | Register with invalid email | "not-an-email" | 400 Validation error |
| UT-AUTH-04 | Register with short password | "123" | 400 Validation error (min 8 chars) |
| UT-AUTH-05 | Register with weak password | "password" | 400 Validation error (no uppercase/digit) |
| UT-AUTH-06 | Login with valid credentials | Correct email + password | Access token + refresh token cookie |
| UT-AUTH-07 | Login with wrong password | Wrong password | 401 Unauthorized |
| UT-AUTH-08 | Login with unverified account | Status PENDING | 403 Forbidden |
| UT-AUTH-09 | Login with rejected account | Status REJECTED | 403 Forbidden |
| UT-AUTH-10 | Login rate limit | 11 failed attempts in 5 min | 429 on 11th attempt |
| UT-AUTH-11 | Change password with correct current | Correct current + new password | Success |
| UT-AUTH-12 | Change password with wrong current | Wrong current password | 401 Unauthorized |
| UT-AUTH-13 | Access token generation | Valid user | JWT with correct payload |
| UT-AUTH-14 | Access token expired | Expired token | 401 Unauthorized |
| UT-AUTH-15 | Refresh token rotation | Valid refresh token | New access + refresh token, old refresh blacklisted |
| UT-AUTH-16 | Reuse blacklisted refresh token | Blacklisted refresh token | 401 Unauthorized |
| UT-AUTH-17 | Logout blacklists refresh token | Valid logout | Refresh token di-blacklist |
| UT-AUTH-18 | Password hashed with Argon2 | User created | Password NOT stored as plaintext |

### 2.2 Unit Tests — Warga Model (Django TestCase)
| Test ID | Test Case | Input | Expected Output |
|---------|-----------|-------|-----------------|
| UT-WRG-01 | Create warga with valid data | Complete profile | Warga created |
| UT-WRG-02 | Create warga with duplicate NIK | NIK already exists | IntegrityError |
| UT-WRG-03 | Get warga by ID | Valid PK | Warga object |
| UT-WRG-04 | Get warga by invalid ID | Random PK | DoesNotExist |
| UT-WRG-05 | Update warga data | Partial data | Updated warga |
| UT-WRG-06 | Soft delete warga | Valid PK | Status changed, not hard deleted |
| UT-WRG-07 | WargaProfile 1:1 with User | Create profile | OneToOne relation works |
| UT-WRG-08 | NIK masking | NIK "3201010101010001" | "3201********0001" |
| UT-WRG-09 | No KK masking | KK "3201010101010001" | "3201********0001" |

### 2.3 Unit Tests — Keuangan Model
| Test ID | Test Case | Input | Expected Output |
|---------|-----------|-------|-----------------|
| UT-FIN-01 | Create pemasukan transaksi | Valid data | Transaksi created |
| UT-FIN-02 | Create pengeluaran transaksi | Valid data | Transaksi created |
| UT-FIN-03 | Get transaksi by ID | Valid PK | Transaksi object |
| UT-FIN-04 | Confirm iuran | Valid iuran ID | Status LUNAS |
| UT-FIN-05 | Reject iuran | Valid iuran ID | Status REJECTED |
| UT-FIN-06 | Auto-generate iuran bulanan | Month + year | Iuran for all active warga |
| UT-FIN-07 | Dashboard saldo calculation | Year | Correct totals |
| UT-FIN-08 | Unique together iuran (warga, bulan, tahun) | Duplicate iuran | IntegrityError |

### 2.4 Unit Tests — Permissions
| Test ID | Test Case | Input | Expected Output |
|---------|-----------|-------|-----------------|
| UT-PERM-01 | IsAdmin with admin role | Admin user | True |
| UT-PERM-02 | IsAdmin with warga role | Warga user | False |
| UT-PERM-03 | IsPengurus with pengurus role | Pengurus user | True |
| UT-PERM-04 | IsPengurus with warga role | Warga user | False |
| UT-PERM-05 | IsSekretaris with sekretaris role | Sekretaris user | True |
| UT-PERM-06 | IsSekretaris with pengurus role | Pengurus user | False |
| UT-PERM-07 | IsBendahara with bendahara role | Bendahara user | True |
| UT-PERM-08 | IsBendahara with sekretaris role | Sekretaris user | False |
| UT-PERM-09 | IsOwnerOrPengurus — owner | Warga accessing own profile | True |
| UT-PERM-10 | IsOwnerOrPengurus — other | Warga accessing other profile | False |
| UT-PERM-11 | IsOwnerOrPengurus — admin | Admin accessing any profile | True |
| UT-PERM-12 | IsOwnerOrPengurusForFile — pemilik | Warga accessing own bukti transfer | True |
| UT-PERM-13 | IsOwnerOrPengurusForFile — other | Warga accessing other bukti transfer | False |

### 2.5 Unit Tests — Serializers
| Test ID | Test Case | Input | Expected Output |
|---------|-----------|-------|-----------------|
| UT-SER-01 | Admin serializer includes all fields | Admin role | nik, no_kk, phone, email, alamat included |
| UT-SER-02 | Warga serializer excludes sensitive fields | Warga role | nik, no_kk, phone, email NOT included |
| UT-SER-03 | Warga serializer includes masked fields | Warga role | nik_masked, no_kk_masked included |
| UT-SER-04 | Owner serializer includes own data | Warga own profile | Full data (no mask) |
| UT-SER-05 | Export serializer masks by default | fullData=false | NIK/KK masked |
| UT-SER-06 | Export serializer full for admin | fullData=true, admin | NIK/KK full |
| UT-SER-07 | Sekretaris serializer includes all fields | Sekretaris role | nik, no_kk, phone, email, alamat included |
| UT-SER-08 | Bendahara serializer includes all fields | Bendahara role | nik, no_kk, phone, email, alamat included |

### 2.6 Unit Tests — File Upload Validators
| Test ID | Test Case | Input | Expected Output |
|---------|-----------|-------|-----------------|
| UT-FILE-01 | Valid JPEG upload | image/jpeg, 1MB | Pass |
| UT-FILE-02 | Valid PNG upload | image/png, 2MB | Pass |
| UT-FILE-03 | Valid PDF upload | application/pdf, 3MB | Pass |
| UT-FILE-04 | Invalid .php upload | application/x-php | ValidationError |
| UT-FILE-05 | Invalid .exe upload | application/x-executable | ValidationError |
| UT-FILE-06 | Oversized file | image/jpeg, 6MB | ValidationError (max 5MB) |
| UT-FILE-07 | MIME mismatch (fake extension) | .jpg but actually .exe | ValidationError (magic bytes) |
| UT-FILE-08 | Filename is UUID | Any valid upload | Filename is UUID, not original |

### 2.7 Unit Tests — Audit Log
| Test ID | Test Case | Input | Expected Output |
|---------|-----------|-------|-----------------|
| UT-AUDIT-01 | Create warga → audit log | Create warga | AuditLog entry with action=create |
| UT-AUDIT-02 | Update warga → audit log | Update warga | AuditLog entry with action=update |
| UT-AUDIT-03 | Delete warga → audit log | Delete warga | AuditLog entry with action=delete |
| UT-AUDIT-04 | Confirm iuran → audit log | Confirm iuran | AuditLog entry with action=confirm |
| UT-AUDIT-05 | Export → audit log | Export warga | AuditLog entry with action=export |
| UT-AUDIT-06 | Audit log masks NIK | Update NIK | old_data/new_data NIK masked |
| UT-AUDIT-07 | Audit log masks no KK | Update KK | old_data/new_data KK masked |
| UT-AUDIT-08 | Audit log masks phone | Update phone | old_data/new_data phone masked |
| UT-AUDIT-09 | Audit log does NOT store password | Change password | old_data/new_data NO password field |
| UT-AUDIT-10 | Audit log does NOT store token | Login | AuditLog NO token field |

### 2.8 Integration Tests — Auth API (DRF APITestCase)
| Test ID | Test Case | Method | Endpoint | Expected |
|---------|-----------|--------|----------|----------|
| IT-AUTH-01 | Register new user | POST | /api/v1/auth/register/ | 201 + user object |
| IT-AUTH-02 | Register duplicate email | POST | /api/v1/auth/register/ | 409 |
| IT-AUTH-03 | Login with valid credentials | POST | /api/v1/auth/login/ | 200 + accessToken + Set-Cookie refresh_token |
| IT-AUTH-04 | Login with wrong password | POST | /api/v1/auth/login/ | 401 |
| IT-AUTH-05 | Login rate limit | POST x11 | /api/v1/auth/login/ | 429 on 11th |
| IT-AUTH-06 | Refresh token | POST | /api/v1/auth/token/refresh/ | 200 + new accessToken + new Set-Cookie |
| IT-AUTH-07 | Refresh with blacklisted token | POST | /api/v1/auth/token/refresh/ | 401 |
| IT-AUTH-08 | Logout | POST | /api/v1/auth/logout/ | 200 + refresh token blacklisted |
| IT-AUTH-09 | Get current user | GET | /api/v1/auth/me/ | 200 + user |
| IT-AUTH-10 | Access protected route without token | GET | /api/v1/warga/ | 401 |
| IT-AUTH-11 | Access protected route with expired token | GET | /api/v1/warga/ | 401 |
| IT-AUTH-12 | Change password | PUT | /api/v1/auth/password/ | 200 |

### 2.9 Integration Tests — Warga API (Object-Level Permission)
| Test ID | Test Case | Method | Endpoint | Expected |
|---------|-----------|--------|----------|----------|
| IT-WRG-01 | List warga (admin) | GET | /api/v1/warga/ | 200 + paginated + full fields |
| IT-WRG-02 | List warga (pengurus) | GET | /api/v1/warga/ | 200 + paginated + full fields |
| IT-WRG-03 | List warga (sekretaris) | GET | /api/v1/warga/ | 200 + paginated + full fields |
| IT-WRG-04 | List warga (bendahara) | GET | /api/v1/warga/ | 200 + paginated + full fields |
| IT-WRG-05 | List warga (warga) | GET | /api/v1/warga/ | 200 + own profile only + masked fields |
| IT-WRG-06 | Get own profile (warga) | GET | /api/v1/warga/:own_id/ | 200 + full data (no mask) |
| IT-WRG-07 | Get other profile (warga) | GET | /api/v1/warga/:other_id/ | 403 Forbidden |
| IT-WRG-08 | Get any profile (admin) | GET | /api/v1/warga/:id/ | 200 + full data |
| IT-WRG-09 | Get any profile (sekretaris) | GET | /api/v1/warga/:id/ | 200 + full data |
| IT-WRG-10 | Create warga (sekretaris) | POST | /api/v1/warga/ | 201 |
| IT-WRG-11 | Create warga (pengurus) | POST | /api/v1/warga/ | 403 |
| IT-WRG-12 | Create warga (warga) | POST | /api/v1/warga/ | 403 |
| IT-WRG-13 | Update own profile (warga) | PUT | /api/v1/warga/:own_id/ | 200 |
| IT-WRG-14 | Update other profile (warga) | PUT | /api/v1/warga/:other_id/ | 403 |
| IT-WRG-15 | Delete warga (admin) | DELETE | /api/v1/warga/:id/ | 200 |
| IT-WRG-16 | Delete warga (pengurus) | DELETE | /api/v1/warga/:id/ | 403 |
| IT-WRG-17 | Verify warga (sekretaris) | PUT | /api/v1/warga/:id/verify/ | 200 |
| IT-WRG-18 | Verify warga (pengurus) | PUT | /api/v1/warga/:id/verify/ | 403 |
| IT-WRG-19 | Export warga (admin) | GET | /api/v1/warga/export/ | 200 + file |
| IT-WRG-20 | Export warga (sekretaris) | GET | /api/v1/warga/export/ | 200 + file |
| IT-WRG-21 | Export warga (warga) | GET | /api/v1/warga/export/ | 403 |
| IT-WRG-22 | Export with fullData=true (admin) | GET | /api/v1/warga/export/?fullData=true | 200 + unmasked |
| IT-WRG-23 | Export with fullData=false | GET | /api/v1/warga/export/?fullData=false | 200 + masked |

### 2.10 Integration Tests — Keuangan API (Object-Level + File Upload)
| Test ID | Test Case | Method | Endpoint | Expected |
|---------|-----------|--------|----------|----------|
| IT-FIN-01 | List transaksi (bendahara) | GET | /api/v1/keuangan/ | 200 + paginated |
| IT-FIN-02 | List transaksi (sekretaris) | GET | /api/v1/keuangan/ | 200 + paginated |
| IT-FIN-03 | List transaksi (pengurus) | GET | /api/v1/keuangan/ | 403 |
| IT-FIN-04 | List transaksi (warga) | GET | /api/v1/keuangan/ | 403 |
| IT-FIN-05 | Create transaksi (bendahara) | POST | /api/v1/keuangan/ | 201 |
| IT-FIN-06 | Create transaksi (sekretaris) | POST | /api/v1/keuangan/ | 201 |
| IT-FIN-07 | Create transaksi (pengurus) | POST | /api/v1/keuangan/ | 403 |
| IT-FIN-08 | Upload bukti iuran (warga, own) | POST | /api/v1/iuran/upload/ | 201 |
| IT-FIN-09 | Upload bukti iuran (warga, other) | POST | /api/v1/iuran/upload/ | 403 |
| IT-FIN-10 | View own bukti transfer (warga) | GET | /api/v1/media/bukti-iuran/:id/ | 200 + file |
| IT-FIN-11 | View other bukti transfer (warga) | GET | /api/v1/media/bukti-iuran/:other_id/ | 403 |
| IT-FIN-12 | View bukti transfer (bendahara) | GET | /api/v1/media/bukti-iuran/:id/ | 200 + file |
| IT-FIN-13 | Konfirmasi iuran (bendahara) | PUT | /api/v1/iuran/:id/confirm/ | 200 |
| IT-FIN-14 | Konfirmasi iuran (sekretaris) | PUT | /api/v1/iuran/:id/confirm/ | 200 |
| IT-FIN-15 | Konfirmasi iuran (pengurus) | PUT | /api/v1/iuran/:id/confirm/ | 403 |
| IT-FIN-16 | Konfirmasi iuran (warga) | PUT | /api/v1/iuran/:id/confirm/ | 403 |
| IT-FIN-17 | Upload .php file | POST | /api/v1/iuran/upload/ | 415 Unsupported Media Type |
| IT-FIN-18 | Upload .exe file | POST | /api/v1/iuran/upload/ | 415 |
| IT-FIN-19 | Upload oversized file (6MB) | POST | /api/v1/iuran/upload/ | 413 Payload Too Large |
| IT-FIN-20 | Upload fake MIME (.jpg but .exe) | POST | /api/v1/iuran/upload/ | 415 |
| IT-FIN-21 | Access file without auth | GET | /api/v1/media/bukti-iuran/:id/ | 401 |
| IT-FIN-22 | Access file with path traversal | GET | /api/v1/media/../../../etc/passwd | 404 |

### 2.11 Integration Tests — Pengaduan API (Object-Level + Privacy)
| Test ID | Test Case | Method | Endpoint | Expected |
|---------|-----------|--------|----------|----------|
| IT-COMP-01 | List own pengaduan (warga) | GET | /api/v1/pengaduan/ | 200 + own only |
| IT-COMP-02 | List all pengaduan (pengurus) | GET | /api/v1/pengaduan/ | 200 + all |
| IT-COMP-03 | Get own pengaduan detail (warga) | GET | /api/v1/pengaduan/:own_id/ | 200 |
| IT-COMP-04 | Get other pengaduan (warga) | GET | /api/v1/pengaduan/:other_id/ | 403 |
| IT-COMP-05 | Get sensitif pengaduan (other warga) | GET | /api/v1/pengaduan/:sensitif_id/ | 403 |
| IT-COMP-06 | Get sensitif pengaduan (pengurus) | GET | /api/v1/pengaduan/:sensitif_id/ | 200 |
| IT-COMP-07 | Create pengaduan (warga) | POST | /api/v1/pengaduan/ | 201 |
| IT-COMP-08 | Update status (pengurus) | PUT | /api/v1/pengaduan/:id/status/ | 200 |
| IT-COMP-09 | Update status (warga) | PUT | /api/v1/pengaduan/:id/status/ | 403 |
| IT-COMP-10 | Upload foto pengaduan (valid) | POST | /api/v1/pengaduan/ | 201 |
| IT-COMP-11 | Upload foto pengaduan (.php) | POST | /api/v1/pengaduan/ | 415 |

### 2.12 Integration Tests — Other Modules
| Module | Test Cases | Count |
|--------|-----------|-------|
| Pengumuman | CRUD + list + detail + file upload validation | 8 |
| Forum | CRUD thread + comment + moderation + object-level | 10 |
| Kegiatan | CRUD + RSVP + double RSVP prevention | 8 |
| Polling | CRUD + vote + double vote prevention + results visibility | 8 |
| Dashboard | Pengurus + warga dashboard + role-filtered data | 6 |
| Notifications | List + read + read-all | 4 |

---

## 3. Security Test Plan (Detailed)

### 3.1 Object-Level Permission Tests
| Test ID | Test Case | Role | Action | Expected |
|---------|-----------|------|--------|----------|
| SEC-OBJ-01 | Warga A GET profil Warga B | Warga A | GET /warga/:b_id | 403 Forbidden |
| SEC-OBJ-02 | Warga A GET iuran Warga B | Warga A | GET /iuran/?warga_id=b_id | 403 or empty |
| SEC-OBJ-03 | Warga A GET bukti transfer Warga B | Warga A | GET /media/bukti-iuran/:b_id | 403 Forbidden |
| SEC-OBJ-04 | Warga A GET pengaduan private Warga B | Warga A | GET /pengaduan/:b_id | 403 Forbidden |
| SEC-OBJ-05 | Warga A PUT profil Warga B | Warga A | PUT /warga/:b_id | 403 Forbidden |
| SEC-OBJ-06 | Warga A DELETE profil Warga B | Warga A | DELETE /warga/:b_id | 403 Forbidden |
| SEC-OBJ-07 | Admin GET profil Warga B | Admin | GET /warga/:b_id | 200 OK |
| SEC-OBJ-08 | Pengurus GET profil Warga B | Pengurus | GET /warga/:b_id | 200 OK |
| SEC-OBJ-09 | Sekretaris GET profil Warga B | Sekretaris | GET /warga/:b_id | 200 OK |
| SEC-OBJ-10 | Bendahara GET profil Warga B | Bendahara | GET /warga/:b_id | 200 OK |
| SEC-OBJ-11 | Warga A GET own profil | Warga A | GET /warga/:a_id | 200 OK (full data) |
| SEC-OBJ-12 | Warga A PUT own profil | Warga A | PUT /warga/:a_id | 200 OK |
| SEC-OBJ-13 | Bendahara GET transaksi list | Bendahara | GET /keuangan/ | 200 OK |
| SEC-OBJ-14 | Pengurus GET transaksi list | Pengurus | GET /keuangan/ | 403 Forbidden |
| SEC-OBJ-15 | Bendahara konfirmasi iuran | Bendahara | PUT /iuran/:id/confirm/ | 200 OK |
| SEC-OBJ-16 | Warga konfirmasi iuran | Warga | PUT /iuran/:id/confirm/ | 403 Forbidden |

### 3.2 Field Masking Tests
| Test ID | Test Case | Role | Field | Expected |
|---------|-----------|------|-------|----------|
| SEC-MASK-01 | List warga — NIK masked | Warga | nik | "3201********0001" |
| SEC-MASK-02 | List warga — no KK masked | Warga | no_kk | "3201********0001" |
| SEC-MASK-03 | List warga — phone hidden | Warga | phone | Not in response |
| SEC-MASK-04 | List warga — email hidden | Warga | email | Not in response |
| SEC-MASK-05 | List warga — alamat hidden | Warga | alamat | Not in response |
| SEC-MASK-06 | List warga — NIK full | Admin | nik | "3201010101010001" |
| SEC-MASK-07 | List warga — no KK full | Pengurus | no_kk | "3201010101010001" |
| SEC-MASK-08 | List warga — NIK full | Sekretaris | nik | "3201010101010001" |
| SEC-MASK-09 | List warga — NIK full | Bendahara | nik | "3201010101010001" |
| SEC-MASK-10 | Export default — NIK masked | Pengurus | nik | Masked |
| SEC-MASK-11 | Export fullData — NIK full | Admin | nik | Full (fullData=true) |
| SEC-MASK-12 | Owner view — NIK full (no mask) | Warga (own) | nik | Full |

### 3.3 Audit Log Tests
| Test ID | Test Case | Expected |
|---------|-----------|----------|
| SEC-AUDIT-01 | Create warga → audit log entry | action=create, table=warga_profiles |
| SEC-AUDIT-02 | Update warga → audit log entry | action=update, old_data + new_data |
| SEC-AUDIT-03 | Delete warga → audit log entry | action=delete |
| SEC-AUDIT-04 | Confirm iuran → audit log entry | action=confirm |
| SEC-AUDIT-05 | Export warga → audit log entry | action=export |
| SEC-AUDIT-06 | Audit log old_data NIK masked | NIK in old_data is "3201********0001" |
| SEC-AUDIT-07 | Audit log new_data NIK masked | NIK in new_data is "3201********0001" |
| SEC-AUDIT-08 | Audit log no KK masked | KK in old_data/new_data is masked |
| SEC-AUDIT-09 | Audit log phone masked | Phone in old_data/new_data is masked |
| SEC-AUDIT-10 | Audit log does NOT contain password | No password field in old_data/new_data |
| SEC-AUDIT-11 | Audit log does NOT contain token | No token field in old_data/new_data |
| SEC-AUDIT-12 | Audit log only accessible by admin | Warga GET /audit-logs/ → 403 |

### 3.4 File Upload Security Tests
| Test ID | Test Case | Expected |
|---------|-----------|----------|
| SEC-FILE-01 | Upload .php file | 415 Unsupported Media Type |
| SEC-FILE-02 | Upload .exe file | 415 |
| SEC-FILE-03 | Upload .sh file | 415 |
| SEC-FILE-04 | Upload .svg with XSS payload | 415 (svg not in allowed MIME) |
| SEC-FILE-05 | Upload file > 5MB | 413 Payload Too Large |
| SEC-FILE-06 | Upload fake MIME (.jpg but actually .exe) | 415 (magic bytes mismatch) |
| SEC-FILE-07 | Upload double extension (.jpg.php) | 415 |
| SEC-FILE-08 | Upload null byte (file.php%00.jpg) | 415 |
| SEC-FILE-09 | Filename is UUID (not original) | Stored as UUID |
| SEC-FILE-10 | Access file without auth | 401 Unauthorized |
| SEC-FILE-11 | Access file with path traversal (../) | 404 Not Found |
| SEC-FILE-12 | Access other user's private file | 403 Forbidden |
| SEC-FILE-13 | Access own private file | 200 OK |
| SEC-FILE-14 | Pengurus access any private file | 200 OK |

### 3.5 JWT / Auth Security Tests
| Test ID | Test Case | Expected |
|---------|-----------|----------|
| SEC-JWT-01 | Access with expired access token | 401 Unauthorized |
| SEC-JWT-02 | Access with invalid signature | 401 |
| SEC-JWT-03 | Access with tampered payload | 401 |
| SEC-JWT-04 | Access with "none" algorithm | 401 |
| SEC-JWT-05 | Reuse blacklisted refresh token | 401 |
| SEC-JWT-06 | Access after logout | 401 (refresh token blacklisted) |
| SEC-JWT-07 | Login rate limit (11 failed attempts) | 429 on 11th |
| SEC-JWT-08 | Password "123456" rejected | 400 (weak password) |
| SEC-JWT-09 | Password "password" rejected | 400 (no uppercase/digit) |
| SEC-JWT-10 | Password stored as Argon2 hash | NOT plaintext in DB |

### 3.6 OWASP Top 10 Tests
| Risk | Test Case | Expected | Status |
|------|-----------|----------|--------|
| A01: Broken Access Control | IDOR: change UUID in URL | 403 Forbidden | ⬜ |
| A01: Broken Access Control | Access admin endpoint as warga | 403 | ⬜ |
| A02: Cryptographic Failures | Password stored as Argon2 | Not plaintext | ⬜ |
| A02: Cryptographic Failures | HTTPS enforced | Redirect HTTP→HTTPS | ⬜ |
| A02: Cryptographic Failures | Backup encrypted | GPG AES256 | ⬜ |
| A03: Injection | SQL injection via search param | Blocked by Django ORM | ⬜ |
| A03: Injection | XSS via input field | Sanitized | ⬜ |
| A04: Insecure Design | Object-level permission enforced | 403 for unauthorized | ⬜ |
| A05: Security Misconfiguration | DEBUG=False in production | No debug info leaked | ⬜ |
| A05: Security Misconfiguration | Security headers present | HSTS, X-Frame-Options | ⬜ |
| A06: Vulnerable Components | Dependencies up-to-date | No known CVEs | ⬜ |
| A07: Auth Failures | Brute force protection | Rate limited | ⬜ |
| A07: Auth Failures | Session fixation | Token rotation | ⬜ |
| A08: Data Integrity | CSRF protection | Token validated | ⬜ |
| A09: Logging Failures | Audit log for sensitive ops | Logged | ⬜ |
| A09: Logging Failures | No sensitive data in logs | No password/token in logs | ⬜ |
| A10: SSRF | File URL manipulation | Blocked | ⬜ |

### 3.7 Backup & Recovery Tests
| Test ID | Test Case | Expected |
|---------|-----------|----------|
| SEC-BAK-01 | Backup job runs successfully | Exit code 0 |
| SEC-BAK-02 | Backup file is encrypted (GPG) | File is .gpg, not plain .gz |
| SEC-BAK-03 | Backup file cannot be read without key | gpg decrypt fails without passphrase |
| SEC-BAK-04 | Restore from backup in non-production | Data restored correctly |
| SEC-BAK-05 | Backup file permission is 600 | Only owner can read |
| SEC-BAK-06 | Backup not in Git repository | .gitignore includes backup files |

---

## 4. Frontend Test Plan

### 4.1 Unit Tests — Stores (Vitest)
| Test ID | Test Case | Store | Expected |
|---------|-----------|-------|----------|
| UT-STO-01 | Login sets user and accessToken | authStore | user + accessToken set |
| UT-STO-02 | Logout clears state | authStore | user + accessToken null |
| UT-STO-03 | Set user data | authStore | user updated |
| UT-STO-04 | accessToken NOT persisted on refresh | authStore | null after page reload |
| UT-STO-05 | Add warga to list | wargaStore | List updated |
| UT-STO-06 | Remove warga from list | wargaStore | List updated |
| UT-STO-07 | Set loading state | wargaStore | isLoading true |
| UT-STO-08 | Set error state | wargaStore | error set |

### 4.2 Unit Tests — Hooks (Vitest + RTL)
| Test ID | Test Case | Hook | Expected |
|---------|-----------|------|----------|
| UT-HOK-01 | useAuth returns user | useAuth | Current user |
| UT-HOK-02 | useAuth login | useAuth | Calls API + updates store |
| UT-HOK-03 | useAuth logout | useAuth | Clears store |
| UT-HOK-04 | useWargaList fetches data | useWargaList | Returns data + loading |
| UT-HOK-05 | useWargaList handles error | useWargaList | Returns error state |
| UT-HOK-06 | useForm validates input | useForm | Validation errors |
| UT-HOK-07 | useForm submits valid data | useForm | Submit called |
| UT-HOK-08 | useDebounce delays value | useDebounce | Delayed value |

### 4.3 Component Tests — Common (Vitest + RTL)
| Test ID | Test Case | Component | Expected |
|---------|-----------|-----------|----------|
| UT-COM-01 | Button renders | Button | Text visible |
| UT-COM-02 | Button onClick | Button | Handler called |
| UT-COM-03 | Button disabled | Button | Not clickable |
| UT-COM-04 | Modal open/close | Modal | Shows/hides content |
| UT-COM-05 | Input onChange | Input | Value updated |
| UT-COM-06 | Input validation error | Input | Error message shown |
| UT-COM-07 | Table renders rows | Table | Rows visible |
| UT-COM-08 | Table empty state | Table | Empty message shown |
| UT-COM-09 | Badge renders | Badge | Correct color + text |
| UT-COM-10 | Loading spinner | Loading | Spinner visible |

### 4.4 Component Tests — Auth
| Test ID | Test Case | Component | Expected |
|---------|-----------|-----------|----------|
| UT-AUT-01 | LoginForm renders | LoginForm | Email + password fields |
| UT-AUT-02 | LoginForm validation | LoginForm | Error on empty submit |
| UT-AUT-03 | LoginForm submit | LoginForm | API called |
| UT-AUT-04 | RegisterForm renders | RegisterForm | All fields visible |
| UT-AUT-05 | RegisterForm validation | RegisterForm | Password mismatch error |

### 4.5 Component Tests — Warga (Field Visibility)
| Test ID | Test Case | Component | Expected |
|---------|-----------|-----------|----------|
| UT-WRG-01 | WargaTable renders (admin) | WargaTable | NIK column visible |
| UT-WRG-02 | WargaTable renders (warga) | WargaTable | NIK column NOT visible |
| UT-WRG-03 | WargaTable shows masked NIK (warga) | WargaTable | "3201********0001" |
| UT-WRG-04 | WargaTable shows full NIK (admin) | WargaTable | "3201010101010001" |
| UT-WRG-05 | WargaForm renders | WargaForm | All fields |
| UT-WRG-06 | WargaForm validation | WargaForm | Required errors |
| UT-WRG-07 | WargaDetail renders | WargaDetail | Profile data |

### 4.6 Component Tests — Other Modules
| Module | Components | Test Count |
|--------|-----------|-----------|
| Keuangan | TransaksiTable, TransaksiForm, Grafik | 6 |
| Pengumuman | PengumumanList, PengumumanCard, Form | 5 |
| Forum | ThreadList, ThreadDetail, CommentForm | 6 |
| Pengaduan | PengaduanList, PengaduanForm, StatusBadge | 5 |
| Kegiatan | Kalender, KegiatanCard, RSVPButton | 5 |
| Polling | PollCard, PollForm, PollResult | 5 |
| Dashboard | StatsCard, Chart, RecentActivity | 4 |

### 4.7 Integration Tests — Pages (Vitest + MSW)
| Test ID | Test Case | Page | Expected |
|---------|-----------|------|----------|
| IT-PAGE-01 | Login page flow | /login | Login → redirect dashboard |
| IT-PAGE-02 | Register page flow | /register | Register → pending message |
| IT-PAGE-03 | Dashboard pengurus | /dashboard | Stats visible |
| IT-PAGE-04 | Dashboard warga | /dashboard | Iuran + pengumuman visible |
| IT-PAGE-05 | Warga list page | /warga | Table + filter works |
| IT-PAGE-06 | Warga CRUD flow | /warga/create | Create → list updated |
| IT-PAGE-07 | Keuangan page | /keuangan | Transaksi list visible |
| IT-PAGE-08 | Forum page | /forum | Thread list visible |
| IT-PAGE-09 | Pengaduan page | /pengaduan | Pengaduan list visible |
| IT-PAGE-10 | Kegiatan page | /kegiatan | Kalender visible |

---

## 5. Test Data Strategy

### 5.1 Test Fixtures (Django fixtures)
```python
# accounts/tests/fixtures.py
import pytest
from accounts.models import User, WargaProfile

@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        email='admin@smartrt.local',
        username='admin',
        phone='081111111111',
        password='Admin123!',
        role='admin',
        status='active'
    )

@pytest.fixture
def sekretaris_user(db):
    return User.objects.create_user(
        email='sekretaris@smartrt.local',
        username='sekretaris',
        phone='081111111110',
        password='Sekretaris123!',
        role='sekretaris',
        status='active'
    )

@pytest.fixture
def bendahara_user(db):
    return User.objects.create_user(
        email='bendahara@smartrt.local',
        username='bendahara',
        phone='081111111112',
        password='Bendahara123!',
        role='bendahara',
        status='active'
    )

@pytest.fixture
def pengurus_user(db):
    return User.objects.create_user(
        email='pengurus@smartrt.local',
        username='pengurus',
        phone='082222222222',
        password='Pengurus123!',
        role='pengurus',
        status='active'
    )

@pytest.fixture
def warga_user_a(db):
    user = User.objects.create_user(
        email='warga_a@smartrt.local',
        username='warga_a',
        phone='083333333333',
        password='WargaA123!',
        role='warga',
        status='active'
    )
    WargaProfile.objects.create(
        user=user,
        nik='3201010101010001',
        nama_lengkap='Ahmad Fauzi',
        blok='A',
        no_rumah='15',
        status='aktif'
    )
    return user

@pytest.fixture
def warga_user_b(db):
    user = User.objects.create_user(
        email='warga_b@smartrt.local',
        username='warga_b',
        phone='084444444444',
        password='WargaB123!',
        role='warga',
        status='active'
    )
    WargaProfile.objects.create(
        user=user,
        nik='3201020202020002',
        nama_lengkap='Budi Santoso',
        blok='B',
        no_rumah='10',
        status='aktif'
    )
    return user
```

### 5.2 Test Database
```bash
# pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.test
python_files = tests.py test_*.py *_tests.py

# Django test settings — use separate test database
# config/settings/test.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'smartrt_test',
        'USER': 'smartrt',
        'PASSWORD': 'test_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 5.3 MSW Handlers (Frontend)
```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/warga', () => {
    return HttpResponse.json({
      status: 'success',
      data: [mockWargaProfile],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  }),
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      status: 'success',
      data: { user: mockWarga, accessToken: 'mock-jwt', expiresIn: 1800 },
    });
  }),
];
```

---

## 6. Performance Testing

### 6.1 Load Testing (k6)
```javascript
// tests/performance/auth-load.js
import http from 'k6/http';

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  http.post('http://localhost:8000/api/v1/auth/login/', JSON.stringify({
    email: 'warga@smartrt.local',
    password: 'password123',
  }), { headers: { 'Content-Type': 'application/json' } });
}
```

### 6.2 Performance Targets
| Endpoint | Target p95 | Max p99 |
|----------|-----------|---------|
| Login | < 200ms | < 500ms |
| List warga | < 300ms | < 600ms |
| Get detail | < 150ms | < 300ms |
| Create/Update | < 400ms | < 800ms |
| Export PDF | < 2s | < 5s |
| Dashboard | < 500ms | < 1s |

### 6.3 Load Test Scenarios
| Scenario | VUs | Duration | Purpose |
|----------|-----|----------|---------|
| Normal load | 20 | 5 min | Daily usage |
| Peak load | 50 | 5 min | Peak hours |
| Stress test | 100 | 5 min | Breaking point |
| Soak test | 30 | 30 min | Memory leaks |

---

## 7. PWA Testing

### 7.1 PWA Checklist
| Check | Method | Expected |
|-------|--------|----------|
| Manifest | Lighthouse | Valid manifest.json |
| Service Worker | DevTools | SW registered |
| Offline mode | DevTools offline | Cached pages load |
| Install prompt | Browser | "Add to Home Screen" |
| Push notification | Manual | Notification received |
| Theme color | Manual | Status bar colored |
| Splash screen | Manual | Shows on launch |
| Responsive | DevTools | All breakpoints work |

### 7.2 Lighthouse Targets
| Category | Target |
|----------|--------|
| Performance | > 90 |
| Accessibility | > 90 |
| Best Practices | > 90 |
| SEO | > 90 |
| PWA | > 90 |

---

## 8. Test Execution Plan

### 8.1 Pre-Development
- [ ] Setup test environment (pytest, Vitest, RTL)
- [ ] Create test fixtures and mocks
- [ ] Setup test database (smartrt_test)
- [ ] Configure CI/CD pipeline
- [ ] Setup bandit (Python security linter)

### 8.2 During Development
- [ ] Write unit tests alongside code (TDD)
- [ ] Write integration tests after API complete
- [ ] Write security tests for each phase
- [ ] Run tests before every commit (pre-commit hook)
- [ ] Maintain coverage > 80%

### 8.3 Pre-Release
- [ ] Run full test suite
- [ ] Security testing (OWASP ZAP + manual)
- [ ] Performance testing (k6)
- [ ] PWA testing
- [ ] Cross-browser testing
- [ ] Mobile responsive testing
- [ ] User acceptance testing (UAT)
- [ ] Backup/restore test

### 8.4 CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
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
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r requirements/dev.txt
      - run: python manage.py test --settings=config.settings.test
      - run: pytest --cov=backend --cov-report=xml
      - run: bandit -r backend/
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
```

---

## 9. Test Summary

| Category | Tests | Status |
|----------|-------|--------|
| Backend Unit (Auth) | 18 | ⬜ |
| Backend Unit (Warga) | 9 | ⬜ |
| Backend Unit (Keuangan) | 8 | ⬜ |
| Backend Unit (Permissions) | 13 | ⬜ |
| Backend Unit (Serializers) | 8 | ⬜ |
| Backend Unit (File Upload) | 8 | ⬜ |
| Backend Unit (Audit Log) | 10 | ⬜ |
| Backend Integration (Auth) | 12 | ⬜ |
| Backend Integration (Warga) | 23 | ⬜ |
| Backend Integration (Keuangan) | 22 | ⬜ |
| Backend Integration (Pengaduan) | 11 | ⬜ |
| Backend Integration (Other) | 44 | ⬜ |
| Security (Object-Level) | 16 | ⬜ |
| Security (Masking) | 12 | ⬜ |
| Security (Audit Log) | 12 | ⬜ |
| Security (File Upload) | 14 | ⬜ |
| Security (JWT/Auth) | 10 | ⬜ |
| Security (OWASP Top 10) | 17 | ⬜ |
| Security (Backup) | 6 | ⬜ |
| Frontend Unit (Stores) | 8 | ⬜ |
| Frontend Unit (Hooks) | 8 | ⬜ |
| Frontend Unit (Components) | 40+ | ⬜ |
| Frontend Integration (Pages) | 10 | ⬜ |
| Performance | 4 scenarios | ⬜ |
| PWA | 8 checks | ⬜ |
| **Total** | **300+** | |

---

## 10. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-06 | Initial test plan |
| 1.1.0 | 2026-06-07 | Migrated backend from Vitest/Supertest/Node to pytest/Django TestCase/DRF APITestCase. Added detailed security test sections: object-level permission tests (SEC-OBJ), field masking tests (SEC-MASK), audit log tests (SEC-AUDIT), file upload security tests (SEC-FILE), JWT/auth security tests (SEC-JWT), OWASP Top 10 tests, backup/recovery tests. Added Django fixtures. Updated CI/CD pipeline for Django. Updated test counts. |
| 1.2.0 | 2026-06-08 | Expanded to 5-role system: added sekretaris_user and bendahara_user fixtures. Added permission unit tests for IsSekretaris and IsBendahara (UT-PERM-05 to UT-PERM-08). Added integration tests for Sekretaris (CRUD warga, verifikasi, export) and Bendahara (CRUD keuangan, konfirmasi iuran). Added object-level permission tests (SEC-OBJ-09 to SEC-OBJ-16) and field masking tests (SEC-MASK-08, SEC-MASK-09) for Sekretaris & Bendahara. Added serializer tests (UT-SER-07, UT-SER-08). Updated test counts. |
