# Smart-RT — Test Plan

**Version:** 1.0.0
**Date:** June 6, 2026
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
│  │  │  │Services │ │Validators│ │Utilities│       │    │    │
│  │  │  └─────────┘ └─────────┘ └─────────┘       │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Testing Tools
| Layer | Tool | Purpose |
|-------|------|---------|
| Backend Unit | Vitest | Service, middleware, utility tests |
| Backend Integration | Vitest + Supertest | API endpoint tests |
| Frontend Unit | Vitest | Store, hook, utility tests |
| Frontend Component | Vitest + React Testing Library | Component rendering & interaction |
| Frontend Integration | Vitest + MSW | Page-level API mocking |
| E2E | Manual | Full user flow testing |
| Performance | k6 / Artillery | API load testing |
| Security | Manual + OWASP ZAP | Security testing |

### 1.3 Coverage Targets
| Layer | Target | Minimum |
|-------|--------|---------|
| Backend Services | 90% | 80% |
| Backend Controllers | 85% | 75% |
| Backend Middleware | 90% | 80% |
| Frontend Stores | 90% | 80% |
| Frontend Components | 80% | 70% |
| Frontend Hooks | 85% | 75% |
| **Overall** | **85%** | **75%** |

---

## 2. Backend Test Plan

### 2.1 Unit Tests — Auth Service
| Test ID | Test Case | Input | Expected Output |
|---------|-----------|-------|-----------------|
| UT-AUTH-01 | Register with valid data | Valid email, phone, password | User created, status PENDING |
| UT-AUTH-02 | Register with duplicate email | Email already exists | 409 Conflict |
| UT-AUTH-03 | Register with invalid email | "not-an-email" | 400 Validation error |
| UT-AUTH-04 | Register with short password | "123" | 400 Validation error |
| UT-AUTH-05 | Login with valid credentials | Correct email + password | JWT token returned |
| UT-AUTH-06 | Login with wrong password | Wrong password | 401 Unauthorized |
| UT-AUTH-07 | Login with unverified account | Status PENDING | 403 Forbidden |
| UT-AUTH-08 | Login with rejected account | Status REJECTED | 403 Forbidden |
| UT-AUTH-09 | Change password with correct current | Correct current + new password | Success |
| UT-AUTH-10 | Change password with wrong current | Wrong current password | 401 Unauthorized |
| UT-AUTH-11 | JWT token generation | Valid user | Token with correct payload |
| UT-AUTH-12 | JWT token verification | Valid token | Decoded payload |
| UT-AUTH-13 | JWT token verification | Expired token | 401 Unauthorized |
| UT-AUTH-14 | JWT token verification | Invalid signature | 401 Unauthorized |

### 2.2 Unit Tests — Warga Service
| Test ID | Test Case | Input | Expected Output |
|---------|-----------|-------|-----------------|
| UT-WRG-01 | Create warga with valid data | Complete profile | Warga created |
| UT-WRG-02 | Create warga with duplicate NIK | NIK already exists | 409 Conflict |
| UT-WRG-03 | Get warga by ID | Valid UUID | Warga object |
| UT-WRG-04 | Get warga by invalid ID | Random UUID | 404 Not Found |
| UT-WRG-05 | Update warga data | Partial data | Updated warga |
| UT-WRG-06 | Delete warga | Valid UUID | Warga deleted |
| UT-WRG-07 | List warga with pagination | page=1, limit=20 | Paginated results |
| UT-WRG-08 | Search warga by name | "Ahmad" | Matching results |
| UT-WRG-09 | Filter warga by status | status=aktif | Filtered results |
| UT-WRG-10 | Filter warga by blok | blok=A | Filtered results |
| UT-WRG-11 | Verify warga (approve) | Valid UUID | Status ACTIVE |
| UT-WRG-12 | Verify warga (reject) | Valid UUID | Status REJECTED |
| UT-WRG-13 | Export warga to Excel | Filter params | Excel file |
| UT-WRG-14 | Export warga to PDF | Filter params | PDF file |

### 2.3 Unit Tests — Keuangan Service
| Test ID | Test Case | Input | Input | Expected Output |
|---------|-----------|-------|-------|
| UT-FIN-01 | Create pemasukan transaksi | Valid data | Transaksi created |
| UT-FIN-02 | Create pengeluaran transaksi | Valid data | Transaksi created |
| UT-FIN-03 | Get transaksi by ID | Valid UUID | Transaksi object |
| UT-FIN-04 | List transaksi with filter | tipe=pemasukan | Filtered results |
| UT-FIN-05 | List transaksi by date range | dari & sampai | Filtered results |
| UT-FIN-06 | Update transaksi | Partial data | Updated transaksi |
| UT-FIN-07 | Delete transaksi | Valid UUID | Transaksi deleted |
| UT-FIN-08 | Confirm iuran | Valid iuran ID | Status LUNAS |
| UT-FIN-09 | Reject iuran | Valid iuran ID | Status REJECTED |
| UT-FIN-10 | Auto-generate iuran bulanan | Month + year | Iuran for all warga |
| UT-FIN-11 | Dashboard saldo calculation | Year | Correct totals |
| UT-FIN-12 | Laporan PDF generation | Date range | PDF file |

### 2.4 Unit Tests — Middleware
| Test ID | Test Case | Input | Expected Output |
|---------|-----------|-------|-----------------|
| UT-MID-01 | Auth middleware with valid token | Bearer token | next() called |
| UT-MID-02 | Auth middleware without token | No header | 401 Unauthorized |
| UT-MID-03 | Auth middleware with invalid token | "Bearer invalid" | 401 Unauthorized |
| UT-MID-04 | RBAC middleware with correct role | Admin accessing admin route | next() called |
| UT-MID-05 | RBAC middleware with wrong role | Warga accessing admin route | 403 Forbidden |
| UT-MID-06 | Rate limiter under limit | 50 requests | All pass |
| UT-MID-07 | Rate limiter over limit | 101 requests | 429 on 101st |
| UT-MID-08 | Error handler with AppError | ValidationError | Correct status + format |
| UT-MID-09 | Error handler with unknown error | TypeError | 500 + generic message |

### 2.5 Integration Tests — Auth API
| Test ID | Test Case | Method | Endpoint | Expected |
|---------|-----------|--------|----------|----------|
| IT-AUTH-01 | Register new user | POST | /auth/register | 201 + user object |
| IT-AUTH-02 | Register duplicate email | POST | /auth/register | 409 |
| IT-AUTH-03 | Login with valid credentials | POST | /auth/login | 200 + token |
| IT-AUTH-04 | Login with wrong password | POST | /auth/login | 401 |
| IT-AUTH-05 | Get current user | GET | /auth/me | 200 + user |
| IT-AUTH-06 | Access protected route without token | GET | /warga | 401 |
| IT-AUTH-07 | Access protected route with invalid token | GET | /warga | 401 |
| IT-AUTH-08 | Change password | PUT | /auth/password | 200 |
| IT-AUTH-09 | Logout | POST | /auth/logout | 200 |

### 2.6 Integration Tests — Warga API
| Test ID | Test Case | Method | Endpoint | Expected |
|---------|-----------|--------|----------|----------|
| IT-WRG-01 | List warga (pengurus) | GET | /warga | 200 + paginated |
| IT-WRG-02 | List warga (warga) | GET | /warga | 403 |
| IT-WRG-03 | Get warga detail | GET | /warga/:id | 200 + detail |
| IT-WRG-04 | Create warga | POST | /warga | 201 |
| IT-WRG-05 | Create warga (invalid data) | POST | /warga | 400 |
| IT-WRG-06 | Update warga | PUT | /warga/:id | 200 |
| IT-WRG-07 | Delete warga (admin) | DELETE | /warga/:id | 200 |
| IT-WRG-08 | Delete warga (pengurus) | DELETE | /warga/:id | 403 |
| IT-WRG-09 | Search warga | GET | /warga?search=ahmad | 200 + filtered |
| IT-WRG-10 | Verify warga | PUT | /warga/:id/verify | 200 |

### 2.7 Integration Tests — Keuangan API
| Test ID | Test Case | Method | Endpoint | Expected |
|---------|-----------|--------|----------|----------|
| IT-FIN-01 | List transaksi | GET | /keuangan | 200 + paginated |
| IT-FIN-02 | Create transaksi | POST | /keuangan | 201 |
| IT-FIN-03 | Update transaksi | PUT | /keuangan/:id | 200 |
| IT-FIN-04 | Delete transaksi | DELETE | /keuangan/:id | 200 |
| IT-FIN-05 | Upload bukti iuran | POST | /iuran/upload | 201 |
| IT-FIN-06 | Konfirmasi iuran | PUT | /iuran/:id/confirm | 200 |
| IT-FIN-07 | Dashboard keuangan | GET | /keuangan/dashboard | 200 + stats |
| IT-FIN-08 | Laporan PDF | GET | /keuangan/laporan | PDF file |

### 2.8 Integration Tests — Other Modules
| Module | Test Cases | Count |
|--------|-----------|-------|
| Pengumuman | CRUD + list + detail | 6 |
| Forum | CRUD thread + comment + moderation | 8 |
| Pengaduan | CRUD + status update + filter | 7 |
| Kegiatan | CRUD + RSVP | 6 |
| Polling | CRUD + vote + results | 6 |
| Dashboard | Pengurus + warga dashboard | 4 |
| Notifications | List + read + read-all | 4 |
| File Upload | Upload + validation | 3 |

---

## 3. Frontend Test Plan

### 3.1 Unit Tests — Stores
| Test ID | Test Case | Store | Expected |
|---------|-----------|-------|----------|
| UT-STO-01 | Login sets user and token | authStore | user + token set |
| UT-STO-02 | Logout clears state | authStore | user + token null |
| UT-STO-03 | Set user data | authStore | user updated |
| UT-STO-04 | Add warga to list | wargaStore | List updated |
| UT-STO-05 | Remove warga from list | wargaStore | List updated |
| UT-STO-06 | Set loading state | wargaStore | isLoading true |
| UT-STO-07 | Set error state | wargaStore | error set |
| UT-STO-08 | Pagination state | wargaStore | page + limit set |

### 3.2 Unit Tests — Hooks
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

### 3.3 Component Tests — Common
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

### 3.4 Component Tests — Auth
| Test ID | Test Case | Component | Expected |
|---------|-----------|-----------|----------|
| UT-AUT-01 | LoginForm renders | LoginForm | Email + password fields |
| UT-AUT-02 | LoginForm validation | LoginForm | Error on empty submit |
| UT-AUT-03 | LoginForm submit | LoginForm | API called |
| UT-AUT-04 | RegisterForm renders | RegisterForm | All fields visible |
| UT-AUT-05 | RegisterForm validation | RegisterForm | Password mismatch error |

### 3.5 Component Tests — Warga
| Test ID | Test Case | Component | Expected |
|---------|-----------|-----------|----------|
| UT-WRG-01 | WargaTable renders | WargaTable | Rows visible |
| UT-WRG-02 | WargaTable empty | WargaTable | Empty state |
| UT-WRG-03 | WargaForm renders | WargaForm | All fields |
| UT-WRG-04 | WargaForm validation | WargaForm | Required errors |
| UT-WRG-05 | WargaDetail renders | WargaDetail | Profile data |

### 3.6 Component Tests — Other Modules
| Module | Components | Test Count |
|--------|-----------|-----------|
| Keuangan | TransaksiTable, TransaksiForm, Grafik | 6 |
| Pengumuman | PengumumanList, PengumumanCard, Form | 5 |
| Forum | ThreadList, ThreadDetail, CommentForm | 6 |
| Pengaduan | PengaduanList, PengaduanForm, StatusBadge | 5 |
| Kegiatan | Kalender, KegiatanCard, RSVPButton | 5 |
| Polling | PollCard, PollForm, PollResult | 5 |
| Dashboard | StatsCard, Chart, RecentActivity | 4 |

### 3.7 Integration Tests — Pages
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

## 4. Test Data Strategy

### 4.1 Test Fixtures
```typescript
// tests/fixtures/users.ts
export const mockAdmin = {
  id: 'uuid-admin',
  email: 'admin@smartrt.local',
  phone: '081111111111',
  role: 'ADMIN',
  status: 'ACTIVE',
};

export const mockPengurus = {
  id: 'uuid-pengurus',
  email: 'pengurus@smartrt.local',
  phone: '082222222222',
  role: 'PENGURUS',
  status: 'ACTIVE',
};

export const mockWarga = {
  id: 'uuid-warga',
  email: 'warga@smartrt.local',
  phone: '083333333333',
  role: 'WARGA',
  status: 'ACTIVE',
};

// tests/fixtures/warga.ts
export const mockWargaProfile = {
  id: 'uuid-profile',
  userId: 'uuid-warga',
  nik: '1234567890123456',
  namaLengkap: 'Ahmad Fauzi',
  tempatLahir: 'Palangkaraya',
  tanggalLahir: '1990-05-15',
  jenisKelamin: 'L',
  agama: 'Islam',
  blok: 'A',
  noRumah: '15',
  status: 'AKTIF',
};
```

### 4.2 Test Database
```bash
# Use separate test database
DATABASE_URL="postgresql://smartrt:***@localhost:5432/smartrt_test"

# Reset before test run
npx prisma migrate reset --force --skip-seed
npx prisma db seed
```

### 4.3 MSW Handlers (Frontend)
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
      data: { user: mockWarga, token: 'mock-jwt' },
    });
  }),
];
```

---

## 5. Performance Testing

### 5.1 Load Testing (k6)
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
  http.post('http://localhost:3001/api/v1/login', JSON.stringify({
    email: 'warga@smartrt.local',
    password: 'password123',
  }), { headers: { 'Content-Type': 'application/json' } });
}
```

### 5.2 Performance Targets
| Endpoint | Target p95 | Max p99 |
|----------|-----------|---------|
| Login | < 200ms | < 500ms |
| List warga | < 300ms | < 600ms |
| Get detail | < 150ms | < 300ms |
| Create/Update | < 400ms | < 800ms |
| Export PDF | < 2s | < 5s |
| Dashboard | < 500ms | < 1s |

### 5.3 Load Test Scenarios
| Scenario | VUs | Duration | Purpose |
|----------|-----|----------|---------|
| Normal load | 20 | 5 min | Daily usage |
| Peak load | 50 | 5 min | Peak hours |
| Stress test | 100 | 5 min | Breaking point |
| Soak test | 30 | 30 min | Memory leaks |

---

## 6. Security Testing

### 6.1 Security Checklist
| Check | Method | Expected |
|-------|--------|----------|
| SQL Injection | Manual (sqlmap) | Blocked |
| XSS | Manual (payload test) | Sanitized |
| CSRF | Manual | Token validated |
| Brute force | Manual (hydra) | Rate limited |
| IDOR | Manual (change ID in URL) | 403 Forbidden |
| File upload | Upload .exe, .php | Rejected |
| JWT tampering | Modify token | 401 Unauthorized |
| Password strength | Test weak passwords | Rejected |
| Session fixation | Reuse old token | 401 Unauthorized |
| CORS | Request from other origin | Blocked |

### 6.2 OWASP Top 10 Checklist
| Risk | Status |
|------|--------|
| A01: Broken Access Control | ⬜ Test |
| A02: Cryptographic Failures | ⬜ Test |
| A03: Injection | ⬜ Test |
| A04: Insecure Design | ⬜ Test |
| A05: Security Misconfiguration | ⬜ Test |
| A06: Vulnerable Components | ⬜ Test |
| A07: Auth Failures | ⬜ Test |
| A08: Data Integrity Failures | ⬜ Test |
| A09: Logging Failures | ⬜ Test |
| A10: SSRF | ⬜ Test |

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
- [ ] Setup test environment (Vitest, Supertest, RTL)
- [ ] Create test fixtures and mocks
- [ ] Setup test database
- [ ] Configure CI/CD pipeline

### 8.2 During Development
- [ ] Write unit tests alongside code (TDD)
- [ ] Write integration tests after API complete
- [ ] Run tests before every commit (pre-commit hook)
- [ ] Maintain coverage > 80%

### 8.3 Pre-Release
- [ ] Run full test suite
- [ ] Performance testing
- [ ] Security testing
- [ ] PWA testing
- [ ] Cross-browser testing
- [ ] Mobile responsive testing
- [ ] User acceptance testing (UAT)

### 8.4 CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage
```

---

## 9. Test Summary

| Category | Tests | Status |
|----------|-------|--------|
| Backend Unit (Auth) | 14 | ⬜ |
| Backend Unit (Warga) | 14 | ⬜ |
| Backend Unit (Keuangan) | 12 | ⬜ |
| Backend Unit (Middleware) | 9 | ⬜ |
| Backend Integration | 35+ | ⬜ |
| Frontend Unit (Stores) | 8 | ⬜ |
| Frontend Unit (Hooks) | 8 | ⬜ |
| Frontend Unit (Components) | 40+ | ⬜ |
| Frontend Integration (Pages) | 10 | ⬜ |
| Performance | 4 scenarios | ⬜ |
| Security | 10 checks | ⬜ |
| PWA | 8 checks | ⬜ |
| **Total** | **150+** | |

---

## 10. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-06 | Initial test plan |
