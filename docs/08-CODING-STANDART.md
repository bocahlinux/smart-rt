# Smart-RT — Coding Standard

**Version:** 1.2.0
**Date:** June 7, 2026
**Status:** Draft

---

## 1. Project Structure

### 1.1 Directory Layout
```
smart-rt/
├── backend/
│   ├── accounts/              # Auth & user management
│   │   ├── models.py          # User, WargaProfile
│   │   ├── serializers.py     # DRF serializers (Admin + Warga variants)
│   │   ├── views.py           # API views (ViewSet)
│   │   ├── urls.py            # URL routing
│   │   ├── permissions.py     # Custom permissions (RBAC + object-level)
│   │   ├── filters.py         # DRF filter backends
│   │   ├── admin.py           # Django admin config
│   │   ├── signals.py         # Django signals (audit log)
│   │   ├── services.py        # Business logic (if complex)
│   │   └── tests/
│   │       ├── test_models.py
│   │       ├── test_views.py
│   │       ├── test_serializers.py
│   │       └── test_permissions.py
│   ├── keuangan/              # Financial management
│   ├── pengumuman/            # Announcements
│   ├── forum/                 # Discussion forum
│   ├── pengaduan/             # Complaints
│   ├── kegiatan/             # Events & activities
│   ├── polling/               # Polling & voting
│   ├── audit/                 # Audit logs
│   ├── notifications/         # Push notifications
│   ├── config/                # Django project config
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── dev.py
│   │   │   └── prod.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── media/                 # Private media storage (NOT in repo)
│   │   ├── bukti-transfer/
│   │   ├── bukti-iuran/
│   │   ├── foto-profil/
│   │   ├── pengumuman/
│   │   └── pengaduan/
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── dev.txt
│   │   └── prod.txt
│   ├── manage.py
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── auth/
│   │   │   ├── warga/
│   │   │   ├── keuangan/
│   │   │   ├── pengumuman/
│   │   │   ├── forum/
│   │   │   ├── pengaduan/
│   │   │   ├── kegiatan/
│   │   │   └── polling/
│   │   ├── hooks/
│   │   ├── stores/             # Zustand stores (NO persist for tokens)
│   │   ├── services/           # API client (axios)
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Helpers + maskers
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
- **Python modules:** `snake_case.py` (models.py, serializers.py, views.py, permissions.py)
- **Django apps:** lowercase (accounts, keuangan)
- **Components:** `PascalCase.tsx` (WargaTable.tsx)
- **Hooks:** `useCamelCase.ts` (useAuth.ts)
- **Stores:** `camelCaseStore.ts` (authStore.ts)
- **Services:** `camelCaseService.ts` (wargaService.ts)
- **Types:** `camelCase.ts` (warga.ts)
- **Utils:** `camelCase.ts` (formatDate.ts, maskData.ts)
- **Constants:** `UPPER_SNAKE_CASE.ts` (API_ENDPOINTS.ts)
- **Tests:** `test_*.py` (backend), `*.test.tsx` (frontend)

---

## 2. Python / Django Conventions

### 2.1 Imports Ordering
```python
# 1. Standard library
import os
from pathlib import Path

# 2. Django / Third party
from django.db import models
from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated

# 3. Local apps
from accounts.models import User, WargaProfile
from accounts.permissions import IsAdmin, IsPengurus, IsOwnerOrPengurus
from accounts.serializers import WargaProfileAdminSerializer, WargaProfileWargaSerializer
```

### 2.2 Naming Conventions
```python
# Variables & functions: snake_case
nama_lengkap = 'Ahmad'
def get_warga_by_id(warga_id): ...
def mask_nik(nik: str) -> str: ...

# Constants: UPPER_SNAKE_CASE
MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
API_BASE_URL = '/api/v1'

# Classes: PascalCase
class WargaProfileViewSet: ...
class IsOwnerOrPengurus: ...

# Models: PascalCase, singular
class WargaProfile(models.Model): ...

# Fields: snake_case
nama_lengkap = models.CharField(max_length=255)

# Boolean: prefix with is/has/can/should
is_active = True
has_voted = False
can_edit = user.role == 'admin'

# Private: prefix with underscore
def _mask_sensitive_data(data: dict) -> dict: ...
class _InternalAuditService: ...
```

### 2.3 Django App Structure (Per App)
```
accounts/
├── models.py          # Django models with TextChoices enums
├── serializers.py     # Separate serializers per role (Admin/Warga)
├── views.py           # ViewSets with permission_classes + get_queryset scoping
├── urls.py            # DRF DefaultRouter
├── permissions.py     # Custom permission classes (RBAC + object-level)
├── filters.py         # DRF filter backends for search/filter
├── admin.py           # Django admin config
├── signals.py         # Django signals for audit log
├── services.py        # Business logic (if complex, else keep in views)
├── validators.py      # Custom field validators
└── tests/
    ├── test_models.py
    ├── test_views.py
    ├── test_serializers.py
    ├── test_permissions.py
    └── test_security.py
```

### 2.4 Model Pattern
```python
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """Extended User model — RESTRICTED (password hash never exposed)"""
    
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        PENGURUS = 'pengurus', 'Pengurus'
        WARGA = 'warga', 'Warga'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACTIVE = 'active', 'Active'
        REJECTED = 'rejected', 'Rejected'
    
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True)  # SENSITIF
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.WARGA)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'phone']
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email'], name='idx_users_email'),
            models.Index(fields=['phone'], name='idx_users_phone'),
            models.Index(fields=['role'], name='idx_users_role'),
        ]
    
    def __str__(self):
        return self.email


class WargaProfile(models.Model):
    """Profil warga — SENSITIF"""
    
    class JenisKelamin(models.TextChoices):
        LAKI = 'L', 'Laki-laki'
        PEREMPUAN = 'P', 'Perempuan'
    
    class Status(models.TextChoices):
        AKTIF = 'aktif', 'Aktif'
        TIDAK_AKTIF = 'tidak_aktif', 'Tidak Aktif'
        PINDAH = 'pindah', 'Pindah'
        MENINGGAL = 'meninggal', 'Meninggal'
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nik = models.CharField(max_length=16, unique=True, null=True, blank=True)  # SENSITIF
    nama_lengkap = models.CharField(max_length=255)
    tempat_lahir = models.CharField(max_length=10, null=True, blank=True)
    tanggal_lahir = models.DateField(null=True, blank=True)  # SENSITIF
    jenis_kelamin = models.CharField(max_length=1, choices=JenisKelamin.choices, null=True, blank=True)
    agama = models.CharField(max_length=50, null=True, blank=True)
    pendidikan = models.CharField(max_length=100, null=True, blank=True)
    pekerjaan = models.CharField(max_length=100, null=True, blank=True)
    no_kk = models.CharField(max_length=16, null=True, blank=True)  # SENSITIF
    alamat = models.TextField(null=True, blank=True)  # SENSITIF
    blok = models.CharField(max_length=10, null=True, blank=True)
    no_rumah = models.CharField(max_length=10, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AKTIF)
    foto = models.FileField(
        upload_to='foto-profil/',
        null=True,
        blank=True,
        validators=[validate_file_extension, validate_file_size]
    )  # SENSITIF
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'warga_profiles'
        # ⚠️ Never use '__all__' in serializer fields for this model
        indexes = [
            models.Index(fields=['nama_lengkap'], name='idx_warga_nama'),
            models.Index(fields=['blok'], name='idx_warga_blok'),
            models.Index(fields=['status'], name='idx_warga_status'),
        ]
    
    def __str__(self):
        return self.nama_lengkap
```

---

## 3. Security Coding Standards (Backend)

### 3.1 DRF Permission Standard

> **RULE:** Setiap ViewSet **WAJIB** punya `permission_classes`. Setiap endpoint yang expose object milik user **WAJIB** punya object-level permission. **DILARANG** hanya mengandalkan filter frontend.

```python
# accounts/permissions.py
from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """Global permission: hanya admin"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsPengurus(permissions.BasePermission):
    """Global permission: admin atau pengurus"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'pengurus']

class IsPengurusOrReadOnly(permissions.BasePermission):
    """Safe methods untuk semua authenticated, write hanya pengurus"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role in ['admin', 'pengurus']

class IsOwnerOrPengurus(permissions.BasePermission):
    """
    Object-level permission: 
    - Admin/pengurus bisa akses semua object
    - Warga hanya bisa akses object miliknya sendiri → cek obj.user == request.user
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['admin', 'pengurus']:
            return True
        return hasattr(obj, 'user') and obj.user == request.user

class IsOwnerOrPengurusForFile(permissions.BasePermission):
    """
    Object-level permission untuk file/bukti transfer:
    - Hanya pemilik, bendahara, pengurus berwenang, admin
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if request.user.role == 'pengurus':
            return True  # Bisa dipersempit ke bendahara saja jika perlu
        # Warga hanya bisa akses file miliknya
        if hasattr(obj, 'warga'):
            return obj.warga.user == request.user
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        return False
```

```python
# accounts/views.py
from rest_framework import viewsets, permissions
from .permissions import IsPengurus, IsOwnerOrPengurus

class WargaProfileViewSet(viewsets.ModelViewSet):
    """Warga ViewSet dengan RBAC + object-level permission"""
    
    # ✅ WAJIB: permission_classes untuk setiap ViewSet
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Permission per action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsPengurus()]
        if self.action == 'verify':
            return [permissions.IsAuthenticated(), IsPengurus()]
        # list, retrieve: semua authenticated, tapi queryset di-scope
        return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        """Serializer berbeda per role"""
        if self.request.user.role in ['admin', 'pengurus']:
            return WargaProfileAdminSerializer
        return WargaProfileWargaSerializer
    
    def get_queryset(self):
        """
        ✅ WAJIB: get_queryset membatasi data berdasarkan role.
        Warga TIDAK BOLEH menerima queryset global.
        """
        user = self.request.user
        
        if user.role in ['admin', 'pengurus']:
            return WargaProfile.objects.select_related('user').all()
        
        # Warga hanya lihat profil sendiri
        return WargaProfile.objects.select_related('user').filter(user=user)
```

### 3.2 Serializer Field Exposure

> **RULE:** Serializer untuk admin/pengurus dan warga **HARUS** dipisah jika field visibility berbeda. **JANGAN** expose `__all__` untuk model yang punya data sensitif.

```python
# accounts/serializers.py
from rest_framework import serializers

class WargaProfileAdminSerializer(serializers.ModelSerializer):
    """Serializer untuk Admin/Pengurus — full field access"""
    
    nik = serializers.CharField(read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    
    class Meta:
        model = WargaProfile
        fields = [
            'id', 'nik', 'nama_lengkap', 'tempat_lahir', 'tanggal_lahir',
            'jenis_kelamin', 'agama', 'status_perkawinan', 'pendidikan', 'pekerjaan',
            'no_kk', 'hubungan_keluarga', 'alamat', 'blok', 'no_rumah',
            'status', 'foto', 'email', 'phone', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WargaProfileWargaSerializer(serializers.ModelSerializer):
    """
    Serializer untuk Warga — hanya field publik + masked sensitive fields.
    ✅ JANGAN pakai '__all__' untuk model sensitif.
    ✅ Explicit field list.
    """
    
    nik_masked = serializers.SerializerMethodField()
    no_kk_masked = serializers.SerializerMethodField()
    
    class Meta:
        model = WargaProfile
        fields = [
            'id', 'nama_lengkap', 'blok', 'no_rumah', 'status', 
            'nik_masked', 'no_kk_masked'
        ]
        read_only_fields = fields  # Semua read-only untuk warga lihat profil sendiri
    
    def get_nik_masked(self, obj):
        if obj.nik:
            return obj.nik[:4] + '********' + obj.nik[-4:]
        return None
    
    def get_no_kk_masked(self, obj):
        if obj.no_kk:
            return obj.no_kk[:4] + '********' + obj.no_kk[-4:]
        return None


class WargaProfileOwnerSerializer(serializers.ModelSerializer):
    """
    Serializer untuk Warga — lihat profil sendiri lengkap (tanpa mask).
    Hanya dipanggil TERPISAH untuk endpoint /warga/me atau object-level check.
    """
    
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    
    class Meta:
        model = WargaProfile
        fields = [
            'id', 'nik', 'nama_lengkap', 'tempat_lahir', 'tanggal_lahir',
            'jenis_kelamin', 'agama', 'status_perkawinan', 'pendidikan', 'pekerjaan',
            'no_kk', 'hubungan_keluarga', 'alamat', 'blok', 'no_rumah',
            'status', 'foto', 'email', 'phone', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'nik', 'no_kk', 'created_at', 'updated_at']
    
    def validate_nik(self, value):
        if value and WargaProfile.objects.filter(nik=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("NIK sudah terdaftar")
        return value
```

### 3.3 Queryset Scoping

> **RULE:** `get_queryset` **WAJIB** membatasi data berdasarkan role user. Warga tidak boleh menerima queryset global untuk warga_profiles, iuran, atau pengaduan.

```python
# ✅ BENAR: Scope per role
def get_queryset(self):
    user = self.request.user
    if user.role == 'admin':
        return Model.objects.all()
    if user.role == 'pengurus':
        return Model.objects.all()  # Bisa ditambah filter per modul
    # Warga: hanya data sendiri
    return Model.objects.filter(user=user)

# ❌ SALAH: Queryset global untuk semua role
def get_queryset(self):
    return Model.objects.all()  # JANGAN!

# ❌ SALAH: Filter di serializer/frontend saja
# Object-level check harus di backend (queryset + permission)
```

### 3.4 File Upload Security

> **RULE:** Gunakan private media storage untuk bukti transfer dan dokumen sensitif. Generate nama file random. Validasi extension, MIME type (magic bytes), dan ukuran. **JANGAN** memakai nama file asli sebagai path final.

```python
# accounts/validators.py
import os
import magic
from django.core.exceptions import ValidationError

ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_file_extension(value):
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(f'Extension {ext} tidak diizinkan. Gunakan: {", ".join(ALLOWED_EXTENSIONS)}')

def validate_file_size(value):
    if value.size > MAX_FILE_SIZE:
        raise ValidationError(f'File terlalu besar ({value.size // 1024}KB). Maksimal {MAX_FILE_SIZE // 1024}KB')

def validate_mime_type(value):
    """Validasi MIME type via magic bytes, bukan cuma extension"""
    file_mime = magic.from_buffer(value.read(1024), mime=True)
    if file_mime not in ALLOWED_MIME_TYPES:
        raise ValidationError(f'MIME type {file_mime} tidak diizinkan')
    value.seek(0)  # Reset file pointer


# accounts/models.py — gunakan UUID untuk nama file
import uuid

def upload_path(instance, filename):
    """Generate random UUID filename, preserve extension only"""
    ext = os.path.splitext(filename)[1].lower()
    return f'{uuid.uuid4().hex}{ext}'

class IuranWarga(models.Model):
    bukti_url = models.FileField(
        upload_to='bukti-iuran/',  # → backend/media/bukti-iuran/{uuid}.jpg
        null=True,
        blank=True,
        validators=[validate_file_extension, validate_file_size, validate_mime_type]
    )
```

```python
# config/settings/base.py — Private media storage
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'

# Production: gunakan django-storages + S3 dengan private bucket
# DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
# AWS_S3_FILE_OVERWRITE = False
# AWS_DEFAULT_ACL = 'private'
# AWS_S3_ENCRYPTION = True
```

```python
# views.py — Protected file access
from django.http import FileResponse, Http404
from django.conf import settings
import os

def serve_private_file(request, file_path):
    """
    Hanya serve file private jika user punya akses.
    Jangan expose media URL langsung.
    """
    # Cek permission
    if not request.user.is_authenticated:
        raise Http404
    
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    
    # Pastikan path tidak traversal
    if not full_path.startswith(settings.MEDIA_ROOT):
        raise Http404
    
    if os.path.exists(full_path):
        return FileResponse(open(full_path, 'rb'))
    raise Http404
```

### 3.5 Audit Log Signal Pattern

```python
# audit/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import json

SENSITIVE_FIELDS = ['nik', 'no_kk', 'phone', 'email', 'alamat', 'password', 'token']

def mask_sensitive_data(data: dict) -> dict:
    """Mask field sensitif di audit log"""
    if not data:
        return data
    masked = {}
    for key, value in data.items():
        if key in SENSITIVE_FIELDS and isinstance(value, str):
            masked[key] = value[:4] + '****' + value[-4:] if len(value) > 8 else '****'
        else:
            masked[key] = value
    return masked

@receiver(post_save, sender=WargaProfile)
def log_warga_change(sender, instance, created, **kwargs):
    from audit.models import AuditLog
    action = 'create' if created else 'update'
    AuditLog.objects.create(
        user=instance.user,
        action=action,
        table_name='warga_profiles',
        record_id=instance.pk,
        old_data=mask_sensitive_data(getattr(instance, '_old_data', None)),
        new_data=mask_sensitive_data({
            'nik': instance.nik,
            'nama_lengkap': instance.nama_lengkap,
            # ... hanya field yang berubah
        })
    )
```

### 3.6 Settings Security

```python
# config/settings/prod.py

# Password hashing — Argon2 default
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
]

# SimpleJWT configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Security middleware
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
# SECURE_SSL_REDIRECT = True  # Enable di production
# SECURE_HSTS_SECONDS = 31536000  # Enable di production

# CORS — whitelist only
CORS_ALLOWED_ORIGINS = [
    'https://smartrt.yourdomain.com',
]
CORS_ALLOW_CREDENTIALS = True  # Untuk httpOnly cookie

# Rate throttle
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/min',
        'user': '100/min',
        'login': '10/5min',  # Custom throttle untuk login
    }
}
```

---

## 4. Frontend Conventions

### 4.1 TypeScript Strict Mode
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

### 4.2 Zustand Store — Token Storage (NO persist)

> **⚠️ TOKEN STORAGE POLICY:**
> - Access token disimpan di Zustand state (in-memory only).
> - **DILARANG** menggunakan `persist` middleware atau `localStorage` untuk token.
> - Refresh token disimpan di httpOnly cookie (auto-sent by browser, tidak bisa diakses JS).
> - Saat page refresh, Zustand state hilang → gunakan refresh token (httpOnly cookie) untuk dapat access token baru.
> - Jika refresh token expired → redirect ke login.

```typescript
// stores/authStore.ts
import { create } from 'zustand';
// ❌ JANGAN: import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null;
  accessToken: string | null;  // In-memory only, hilang saat refresh
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  // ❌ JANGAN: persist(...) — token tidak boleh disimpan di localStorage
  (set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
    logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    setAccessToken: (accessToken) => set({ accessToken }),
    setUser: (user) => set({ user }),
  })
);
```

### 4.3 Axios Interceptor — Refresh Token Flow

```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,  // Untuk httpOnly cookie (refresh token)
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 with refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Refresh token otomatis dari httpOnly cookie
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );
        
        const newAccessToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newAccessToken);
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        failedQueue.forEach(({ resolve }) => resolve(newAccessToken));
        failedQueue = [];
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token expired → logout
        useAuthStore.getState().logout();
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 4.4 Component Structure
```tsx
// components/warga/WargaTable.tsx
import { useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useWargaList } from '../../hooks/useWarga';
import { Button } from '../common/Button';
import type { WargaProfile } from '../../types/warga';

interface WargaTableProps {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WargaTable({ onEdit, onDelete }: WargaTableProps) {
  const { user } = useAuthStore();
  const { data, isLoading } = useWargaList();
  const isPengurus = user?.role === 'admin' || user?.role === 'pengurus';
  
  if (isLoading) return <SkeletonTable />;
  
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Nama</th>
          <th>Blok</th>
          {isPengurus && <th>NIK</th>}
          {isPengurus && <th>No. HP</th>}
          <th>Status</th>
          {isPengurus && <th>Aksi</th>}
        </tr>
      </thead>
      <tbody>
        {data?.map((warga) => (
          <tr key={warga.id}>
            <td>{warga.namaLengkap}</td>
            <td>{warga.blok}</td>
            {/* ✅ Field visibility di frontend sesuai role */}
            {isPengurus && <td>{warga.nik}</td>}
            {isPengurus && <td>{warga.phone || warga.phoneMasked}</td>}
            <td><StatusBadge status={warga.status} /></td>
            {isPengurus && (
              <td>
                <Button onClick={() => onEdit(warga.id)}>Edit</Button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 4.5 Tailwind CSS Conventions
```tsx
// ✅ GOOD: Utility classes
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors">
  Simpan
</button>

// ❌ BAD: Inline styles
<button style={{ backgroundColor: '#1E40AF' }}>Simpan</button>

// ✅ Mobile-first responsive
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/3">Sidebar</div>
  <div className="w-full md:w-2/3">Content</div>
</div>
```

---

## 5. API Conventions

### 5.1 RESTful Naming
```
GET    /api/v1/warga              — List warga (scoped by role)
GET    /api/v1/warga/:id          — Get warga detail (object-level)
POST   /api/v1/warga              — Create warga (pengurus+)
PUT    /api/v1/warga/:id          — Update warga (object-level)
DELETE /api/v1/warga/:id          — Delete warga (admin only)
GET    /api/v1/auth/login         — Login (public)
POST   /api/v1/auth/token/refresh — Refresh access token (httpOnly cookie)
POST   /api/v1/auth/logout        — Logout (blacklist refresh token)
```

### 5.2 HTTP Status Codes
| Code | Usage |
|------|-------|
| 200 | GET, PUT success |
| 201 | POST created |
| 400 | Validation error |
| 401 | Unauthorized — invalid/expired token |
| 403 | Forbidden — insufficient role or object-level |
| 404 | Resource not found |
| 409 | Conflict — duplicate data |
| 413 | Payload too large — file upload oversized |
| 415 | Unsupported media type — invalid MIME |
| 429 | Rate limit |
| 500 | Server error |

### 5.3 Response Format
```json
// Success
{ "status": "success", "data": { ... }, "message": "..." }

// Paginated
{ "status": "success", "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }

// Error
{ "status": "error", "message": "...", "errors": [{ "field": "email", "message": "..." }] }
```

---

## 6. Database Conventions

### 6.1 Django ORM Naming
```python
# Models: PascalCase, singular
class WargaProfile(models.Model): ...

# Fields: snake_case
nama_lengkap = models.CharField(max_length=255)

# Tables: snake_case (auto-generated by Django: app_modelname)
class Meta:
    db_table = 'warga_profiles'

# Enums: TextChoices
class Role(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    PENGURUS = 'pengurus', 'Pengurus'
    WARGA = 'warga', 'Warga'

# Foreign keys: {table}_id
user = models.ForeignKey(User, on_delete=models.CASCADE)
```

### 6.2 Migration Naming
```bash
python manage.py makemigrations --name add_warga_profile_table
python manage.py makemigrations --name add_iuran_status_field
python manage.py migrate
```

### 6.3 Never Do
```python
# ❌ JANGAN: __all__ untuk model sensitif
fields = '__all__'

# ❌ JANGAN: Queryset global tanpa scope
def get_queryset(self):
    return Model.objects.all()

# ❌ JANGAN: Simpan token/password di log
logger.info(f"User login: {user.email}, token={token}")

# ❌ JANGAN: Hardcode secret
SECRET_KEY = 'my-secret-key-123'

# ❌ JANGAN: Gunakan nama file asli
# Gunakan UUID untuk filename uploaded
```

---

## 7. Git Conventions

### 7.1 Branch Naming
```
main                    — Production-ready
develop                 — Integration branch
feature/warga-crud      — New feature
fix/auth-login-bug      — Bug fix
hotfix/security-patch   — Urgent security fix
docs/update-readme      — Documentation
```

### 7.2 Commit Messages (Conventional Commits)
```
feat: add warga CRUD endpoints with object-level permission
fix: resolve auth token refresh race condition
docs: update API contract for keuangan
refactor: extract validation logic to serializer
test: add security tests for IDOR prevention
chore: update Django to 5.1.2
security: add login rate limit and password hasher config
```

### 7.3 Secrets Policy
```bash
# ❌ JANGAN: Commit file yang berisi secret
# .env
# requirements/prod.txt (jika berisi private package URLs)
# *.pem, *.key

# ✅ SELALU: Gunakan .gitignore
.env
*.pem
*.key
media/
```

---

## 8. Code Review Checklist

### 8.1 General
- [ ] Code follows project conventions
- [ ] No `any` types used (TypeScript)
- [ ] No `print()` or `console.log` in production code (Python)
- [ ] No hardcoded values (use constants/env)
- [ ] Error handling implemented
- [ ] Input validation on all user inputs
- [ ] No sensitive data in logs (password, token, NIK mentah)
- [ ] No secret/credential in source code

### 8.2 Backend (Django)
- [ ] ViewSet punya `permission_classes`
- [ ] `get_queryset` membatasi data berdasarkan role (queryset scoping)
- [ ] Serializer tidak menggunakan `__all__` untuk model sensitif
- [ ] Serializer berbeda per role jika field visibility berbeda
- [ ] Object-level permission untuk endpoint dengan `:id`
- [ ] File upload: validasi MIME (magic bytes), extension, size
- [ ] File upload: UUID filename, bukan original filename
- [ ] Media file private, bukan public URL
- [ ] Audit log untuk operasi sensitif (CRUD data warga, export, confirm)
- [ ] Password hashed dengan Argon2 (Django default)
- [ ] SECRET_KEY dari environment variable

### 8.3 Frontend (React)
- [ ] Token disimpan di Zustand state (in-memory), **TIDAK** di localStorage
- [ ] Axios interceptor handle 401 → refresh token → retry
- [ ] Jika refresh token expired → redirect ke login
- [ ] Field visibility di UI sesuai role (tapi backend tetap enforce)
- [ ] Components are reusable
- [ ] Props have TypeScript types
- [ ] Responsive design (mobile-first)
- [ ] Loading & error states handled
- [ ] Accessibility (ARIA, semantic HTML)
- [ ] No inline styles

### 8.4 Database
- [ ] Indexes on frequently queried columns
- [ ] Foreign keys have proper constraints (on_delete)
- [ ] Migrations are reversible
- [ ] No N+1 query problems (use select_related/prefetch_related)
- [ ] Data classification documented per field
- [ ] Backup encrypted (GPG AES256)

### 8.5 Security
- [ ] No IDOR vulnerability (change UUID → 403)
- [ ] RBAC enforced di backend, bukan cuma frontend
- [ ] Rate limit configured untuk login dan API
- [ ] CORS whitelist configured
- [ ] Security headers (HSTS, X-Frame-Options, etc.)
- [ ] CSRF protection enabled

---

## 9. Linting & Formatting

### 9.1 Python — Ruff + Black
```toml
# pyproject.toml
[tool.ruff]
line-length = 100
select = ["E", "F", "I", "N", "W", "UP", "S"]  # S = bandit security rules

[tool.ruff.per-file-ignores]
"*/migrations/*" = ["E501"]

[tool.black]
line-length = 100
target-version = ["py312"]

[tool.bandit]
exclude_dirs = ["tests"]
skips = ["B101"]  # Skip assert warning in non-test files
```

```bash
# Run linter
ruff check .
ruff format .

# Run security linter
bandit -r backend/
```

### 9.2 TypeScript — ESLint + Prettier
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
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

---

## 10. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-06 | Initial coding standard |
| 1.1.0 | 2026-06-07 | Migrated backend from Express to Django patterns |
| 1.2.0 | 2026-06-07 | Major security rewrite: DRF permission standard (RBAC + object-level), serializer field exposure rules, queryset scoping, file upload security, audit log masking, settings security, frontend token storage (no persist), axios refresh token interceptor, secrets policy, code review checklist. Removed all Express/TypeScript/Prisma/Zod references. Updated section numbering. |
