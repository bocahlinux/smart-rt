# Smart-RT — Product Requirements Document (PRD)

**Version:** 1.0.0
**Date:** June 6, 2026
**Author:** OWL (Hermes Agent) for YCC
**Status:** Draft

---

## 1. Executive Summary

Smart-RT adalah **platform digital berbasis web** untuk mengelola urusan Rukun Tetangga (RT) secara modern dan terintegrasi. Aplikasi ini mencakup manajemen data warga, keuangan RT, pengumuman, forum diskusi, pengaduan, kegiatan, dan pelaporan — semua dalam satu platform.

Aplikasi ini dirancang sebagai **web-based + PWA** sehingga bisa diakses via desktop/laptop oleh pengurus RT dan via HP oleh warga.

---

## 2. Product Vision

### 2.1 Problem Statement
Pengelolaan RT masih dilakukan secara manual — catatan kertas, grup WhatsApp yang berantakan, iuran yang tidak terkelola, dan warga yang tidak terinformasi dengan baik.

### 2.2 Solution
Satu platform digital yang:
- Mengelola data warga secara lengkap dan terstruktur
- Mencatat keuangan RT (pemasukan & pengeluaran) secara transparan
- Menyebarkan pengumuman real-time ke semua warga
- Menyediakan forum diskusi dan polling untuk pengambilan keputusan
- Menerima pengaduan warga dengan tracking status
- Mengelola kegiatan & kalender RT
- Menghasilkan laporan otomatis

### 2.3 Goals
1. **Digitalisasi** — Hilangkan catatan kertas, semua tercatat digital
2. **Transparansi** — Keuangan & kegiatan RT transparan untuk semua warga
3. **Efisiensi** — Pengurus RT kerja lebih cepat dan terstruktur
4. **Partisipasi** — Warga lebih aktif karena akses mudah via HP
5. **Akuntabilitas** — Semua tercatat, bisa diaudit kapan saja

---

## 3. Target Audience

| Audience | Use Case | Akses |
|----------|----------|-------|
| **Ketua RT** | Kelola semua aspek RT, approve keputusan | Desktop/Mobile |
| **Sekretaris** | Kelola data warga, surat-menyurat | Desktop/Mobile |
| **Bendahara** | Kelola keuangan, konfirmasi pembayaran | Desktop/Mobile |
| **Pengurus lain** | Kelola kegiatan, pengaduan, forum | Desktop/Mobile |
| **Warga** | Lihat pengumuman, bayar iuran, lapor masalah, diskusi | Mobile (PWA) |

---

## 4. Features

### 4.1 Multi-Role Authentication
- Register & login dengan email/no. HP
- 3 role: Admin (Ketua RT), Pengurus, Warga
- Warga perlu verifikasi oleh pengurus (approve/reject)
- JWT-based authentication

### 4.2 Data Warga
- Data lengkap: NIK, nama, TTL, jenis kelamin, agama, status perkawinan, pendidikan, pekerjaan, no. HP, email, foto
- Data keluarga: No. KK, hubungan, alamat lengkap
- Status: aktif, tidak aktif, pindah, meninggal
- CRUD, import Excel, export Excel/PDF
- Pencarian & filter (blok, status, usia, dll)
- Kartu keluarga digital
- Audit log perubahan data

### 4.3 Keuangan RT
- **Pemasukan**: iuran bulanan, sumbangan, kas, lainnya
- **Pengeluaran**: kebersihan, listrik, perbaikan, acara, lainnya
- Upload bukti transfer (warga upload, pengurus konfirmasi manual)
- Dashboard saldo real-time
- Laporan bulanan/tahunan (auto-generate PDF)
- Kategori transaksi customizable

### 4.4 Pengumuman & Notifikasi
- Buat pengumuman (judul, isi, gambar, kategori)
- Kategori: Penting, Biasa, Acara
- Push notification ke warga (Web Push PWA)
- Penjadwalan pengumuman
- Riwayat pengumuman

### 4.5 Forum Diskusi
- Thread per topik
- Kategori: Keamanan, Kebersihan, Acara, Usul, Lainnya
- Komentar & balasan
- Voting/polling dalam thread
- Moderasi oleh pengurus (hapus, pin, lock)

### 4.6 Pengaduan Warga
- Form pengaduan (judul, deskripsi, kategori, foto)
- Tracking status: Diterima → Diproses → Selesai → Ditolak
- Komentar/tindak lanjut dari pengurus
- Kategori: Keamanan, Kebersihan, Infrastruktur, Lainnya
- Notifikasi perubahan status ke pelapor

### 4.7 Kegiatan & Kalender
- Kalender kegiatan RT
- Detail kegiatan (nama, tanggal, lokasi, deskripsi, penanggung jawab)
- RSVP/tanda hadir
- Notifikasi reminder
- Dokumentasi foto kegiatan

### 4.8 Polling & Voting
- Buat poling (pertanyaan, opsi, deadline)
- Hasil real-time dengan grafik
- Poling tertutup (hanya warga terdaftar)
- Riwayat poling

### 4.9 Dashboard & Laporan
- Dashboard pengurus: statistik warga, keuangan, pengaduan aktif, kegiatan mendatang
- Dashboard warga: iuran status, pengumuman terbaru, pengaduan saya
- Laporan otomatis (PDF): bulanan, tahunan, custom range
- Grafik pemasukan/pengeluaran

---

## 5. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Performance** | Page load < 2s, API response < 500ms |
| **Availability** | 99.5% uptime |
| **Security** | JWT auth, role-based access, input validation, SQL injection prevention |
| **Scalability** | Support up to 500 warga per RT |
| **Accessibility** | WCAG 2.1 AA compliant |
| **Responsive** | Desktop, tablet, mobile (PWA) |
| **Browser Support** | Chrome, Firefox, Safari, Edge (2 versi terakhir) |
| **Data Backup** | Daily auto-backup |

---

## 6. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TypeScript 6, Tailwind CSS 4 |
| PWA | Vite PWA Plugin, Workbox |
| Backend | Node.js 20, Express 5, TypeScript 6 |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT (jsonwebtoken), bcrypt |
| File Upload | Multer (local storage) |
| Notifikasi | Web Push API |
| PDF Generation | Puppeteer / PDFKit |
| Deployment | Docker, Docker Compose |

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Data warga terdigitalisasi | 100% |
| Iuran tercatat digital | > 90% |
| Pengumuman dibaca warga | > 70% |
| Pengaduan ditindaklanjuti | > 80% dalam 7 hari |
| Kepuasan pengurus | > 4/5 |
| Kepuasan warga | > 4/5 |

---

## 8. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Warga sulit adaptasi | High | UI simpel, onboarding, bantuan via WhatsApp |
| Data sensitif bocor | High | Enkripsi, role-based access, audit log |
| Server down | Medium | Daily backup, monitoring, VPS reliable |
| Fitur terlalu kompleks | Medium | Prioritaskan MVP, tambah fitur bertahap |
| Pengurus tidak mau pakai | Medium | Training, UI mudah, manfaat langsung terasa |

---

## 9. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-06 | Initial PRD |
