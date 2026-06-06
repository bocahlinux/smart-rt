# Smart-RT — Database Design Document

**Version:** 1.0.0
**Date:** June 6, 2026
**Database:** PostgreSQL 16
**ORM:** Prisma
**Status:** Draft

---

## 1. Database Overview

### 1.1 Why PostgreSQL
- **ACID compliant** — Transaksi keuangan butuh konsistensi data
- **JSON support** — Fleksibel untuk metadata & opsi polling
- **Full-text search** — Pencarian warga tanpa dependency eksternal
- **Free & open source** — Cocok untuk komunitas
- **Prisma support** — First-class support di Prisma ORM

### 1.2 Database Configuration
```env
DATABASE_URL="postgresql://smartrt:***@localhost:5432/smartrt?schema=public"
```

### 1.3 Naming Conventions
- Table names: `snake_case`, plural (e.g., `warga_profiles`)
- Column names: `snake_case` (e.g., `nama_lengkap`)
- Primary key: `id` (UUID)
- Foreign keys: `{table}_id` (e.g., `user_id`)
- Timestamps: `created_at`, `updated_at`
- Indexes: `idx_{table}_{column}`

---

## 2. Entity Relationship Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email UK
        varchar phone UK
        varchar password_hash
        enum role
        enum status
        timestamp created_at
        timestamp updated_at
    }
    warga_profiles {
        uuid id PK
        uuid user_id FK
        varchar nik UK
        varchar nama_lengkap
        varchar tempat_lahir
        date tanggal_lahir
        enum jenis_kelamin
        varchar agama
        enum status_perkawinan
        varchar pendidikan
        varchar pekerjaan
        varchar no_kk
        varchar hubungan_keluarga
        text alamat
        varchar blok
        varchar no_rumah
        enum status
        varchar foto
        timestamp created_at
        timestamp updated_at
    }
    kategori_transaksi {
        uuid id PK
        varchar nama
        enum tipe
        timestamp created_at
    }
    transaksi {
        uuid id PK
        uuid kategori_id FK
        decimal jumlah
        text keterangan
        date tanggal
        enum tipe
        enum status
        varchar bukti_url
        uuid created_by FK
        uuid confirmed_by FK
        timestamp created_at
        timestamp updated_at
    }
    iuran_warga {
        uuid id PK
        uuid warga_id FK
        int bulan
        int tahun
        decimal jumlah
        enum status
        varchar bukti_url
        uuid confirmed_by FK
        timestamp created_at
        timestamp updated_at
    }
    pengumuman {
        uuid id PK
        varchar judul
        text isi
        enum kategori
        varchar gambar
        timestamp scheduled_at
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    threads {
        uuid id PK
        varchar judul
        enum kategori
        enum status
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    comments {
        uuid id PK
        uuid thread_id FK
        uuid parent_id FK
        text isi
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    pengaduan {
        uuid id PK
        varchar judul
        text deskripsi
        enum kategori
        enum status
        varchar foto
        uuid warga_id FK
        uuid assigned_to FK
        timestamp created_at
        timestamp updated_at
    }
    kegiatan {
        uuid id PK
        varchar nama
        text deskripsi
        timestamp tanggal
        varchar lokasi
        uuid penanggung_jawab FK
        timestamp created_at
        timestamp updated_at
    }
    rsvp {
        uuid id PK
        uuid kegiatan_id FK
        uuid user_id FK
        enum status
        timestamp created_at
    }
    polls {
        uuid id PK
        varchar pertanyaan
        json opsi
        timestamp deadline
        uuid created_by FK
        timestamp created_at
    }
    votes {
        uuid id PK
        uuid poll_id FK
        uuid user_id FK
        int opsi_index
        timestamp created_at
    }
    audit_logs {
        uuid id PK
        uuid user_id FK
        varchar action
        varchar table_name
        uuid record_id
        json old_data
        json new_data
        timestamp created_at
    }
    notifications {
        uuid id PK
        uuid user_id FK
        varchar judul
        text isi
        enum tipe
        boolean is_read
        timestamp created_at
    }

    users ||--o| warga_profiles : "has one"
    users ||--o{ transaksi : "creates"
    users ||--o{ pengumuman : "creates"
    users ||--o{ threads : "creates"
    users ||--o{ comments : "writes"
    users ||--o{ pengaduan : "files"
    users ||--o{ votes : "casts"
    users ||--o{ rsvp : "joins"
    users ||--o{ audit_logs : "performs"
    users ||--o{ notifications : "receives"
    warga_profiles ||--o{ iuran_warga : "has"
    kategori_transaksi ||--o{ transaksi : "categorizes"
    threads ||--o{ comments : "contains"
    comments ||--o{ comments : "replies to"
    kegiatan ||--o{ rsvp : "has"
    polls ||--o{ votes : "receives"
```

---

## 3. Table Specifications

### 3.1 users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email login |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | No. HP login |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed |
| role | ENUM | NOT NULL, DEFAULT 'warga' | admin/pengurus/warga |
| status | ENUM | NOT NULL, DEFAULT 'pending' | pending/active/rejected |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | AUTO UPDATE | |

**Indexes:**
- `idx_users_email` ON (email)
- `idx_users_phone` ON (phone)
- `idx_users_role` ON (role)
- `idx_users_status` ON (status)

### 3.2 warga_profiles
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, UNIQUE | 1:1 dengan user |
| nik | VARCHAR(16) | UNIQUE | Nomor KTP |
| nama_lengkap | VARCHAR(255) | NOT NULL | |
| tempat_lahir | VARCHAR(100) | | |
| tanggal_lahir | DATE | | |
| jenis_kelamin | ENUM | | L/P |
| agama | VARCHAR(50) | | |
| status_perkawinan | ENUM | | belum_kawin/kawin/cerai_hidup/cerai_mati |
| pendidikan | VARCHAR(100) | | |
| pekerjaan | VARCHAR(100) | | |
| no_kk | VARCHAR(16) | | Nomor KK |
| hubungan_keluarga | VARCHAR(50) | | kepala_keluarga/istri/anak/dll |
| alamat | TEXT | | Alamat lengkap |
| blok | VARCHAR(10) | | Blok rumah |
| no_rumah | VARCHAR(10) | | Nomor rumah |
| status | ENUM | DEFAULT 'aktif' | aktif/tidak_aktif/pindah/meninggal |
| foto | VARCHAR(500) | | URL foto profil |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | AUTO UPDATE | |

**Indexes:**
- `idx_warga_nik` ON (nik)
- `idx_warga_nama` ON (nama_lengkap)
- `idx_warga_blok` ON (blok)
- `idx_warga_status` ON (status)
- `idx_warga_no_kk` ON (no_kk)

### 3.3 kategori_transaksi
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| nama | VARCHAR(100) | NOT NULL, UNIQUE | e.g., "Iuran Bulanan" |
| tipe | ENUM | NOT NULL | pemasukan/pengeluaran |
| created_at | TIMESTAMP | DEFAULT now() | |

### 3.4 transaksi
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kategori_id | UUID | FK → kategori_transaksi.id | |
| jumlah | DECIMAL(12,2) | NOT NULL | Nominal |
| keterangan | TEXT | | |
| tanggal | DATE | NOT NULL | Tanggal transaksi |
| tipe | ENUM | NOT NULL | pemasukan/pengeluaran |
| status | ENUM | DEFAULT 'confirmed' | pending/confirmed/rejected |
| bukti_url | VARCHAR(500) | | URL bukti |
| created_by | UUID | FK → users.id | |
| confirmed_by | UUID | FK → users.id | |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | AUTO UPDATE | |

**Indexes:**
- `idx_transaksi_tanggal` ON (tanggal)
- `idx_transaksi_kategori` ON (kategori_id)
- `idx_transaksi_tipe` ON (tipe)
- `idx_transaksi_status` ON (status)

### 3.5 iuran_warga
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| warga_id | UUID | FK → warga_profiles.id | |
| bulan | INT | NOT NULL | 1-12 |
| tahun | INT | NOT NULL | e.g., 2026 |
| jumlah | DECIMAL(12,2) | NOT NULL | |
| status | ENUM | DEFAULT 'belum' | lunas/belum |
| bukti_url | VARCHAR(500) | | URL bukti transfer |
| confirmed_by | UUID | FK → users.id | |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | AUTO UPDATE | |

**Indexes:**
- `idx_iuran_warga` ON (warga_id)
- `idx_iuran_bulan_tahun` ON (bulan, tahun)
- `idx_iuran_status` ON (status)
- `idx_iuran_warga_bulan_tahun` ON (warga_id, bulan, tahun) UNIQUE

### 3.6 pengumuman
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| judul | VARCHAR(255) | NOT NULL | |
| isi | TEXT | NOT NULL | |
| kategori | ENUM | DEFAULT 'biasa' | penting/biasa/acara |
| gambar | VARCHAR(500) | | URL gambar |
| scheduled_at | TIMESTAMP | | NULL = langsung publish |
| created_by | UUID | FK → users.id | |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | AUTO UPDATE | |

**Indexes:**
- `idx_pengumuman_kategori` ON (kategori)
- `idx_pengumuman_created` ON (created_at DESC)

### 3.7 threads
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| judul | VARCHAR(255) | NOT NULL | |
| kategori | ENUM | DEFAULT 'lainnya' | keamanan/kebersihan/acara/usul/lainnya |
| status | ENUM | DEFAULT 'active' | active/pinned/locked |
| created_by | UUID | FK → users.id | |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | AUTO UPDATE | |

**Indexes:**
- `idx_threads_kategori` ON (kategori)
- `idx_threads_status` ON (status)
- `idx_threads_created` ON (created_at DESC)

### 3.8 comments
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| thread_id | UUID | FK → threads.id | |
| parent_id | UUID | FK → comments.id, NULLABLE | Self-ref untuk reply |
| isi | TEXT | NOT NULL | |
| created_by | UUID | FK → users.id | |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | AUTO UPDATE | |

**Indexes:**
- `idx_comments_thread` ON (thread_id)
- `idx_comments_parent` ON (parent_id)

### 3.9 pengaduan
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| judul | VARCHAR(255) | NOT NULL | |
| deskripsi | TEXT | NOT NULL | |
| kategori | ENUM | DEFAULT 'lainnya' | keamanan/kebersihan/infrastruktur/lainnya |
| status | ENUM | DEFAULT 'diterima' | diterima/diproses/selesai/ditolak |
| foto | VARCHAR(500) | | URL foto |
| warga_id | UUID | FK → users.id | Pelapor |
| assigned_to | UUID | FK → users.id, NULLABLE | Ditugaskan ke |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | AUTO UPDATE | |

**Indexes:**
- `idx_pengaduan_status` ON (status)
- `idx_pengaduan_warga` ON (warga_id)
- `idx_pengaduan_kategori` ON (kategori)

### 3.10 kegiatan
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| nama | VARCHAR(255) | NOT NULL | |
| deskripsi | TEXT | | |
| tanggal | TIMESTAMP | NOT NULL | |
| lokasi | VARCHAR(255) | | |
| penanggung_jawab | UUID | FK → users.id | |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | AUTO UPDATE | |

**Indexes:**
- `idx_kegiatan_tanggal` ON (tanggal)

### 3.11 rsvp
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| kegiatan_id | UUID | FK → kegiatan.id | |
| user_id | UUID | FK → users.id | |
| status | ENUM | DEFAULT 'hadir' | hadir/tidak_hadir/masih_ragu |
| created_at | TIMESTAMP | DEFAULT now() | |

**Indexes:**
- `idx_rsvp_kegiatan` ON (kegiatan_id)
- `idx_rsvp_user` ON (user_id)
- `idx_rsvp_kegiatan_user` ON (kegiatan_id, user_id) UNIQUE

### 3.12 polls
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| pertanyaan | VARCHAR(500) | NOT NULL | |
| opsi | JSON | NOT NULL | ["Opsi A", "Opsi B"] |
| deadline | TIMESTAMP | NOT NULL | |
| created_by | UUID | FK → users.id | |
| created_at | TIMESTAMP | DEFAULT now() | |

### 3.13 votes
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| poll_id | UUID | FK → polls.id | |
| user_id | UUID | FK → users.id | |
| opsi_index | INT | NOT NULL | Index opsi yang dipilih |
| created_at | TIMESTAMP | DEFAULT now() | |

**Indexes:**
- `idx_votes_poll` ON (poll_id)
- `idx_votes_poll_user` ON (poll_id, user_id) UNIQUE

### 3.14 audit_logs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| action | VARCHAR(50) | NOT NULL | create/update/delete/verify |
| table_name | VARCHAR(50) | NOT NULL | |
| record_id | UUID | NOT NULL | |
| old_data | JSON | NULLABLE | Data sebelum perubahan |
| new_data | JSON | NULLABLE | Data setelah perubahan |
| created_at | TIMESTAMP | DEFAULT now() | |

**Indexes:**
- `idx_audit_user` ON (user_id)
- `idx_audit_table` ON (table_name)
- `idx_audit_record` ON (record_id)
- `idx_audit_created` ON (created_at DESC)

### 3.15 notifications
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| judul | VARCHAR(255) | NOT NULL | |
| isi | TEXT | | |
| tipe | ENUM | DEFAULT 'info' | info/penting/success/warning |
| is_read | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMP | DEFAULT now() | |

**Indexes:**
- `idx_notif_user` ON (user_id)
- `idx_notif_read` ON (is_read)
- `idx_notif_created` ON (created_at DESC)

---

## 4. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  PENGURUS
  WARGA
}

enum UserStatus {
  PENDING
  ACTIVE
  REJECTED
}

enum JenisKelamin {
  L
  P
}

enum StatusPerkawinan {
  BELUM_KAWIN
  KAWIN
  CERAI_HIDUP
  CERAI_MATI
}

enum WargaStatus {
  AKTIF
  TIDAK_AKTIF
  PINDAH
  MENINGGAL
}

enum TransaksiTipe {
  PEMASUKAN
  PENGELUARAN
}

enum TransaksiStatus {
  PENDING
  CONFIRMED
  REJECTED
}

enum IuranStatus {
  BELUM
  LUNAS
}

enum PengumumanKategori {
  PENTING
  BIASA
  ACARA
}

enum ThreadKategori {
  KEAMANAN
  KEBERSIHAN
  ACARA
  USUL
  LAINNYA
}

enum ThreadStatus {
  ACTIVE
  PINNED
  LOCKED
}

enum PengaduanKategori {
  KEAMANAN
  KEBERSIHAN
  INFRASTRUKTUR
  LAINNYA
}

enum PengaduanStatus {
  DITERIMA
  DIPROSES
  SELESAI
  DITOLAK
}

enum RSVPStatus {
  HADIR
  TIDAK_HADIR
  MASIH_RAGU
}

enum NotifTipe {
  INFO
  PENTING
  SUCCESS
  WARNING
}

model User {
  id            String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String       @unique @db.VarChar(255)
  phone         String       @unique @db.VarChar(20)
  passwordHash  String       @map("password_hash") @db.VarChar(255)
  role          Role         @default(WARGA)
  status        UserStatus   @default(PENDING)
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")

  profile       WargaProfile?
  transaksi     Transaksi[]    @relation("TransaksiCreatedBy")
  transaksiConfirmed Transaksi[] @relation("TransaksiConfirmedBy")
  iuranConfirmed IuranWarga[]  @relation("IuranConfirmedBy")
  pengumuman    Pengumuman[]
  threads       Thread[]
  comments      Comment[]
  pengaduan     Pengaduan[]    @relation("PengaduanWarga")
  assignedPengaduan Pengaduan[] @relation("PengaduanAssigned")
  rsvp          RSVP[]
  polls         Poll[]
  votes         Vote[]
  auditLogs     AuditLog[]
  notifications Notification[]
  kegiatan      Kegiatan[]

  @@map("users")
}

model WargaProfile {
  id                String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId            String           @unique @map("user_id") @db.Uuid
  nik               String?          @unique @db.VarChar(16)
  namaLengkap       String           @map("nama_lengkap") @db.VarChar(255)
  tempatLahir       String?          @map("tempat_lahir") @db.VarChar(100)
  tanggalLahir      DateTime?        @map("tanggal_lahir") @db.Date
  jenisKelamin      JenisKelamin?    @map("jenis_kelamin")
  agama             String?          @db.VarChar(50)
  statusPerkawinan  StatusPerkawinan? @map("status_perkawinan")
  pendidikan        String?          @db.VarChar(100)
  pekerjaan         String?          @db.VarChar(100)
  noKk              String?          @map("no_kk") @db.VarChar(16)
  hubunganKeluarga  String?          @map("hubungan_keluarga") @db.VarChar(50)
  alamat            String?          @db.Text
  blok              String?          @db.VarChar(10)
  noRumah           String?          @map("no_rumah") @db.VarChar(10)
  status            WargaStatus      @default(AKTIF)
  foto              String?          @db.VarChar(500)
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")

  user              User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  iuran             IuranWarga[]

  @@index([namaLengkap])
  @@index([blok])
  @@index([status])
  @@map("warga_profiles")
}

model KategoriTransaksi {
  id        String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nama      String      @unique @db.VarChar(100)
  tipe      TransaksiTipe
  createdAt DateTime    @default(now()) @map("created_at")

  transaksi Transaksi[]

  @@map("kategori_transaksi")
}

model Transaksi {
  id            String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  kategoriId    String          @map("kategori_id") @db.Uuid
  jumlah        Decimal         @db.Decimal(12, 2)
  keterangan    String?         @db.Text
  tanggal       DateTime        @db.Date
  tipe          TransaksiTipe
  status        TransaksiStatus @default(CONFIRMED)
  buktiUrl      String?         @map("bukti_url") @db.VarChar(500)
  createdBy     String          @map("created_by") @db.Uuid
  confirmedBy   String?         @map("confirmed_by") @db.Uuid
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")

  kategori      KategoriTransaksi @relation(fields: [kategoriId], references: [id])
  creator       User              @relation("TransaksiCreatedBy", fields: [createdBy], references: [id])
  confirmer     User?             @relation("TransaksiConfirmedBy", fields: [confirmedBy], references: [id])

  @@index([tanggal])
  @@index([tipe])
  @@index([status])
  @@map("transaksi")
}

model IuranWarga {
  id            String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  wargaId       String       @map("warga_id") @db.Uuid
  bulan         Int
  tahun         Int
  jumlah        Decimal      @db.Decimal(12, 2)
  status        IuranStatus  @default(BELUM)
  buktiUrl      String?      @map("bukti_url") @db.VarChar(500)
  confirmedBy   String?      @map("confirmed_by") @db.Uuid
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")

  warga         WargaProfile @relation(fields: [wargaId], references: [id], onDelete: Cascade)
  confirmer     User?        @relation("IuranConfirmedBy", fields: [confirmedBy], references: [id])

  @@unique([wargaId, bulan, tahun])
  @@index([bulan, tahun])
  @@index([status])
  @@map("iuran_warga")
}

model Pengumuman {
  id          String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  judul       String              @db.VarChar(255)
  isi         String              @db.Text
  kategori    PengumumanKategori  @default(BIASA)
  gambar      String?             @db.VarChar(500)
  scheduledAt DateTime?           @map("scheduled_at")
  createdBy   String              @map("created_by") @db.Uuid
  createdAt   DateTime            @default(now()) @map("created_at")
  updatedAt   DateTime            @updatedAt @map("updated_at")

  creator     User                @relation(fields: [createdBy], references: [id])

  @@index([kategori])
  @@index([createdAt(sort: Desc)])
  @@map("pengumuman")
}

model Thread {
  id          String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  judul       String          @db.VarChar(255)
  kategori    ThreadKategori  @default(LAINNYA)
  status      ThreadStatus    @default(ACTIVE)
  createdBy   String          @map("created_by") @db.Uuid
  createdAt   DateTime        @default(now()) @map("created_at")
  updatedAt   DateTime        @updatedAt @map("updated_at")

  creator     User            @relation(fields: [createdBy], references: [id])
  comments    Comment[]

  @@index([kategori])
  @@index([createdAt(sort: Desc)])
  @@map("threads")
}

model Comment {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  threadId  String    @map("thread_id") @db.Uuid
  parentId  String?   @map("parent_id") @db.Uuid
  isi       String    @db.Text
  createdBy String    @map("created_by") @db.Uuid
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  thread    Thread    @relation(fields: [threadId], references: [id], onDelete: Cascade)
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
  creator   User      @relation(fields: [createdBy], references: [id])

  @@index([threadId])
  @@map("comments")
}

model Pengaduan {
  id          String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  judul       String            @db.VarChar(255)
  deskripsi   String            @db.Text
  kategori    PengaduanKategori @default(LAINNYA)
  status      PengaduanStatus   @default(DITERIMA)
  foto        String?           @db.VarChar(500)
  wargaId     String            @map("warga_id") @db.Uuid
  assignedTo  String?           @map("assigned_to") @db.Uuid
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")

  warga       User              @relation("PengaduanWarga", fields: [wargaId], references: [id])
  assignee    User?             @relation("PengaduanAssigned", fields: [assignedTo], references: [id])

  @@index([status])
  @@index([wargaId])
  @@map("pengaduan")
}

model Kegiatan {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nama              String    @db.VarChar(255)
  deskripsi         String?   @db.Text
  tanggal           DateTime
  lokasi            String?   @db.VarChar(255)
  penanggungJawab   String?   @map("penanggung_jawab") @db.Uuid
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  penanggung        User?     @relation(fields: [penanggungJawab], references: [id])
  rsvp              RSVP[]

  @@index([tanggal])
  @@map("kegiatan")
}

model RSVP {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  kegiatanId  String      @map("kegiatan_id") @db.Uuid
  userId      String      @map("user_id") @db.Uuid
  status      RSVPStatus  @default(HADIR)
  createdAt   DateTime    @default(now()) @map("created_at")

  kegiatan    Kegiatan    @relation(fields: [kegiatanId], references: [id], onDelete: Cascade)
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([kegiatanId, userId])
  @@map("rsvp")
}

model Poll {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  pertanyaan  String    @db.VarChar(500)
  opsi        Json
  deadline    DateTime
  createdBy   String    @map("created_by") @db.Uuid
  createdAt   DateTime  @default(now()) @map("created_at")

  creator     User      @relation(fields: [createdBy], references: [id])
  votes       Vote[]

  @@map("polls")
}

model Vote {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  pollId      String    @map("poll_id") @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  opsiIndex   Int       @map("opsi_index")
  createdAt   DateTime  @default(now()) @map("created_at")

  poll        Poll      @relation(fields: [pollId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([pollId, userId])
  @@map("votes")
}

model AuditLog {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  action      String    @db.VarChar(50)
  tableName   String    @map("table_name") @db.VarChar(50)
  recordId    String    @map("record_id") @db.Uuid
  oldData     Json?     @map("old_data")
  newData     Json?     @map("new_data")
  createdAt   DateTime  @default(now()) @map("created_at")

  user        User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([tableName])
  @@index([createdAt(sort: Desc)])
  @@map("audit_logs")
}

model Notification {
  id        String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String      @map("user_id") @db.Uuid
  judul     String      @db.VarChar(255)
  isi       String?     @db.Text
  tipe      NotifTipe   @default(INFO)
  isRead    Boolean     @default(false) @map("is_read")
  createdAt DateTime    @default(now()) @map("created_at")

  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([createdAt(sort: Desc)])
  @@map("notifications")
}
```

---

## 5. Migration Strategy

### 5.1 Initial Migration
```bash
# Generate initial schema
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### 5.2 Migration Naming Convention
```
prisma/migrations/
├── 20260606000000_init/
├── 20260606000001_add_audit_logs/
├── 20260606000002_add_notifications/
└── ...
```

### 5.3 Migration Workflow
```bash
# After schema change
npx prisma migrate dev --name descriptive_name

# Production deploy
npx prisma migrate deploy

# Reset dev database
npx prisma migrate reset
```

---

## 6. Seed Data

```prisma
// prisma/seed.ts

// 1. Admin user
// email: admin@smart-rt.local
// password: admin123

// 2. Kategori transaksi default
// Pemasukan: Iuran Bulanan, Sumbangan, Kas
// Pengeluaran: Kebersihan, Listrik, Perbaian, Acara

// 3. Sample warga (5 records)

// 4. Sample transaksi (10 records)
```

---

## 7. Backup & Recovery

### 7.1 Automated Backup (Daily)
```bash
# Cron job:每天 jam 2 pagi
0 2 * * * pg_dump -U smartrt smartrt | gzip > /backup/smartrt_$(date +\%Y\%m\%d).sql.gz
```

### 7.2 Retention Policy
- Daily backup: simpan 30 hari
- Weekly backup: simpan 12 minggu
- Monthly backup: simpan 12 bulan

### 7.3 Recovery
```bash
# Restore from backup
gunzip < backup/smartrt_20260606.sql.gz | psql -U smartrt smartrt
```

### 7.4 Prisma Backup
```bash
# Export data
npx prisma db seed

# Verify integrity
npx prisma migrate status
```

---

## 8. Performance Considerations

### 8.1 Indexing Strategy
- **Primary keys**: UUID dengan default `gen_random_uuid()`
- **Foreign keys**: Semua FK di-index untuk JOIN performance
- **Search fields**: `nama_lengkap`, `email`, `phone`, `nik`
- **Filter fields**: `status`, `role`, `kategori`, `tipe`
- **Sort fields**: `created_at` DESC untuk list queries
- **Composite indexes**: Unique constraint untuk mencegah duplikat

### 8.2 Query Optimization
- Gunakan `select` untuk ambil hanya kolom yang perlu
- Gunakan `include` dengan bijak untuk relasi
- Pagination dengan `skip` + `limit` atau cursor-based
- Gunakan `count` terpisah dari data query

### 8.3 Connection Pooling
```env
# Recommended pool size untuk 50 concurrent users
DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=30"
```

---

## 9. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-06 | Initial database design |
