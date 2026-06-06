# Smart-RT — Coding Standard

**Version:** 1.0.0
**Date:** June 6, 2026
**Status:** Draft

---

## 1. Project Structure

### 1.1 Directory Layout
```
smart-rt/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, env, constants
│   │   ├── middleware/      # Auth, RBAC, error handler, rate limiter
│   │   ├── routes/          # Route definitions
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Helpers, formatters
│   │   ├── app.ts           # Express app setup
│   │   └── index.ts         # Entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── seed.ts          # Seed data
│   │   └── migrations/      # Migration files
│   ├── tests/
│   │   ├── unit/            # Unit tests
│   │   └── integration/     # Integration tests
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # Button, Modal, Table, Form, Card
│   │   │   ├── layout/      # Header, Sidebar, Footer
│   │   │   ├── auth/        # LoginForm, RegisterForm
│   │   │   ├── warga/       # WargaTable, WargaForm
│   │   │   ├── keuangan/    # TransaksiTable, Grafik
│   │   │   ├── pengumuman/  # PengumumanList, PengumumanForm
│   │   │   ├── forum/       # ThreadList, ThreadDetail
│   │   │   ├── pengaduan/   # PengaduanList, PengaduanForm
│   │   │   ├── kegiatan/    # Kalender, KegiatanCard
│   │   │   └── polling/     # PollCard, PollForm
│   │   ├── hooks/           # Custom hooks
│   │   ├── stores/          # Zustand stores
│   │   ├── services/        # API client
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Helpers
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── docs/
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

### 1.2 File Naming
- **Components**: `PascalCase.tsx` (e.g., `WargaTable.tsx`)
- **Hooks**: `useCamelCase.ts` (e.g., `useAuth.ts`)
- **Stores**: `camelCaseStore.ts` (e.g., `authStore.ts`)
- **Services**: `camelCaseService.ts` (e.g., `wargaService.ts`)
- **Types**: `camelCase.ts` (e.g., `warga.ts`)
- **Utils**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Constants**: `UPPER_SNAKE_CASE.ts` (e.g., `API_ENDPOINTS.ts`)
- **Tests**: `*.test.ts` or `*.test.tsx`

---

## 2. TypeScript Conventions

### 2.1 Types vs Interfaces
```typescript
// Use interface for object shapes (API responses, props)
interface WargaProfile {
  id: string;
  namaLengkap: string;
  nik: string | null;
}

// Use type for unions, intersections, utilities
type Role = 'ADMIN' | 'PENGURUS' | 'WARGA';
type Status = 'ACTIVE' | 'PENDING' | 'REJECTED';
type ApiResponse<T> = { status: 'success'; data: T } | { status: 'error'; message: string };
```

### 2.2 Naming
```typescript
// Variables & functions: camelCase
const namaLengkap = 'Ahmad';
function getWargaById(id: string) {}

// Constants: USCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const API_BASE_URL = '/api/v1';

// Types/Interfaces: PascalCase
interface WargaListParams {}
type TransaksiTipe = 'PEMASUKAN' | 'PENGELUARAN';

// Enums: PascalCase with UPPER values
enum Role {
  ADMIN = 'ADMIN',
  PENGURUS = 'PENGURUS',
  WARGA = 'WARGA',
}

// Boolean: prefix with is/has/can/should
const isLoading = false;
const hasVoted = true;
const canEdit = role === 'ADMIN';
```

### 2.3 Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 2.4 No `any`
```typescript
// ❌ BAD
function processData(data: any) { ... }

// ✅ GOOD
function processData(data: unknown) { ... }
function processData(data: WargaProfile) { ... }
```

---

## 3. Backend Conventions

### 3.1 Route Structure
```typescript
// routes/warga.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as wargaController from '../controllers/warga';

const router = Router();

router.get('/', authorize(['ADMIN', 'PENGURUS']), wargaController.list);
router.get('/:id', authorize(['ADMIN', 'PENGURUS']), wargaController.getById);
router.post('/', authorize(['ADMIN', 'PENGURUS']), wargaController.create);
router.put('/:id', authorize(['ADMIN', 'PENGURUS']), wargaController.update);
router.delete('/:id', authorize(['ADMIN']), wargaController.remove);

export default router;
```

### 3.2 Controller Pattern
```typescript
// controllers/warga.ts
import { Request, Response, NextFunction } from 'express';
import * as wargaService from '../services/warga';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const result = await wargaService.findAll({
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      status: status as string,
    });
    res.json({ status: 'success', data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}
```

### 3.3 Service Pattern
```typescript
// services/warga.ts
import { prisma } from '../config/database';
import type { WargaListParams, WargaCreateInput } from '../types/warga';

export async function findAll(params: WargaListParams) {
  const { page, limit, search, status } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(search && { namaLengkap: { contains: search, mode: 'insensitive' } }),
    ...(status && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.wargaProfile.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.wargaProfile.count({ where }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
```

### 3.4 Error Handling
```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} tidak ditemukan`);
  }
}

export class ValidationError extends AppError {
  constructor(errors: Array<{ field: string; message: string }>) {
    super(400, 'Validasi gagal', errors);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super(403, 'Anda tidak memiliki akses');
  }
}

// middleware/errorHandler.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      errors: err.errors,
    });
  }
  // Log unexpected errors
  logger.error(err);
  return res.status(500).json({ status: 'error', message: 'Internal server error' });
}
```

### 3.5 Validation (Zod)
```typescript
// validators/warga.ts
import { z } from 'zod';

export const createWargaSchema = z.object({
  nik: z.string().length(16).optional(),
  namaLengkap: z.string().min(2).max(255),
  tempatLahir: z.string().max(100).optional(),
  tanggalLahir: z.string().date().optional(),
  jenisKelamin: z.enum(['L', 'P']).optional(),
  agama: z.string().max(50).optional(),
  blok: z.string().max(10).optional(),
  noRumah: z.string().max(10).optional(),
});

export type CreateWargaInput = z.infer<typeof createWargaSchema>;

// Usage in controller
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createWargaSchema.parse(req.body);
    const warga = await wargaService.create(data);
    res.status(201).json({ status: 'success', data: warga });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return next(new ValidationError(errors));
    }
    next(error);
  }
}
```

### 3.6 Prisma Usage
```typescript
// config/database.ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

// Always use select/include wisely
const warga = await prisma.wargaProfile.findMany({
  select: { id: true, namaLengkap: true, blok: true },
  where: { status: 'AKTIF' },
});

// Use transactions for multi-step operations
await prisma.$transaction(async (tx) => {
  const transaksi = await tx.transaksi.create({ data: { ... } });
  await tx.auditLog.create({ data: { action: 'create', tableName: 'transaksi', recordId: transaksi.id } });
});
```

---

## 4. Frontend Conventions

### 4.1 Component Structure
```tsx
// components/warga/WargaTable.tsx
import { useState } from 'react';
import { useWargaStore } from '../../stores/wargaStore';
import { Button } from '../common/Button';
import type { WargaProfile } from '../../types/warga';

interface WargaTableProps {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WargaTable({ onEdit, onDelete }: WargaTableProps) {
  const { data, isLoading } = useWargaStore();

  if (isLoading) return <div>Loading...</div>;

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Nama</th>
          <th>Blok</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {data.map((warga) => (
          <tr key={warga.id}>
            <td>{warga.namaLengkap}</td>
            <td>{warga.blok}</td>
            <td>
              <Button onClick={() => onEdit(warga.id)}>Edit</Button>
              <Button variant="danger" onClick={() => onDelete(warga.id)}>Hapus</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 4.2 Zustand Store Pattern
```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setUser: (user) => set({ user }),
    }),
    { name: 'smartrt-auth' }
  )
);
```

### 4.3 Custom Hook Pattern
```typescript
// hooks/useWarga.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wargaApi } from '../services/api';
import type { WargaListParams } from '../types/warga';

export function useWargaList(params: WargaListParams) {
  return useQuery({
    queryKey: ['warga', params],
    queryFn: () => wargaApi.list(params),
  });
}

export function useCreateWarga() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: wargaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warga'] });
    },
  });
}
```

### 4.4 Tailwind CSS Conventions
```tsx
// ✅ GOOD: Use Tailwind utility classes
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors">
  Simpan
</button>

// ✅ GOOD: Extract repeated patterns to components
// components/common/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

// ❌ BAD: Inline styles
<button style={{ backgroundColor: '#1E40AF', color: 'white' }}>Simpan</button>

// ❌ BAD: Custom CSS files for everything
// Use Tailwind config for custom values instead
```

### 4.5 Responsive Design
```tsx
// Mobile-first approach
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/3">Sidebar</div>
  <div className="w-full md:w-2/3">Content</div>
</div>

// Conditional rendering for mobile/desktop
<nav className="hidden md:block">Desktop Sidebar</nav>
<nav className="md:hidden">Mobile Bottom Nav</nav>
```

---

## 5. API Conventions

### 5.1 RESTful Naming
```
GET    /api/v1/warga          — List warga
GET    /api/v1/warga/:id      — Get warga detail
POST   /api/v1/warga          — Create warga
PUT    /api/v1/warga/:id      — Update warga
DELETE /api/v1/warga/:id      — Delete warga

GET    /api/v1/warga/:id/iuran — Get iuran by warga
POST   /api/v1/iuran/upload    — Upload bukti iuran
PUT    /api/v1/iuran/:id/confirm — Konfirmasi iuran
```

### 5.2 HTTP Status Codes
| Code | Usage |
|------|-------|
| 200 | GET, PUT success |
| 201 | POST created |
| 204 | DELETE success (no content) |
| 400 | Validation error |
| 401 | Unauthorized (invalid token) |
| 403 | Forbidden (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Business logic error |
| 429 | Rate limit |
| 500 | Server error |

### 5.3 Response Format
```typescript
// Success
{ "status": "success", "data": { ... }, "message": "..." }

// Paginated
{ "status": "success", "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }

// Error
{ "status": "error", "message": "...", "errors": [{ "field": "email", "message": "..." }] }
```

---

## 6. Database Conventions

### 6.1 Prisma Schema Naming
```prisma
// Models: PascalCase
model WargaProfile { ... }

// Fields: camelCase
namaLengkap  String  @map("nama_lengkap")

// Tables: snake_case plural
@@map("warga_profiles")

// Enums: PascalCase with UPPER values
enum Role {
  ADMIN
  PENGURUS
  WARGA
}
```

### 6.2 Migration Naming
```bash
npx prisma migrate dev --name add_warga_profile_table
npx prisma migrate dev --name add_iuran_status_field
npx prisma migrate dev --name create_indexes_for_search
```

---

## 7. Git Conventions

### 7.1 Branch Naming
```
main              — Production-ready
develop           — Integration branch
feature/warga-crud — New feature
fix/auth-login-bug — Bug fix
hotfix/security-patch — Urgent fix
docs/update-readme — Documentation
```

### 7.2 Commit Messages (Conventional Commits)
```
feat: add warga CRUD endpoints
fix: resolve auth token expiration issue
docs: update API contract for keuangan
style: format code with prettier
refactor: extract validation logic to middleware
test: add unit tests for warga service
chore: update dependencies
```

### 7.3 Pull Request
- Title: `[Feature] Add warga CRUD` or `[Fix] Resolve login issue`
- Description: What changed, why, how to test
- Link to related issue/task
- Screenshots for UI changes

---

## 8. Code Review Checklist

### 8.1 General
- [ ] Code follows project conventions
- [ ] No `any` types used
- [ ] No console.log in production code
- [ ] No hardcoded values (use constants/env)
- [ ] Error handling implemented
- [ ] Input validation on all user inputs
- [ ] No sensitive data in logs

### 8.2 Backend
- [ ] Routes have proper auth middleware
- [ ] Service layer separated from controllers
- [ ] Prisma queries use select/include
- [ ] Transactions for multi-step operations
- [ ] Proper HTTP status codes
- [ ] Validation with Zod

### 8.3 Frontend
- [ ] Components are reusable
- [ ] Props have TypeScript types
- [ ] Responsive design (mobile-first)
- [ ] Loading & error states handled
- [ ] Accessibility (ARIA, semantic HTML)
- [ ] No inline styles

### 8.4 Database
- [ ] Indexes on frequently queried columns
- [ ] Foreign keys have proper constraints
- [ ] Migrations are reversible
- [ ] No N+1 query problems

---

## 9. ESLint & Prettier

### 9.1 ESLint Config
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 9.2 Prettier Config
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

---

## 10. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-06 | Initial coding standard |
