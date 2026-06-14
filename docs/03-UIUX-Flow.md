# Smart-RT — UI/UX Flow Document

**Version:** 1.0.0
**Date:** June 6, 2026
**Status:** Active

---

## 1. Design Principles

1. **Mobile-First** — Mayoritas warga akses via HP, desain prioritas mobile
2. **Simpel & Jelas** — Warga dari berbagai usia harus bisa pakai tanpa training
3. **Cepat** — Minimal klik untuk mencapai tujuan
4. **Konsisten** — Satu design language di semua halaman
5. **Accessible** — WCAG 2.1 AA, kontras cukup, font readable

---

## 2. User Flow

### 2.1 Alur Registrasi & Login

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Landing    │────▶│  Register   │────▶│  Verifikasi │────▶│   Login     │
│  Page       │     │  (email/HP) │     │  (pending)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                    │
                                                                    ▼
                                                             ┌─────────────┐
                                                             │  Dashboard  │
                                                             │  (role-     │
                                                             │   based)    │
                                                             └─────────────┘
```

**Detail:**
1. Warga buka website → Landing page dengan tombol "Masuk" dan "Daftar"
2. Klik "Daftar" → Isi form (nama, email, no. HP, password)
3. Setelah register → Status "Menunggu Verifikasi"
4. Pengurus RT verifikasi di panel admin → Setujui/Tolak
5. Warga dapat notifikasi → Login dengan email/no. HP + password
6. Redirect ke dashboard sesuai role

### 2.2 Alur Pengurus RT

```
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Pengurus                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Total   │ │ Saldo   │ │Pengaduan│ │Kegiatan │          │
│  │ Warga   │ │ Kas     │ │ Aktif   │ │Mendatang│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────────────────────
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                      Menu Sidebar                            │
│  📊 Dashboard                                                │
│  👥 Data Warga                                               │
│  💰 Keuangan                                                 │
│  📢 Pengumuman                                               │
│  💬 Forum                                                    │
│  📝 Pengaduan                                                │
│  📅 Kegiatan                                                 │
│  📊 Polling                                                  │
│  📄 Laporan                                                  │
│  ⚙️ Pengaturan                                               │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Alur Warga

```
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Warga                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Status      │ │ Pengumuman  │ │ Pengaduan   │          │
│  │ Iuran       │ │ Terbaru     │ │ Saya        │          │
│  │ (Lunas/     │ │             │ │             │          │
│  │  Belum)     │ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────────────────────
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                      Menu Bottom Nav (Mobile)                │
│  🏠 Home   📢 Info   💬 Forum   📝 Lapor   👤 Profil        │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Page-by-Page Specification

### 3.1 Landing Page
| Element | Description |
|---------|-------------|
| Header | Logo "Smart-RT" + tagline "Digitalisasi RT Anda" |
| Hero | Ilustrasi + CTA "Daftar Sekarang" |
| Features | 6 fitur utama (grid cards) |
| Footer | Links, kontak, copyright |

### 3.2 Login Page
| Element | Description |
|---------|-------------|
| Form | Email/No. HP + Password |
| Links | "Lupa Password?", "Belum punya akun?" |
| Button | "Masuk" (full-width, primary color) |

### 3.3 Register Page
| Element | Description |
|---------|-------------|
| Form | Nama, Email, No. HP, Password, Konfirmasi Password |
| Info | "Akun akan diverifikasi oleh pengurus RT" |
| Button | "Daftar" |

### 3.4 Dashboard Pengurus
| Element | Description |
|---------|-------------|
| Stats Cards | Total warga, saldo kas, pengaduan aktif, kegiatan mendatang |
| Quick Actions | "+ Tambah Warga", "+ Catat Transaksi", "+ Buat Pengumuman" |
| Recent Activity | 5 aktivitas terakhir |
| Chart | Grafik pemasukan/pengeluhan 6 bulan terakhir |

### 3.5 Dashboard Warga
| Element | Description |
|---------|-------------|
| Status Iuran | Bulan ini: Lunas/Belum + tombol "Bayar" |
| Pengumuman Terbaru | 3 pengumuman terbaru |
| Pengaduan Saya | Status pengaduan terakhir |
| Quick Actions | "Lihat Forum", "Buat Pengaduan" |

### 3.6 Data Warga (Pengurus)
| Element | Description |
|---------|-------------|
| Table | Nama, Alamat, No. HP, Status |
| Filter | Per blok, per status, search by name |
| Actions | Detail, Edit, Hapus (per row) |
| Buttons | "+ Tambah Warga", "Import Excel", "Export" |

### 3.7 Detail Warga
| Element | Description |
|---------|-------------|
| Profil Card | Foto, nama, NIK, alamat |
| Data Pribad | TTL, jenis kelamin, agama, pendidikan, pekerjaan |
| Data Keluarga | No. KK, hubungan, anggota keluarga |
| Riwayat Iuran | Table iuran per bulan |
| Actions | Edit, Cetak Kartu Keluarga |

### 3.8 Keuangan (Pengurus)
| Element | Description |
|---------|-------------|
| Summary | Total pemasukan, pengeluaran, saldo |
| Filter | Per bulan, per kategori, per tipe |
| Table | Tanggal, Kategori, Keterangan, Jumlah, Bukti |
| Chart | Pie chart kategori, line chart trend |
| Buttons | "+ Tambat Transaksi", "Export Laporan" |

### 3.9 Iuran Warga
| Element | Description |
|---------|-------------|
| Status | Bulan ini: Lunas/Belum |
| Riwayat | Table iuran per bulan |
| Upload | Form upload bukti transfer |
| Info | No. rekening RT, nominal iuran |

### 3.10 Pengumuman
| Element | Description |
|---------|-------------|
| List | Card list pengumuman (terbaru di atas) |
| Badge | Kategori: Penting (merah), Biasa (biru), Acara (hijau) |
| Detail | Judul, isi, gambar, tanggal, kategori |
| Form (Pengurus) | Judul, isi, kategori, gambar, jadwal |

### 3.11 Forum
| Element | Description |
|---------|-------------|
| Thread List | Judul, kategori, jumlah komentar, waktu |
| Filter | Per kategori, terbaru, terpopuler |
| Thread Detail | Isi thread + list komentar + form komentar |
| Actions (Pengurus) | Pin, Lock, Delete |

### 3.12 Pengaduan
| Element | Description |
|---------|-------------|
| List | Judul, kategori, status, tanggal |
| Status Badge | Diterima (abu), Diproses (kuning), Selesai (hijau), Ditolak (merah) |
| Detail | Judul, deskripsi, foto, status timeline, komentar |
| Form | Judul, deskripsi, kategori, upload foto |

### 3.13 Kegiatan
| Element | Description |
|---------|-------------|
| Kalender | Tampilan bulanan dengan marker kegiatan |
| Detail | Nama, tanggal, lokasi, deskripsi, RSVP count |
| RSVP Button | "Saya Hadir" / "Batalkan" |
| Form (Pengurus) | Nama, tanggal, lokasi, deskripsi |

### 3.14 Polling
| Element | Description |
|---------|-------------|
| List | Pertanyaan, deadline, status (aktif/selesai) |
| Detail | Pertanyaan, opsi, tombol vote, hasil (grafik) |
| Form (Pengurus) | Pertanyaan, opsi (min 2), deadline |

### 3.15 Laporan
| Element | Description |
|---------|-------------|
| Filter | Per bulan, per tahun, custom range |
| Preview | Tabel laporan keuangan |
| Download | Tombol "Download PDF" |
| Chart | Grafik pemasukan vs pengeluaran |

### 3.16 Profil
| Element | Description |
|---------|-------------|
| Info | Foto, nama, email, no. HP |
| Edit | Form edit profil |
| Ganti Password | Form ganti password |
| Logout | Tombol logout |

---

## 4. Sensitive Data Display Rules

- Role warga tidak melihat NIK/no KK lengkap warga lain.
- NIK ditampilkan sebagai `3201********1234`.
- No KK ditampilkan sebagai `3201********5678`.
- Nomor HP warga lain ditampilkan terbatas atau disembunyikan.
- Bukti transfer hanya tampil untuk pemilik transaksi dan pengurus keuangan.
- Pengaduan dengan kategori sensitif tidak tampil publik.
- Export PDF/Excel hanya tersedia untuk pengurus/admin.

---

## 5. Navigation Structure

### 5.1 Desktop (Sidebar)
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Smart-RT                    [🔔] [👤 Nama ▼]       │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  📊 Dashboard│           Main Content Area                  │
│  👥 Warga    │                                              │
│  💰 Keuangan │                                              │
│  📢 Pengumuman│                                             │
│  💬 Forum    │                                              │
│  📝 Pengaduan│                                              │
│  📅 Kegiatan │                                              │
│  📊 Polling  │                                              │
│  📄 Laporan  │                                              │
│  ─────────── │                                              │
│  ⚙️ Pengaturan│                                             │
│  🚪 Logout   │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### 5.2 Mobile (Bottom Navigation)
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Smart-RT                    [🔔] [👤]               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Main Content Area                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🏠 Home   📢 Info   💬 Forum   📝 Lapor   👤 Profil       │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Color Scheme

| Usage | Color | Hex |
|-------|-------|-----|
| Primary | Blue | #1E40AF |
| Primary Light | Blue | #3B82F6 |
| Secondary | Emerald | #059669 |
| Accent | Amber | #F59E0B |
| Success | Green | #22C55E |
| Warning | Orange | #F97316 |
| Error | Red | #EF4444 |
| Background (Light) | Slate 50 | #F8FAFC |
| Background (Dark) | Slate 900 | #0F172A |
| Text (Light) | Slate 900 | #0F172A |
| Text (Dark) | Slate 100 | #F1F5F9 |

---

## 7. Component Library

### 7.1 Common Components
- **Button**: Primary, Secondary, Danger, Ghost, sizes (sm, md, lg)
- **Input**: Text, Email, Password, Number, Date, Textarea, Select
- **Card**: Container dengan shadow dan padding
- **Table**: Sortable, paginated, responsive
- **Modal**: Dialog untuk form dan konfirmasi
- **Badge**: Status indicator (colored pill)
- **Avatar**: Foto profil dengan fallback inisial
- **Toast**: Notifikasi sukses/error/warning
- **Loading**: Spinner dan skeleton loader
- **Empty State**: Ilustrasi + pesan saat data kosong
- **Search Bar**: Input dengan ikon search
- **Filter**: Dropdown filter
- **Pagination**: Navigasi halaman

### 7.2 Layout Components
- **Header**: Top bar dengan logo, notifikasi, profil
- **Sidebar**: Navigation menu (desktop)
- **Bottom Nav**: Navigation bar (mobile)
- **Page Container**: Wrapper dengan padding dan max-width

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640-1024px | Sidebar collapsed, 2 columns |
| Desktop | > 1024px | Full sidebar, multi columns |

---

## 9. PWA Features

| Feature | Description |
|---------|-------------|
| **Installable** | "Add to Home Screen" prompt |
| **Offline Cache** | Halaman statis bisa diakses offline |
| **Push Notification** | Notifikasi pengumuman penting |
| **App Icon** | Icon di home screen |
| **Splash Screen** | Loading screen saat buka dari home screen |
| **Theme Color** | Status bar color sesuai brand |

---

## 10. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-06 | Initial UI/UX Flow |
| 1.1.0 | 2026-06-07 | Added §4 Sensitive Data Display Rules. Renumbered §4-§9 → §5-§10. |
