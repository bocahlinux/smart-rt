"""
Buat sample data untuk semua modul Smart-RT.

Jalankan dengan:
    python manage.py seed_data

Idempotent — aman dijalankan berkali-kali (pakai get_or_create).
Untuk menghapus semua data lalu seed ulang:
    python manage.py seed_data --reset
"""
import random
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

User = get_user_model()

# ── Konstanta ──────────────────────────────────────────────────────────────────

TAHUN = date.today().year
BULAN = date.today().month

USERS = [
    # email, password, role, phone, nama
    ("admin@smart-rt.id",       "admin123",       "admin",      "08100000001", "Admin Sistem"),
    ("ketua@smart-rt.id",       "ketua123",       "ketua_rt",   "08100000002", "Bapak Suharto"),
    ("sekretaris@smart-rt.id",  "sekretaris123",  "sekretaris", "08100000003", "Ibu Rahayu"),
    ("bendahara@smart-rt.id",   "bendahara123",   "bendahara",  "08100000004", "Bapak Wahyu"),
    ("pengurus@smart-rt.id",    "pengurus123",    "pengurus",   "08100000005", "Ibu Sari"),
    ("warga1@smart-rt.id",      "warga123",       "warga",      "08100000011", "Budi Santoso"),
    ("warga2@smart-rt.id",      "warga123",       "warga",      "08100000012", "Sri Wahyuni"),
    ("warga3@smart-rt.id",      "warga123",       "warga",      "08100000013", "Andi Pratama"),
    ("warga4@smart-rt.id",      "warga123",       "warga",      "08100000014", "Dewi Lestari"),
    ("warga5@smart-rt.id",      "warga123",       "warga",      "08100000015", "Riko Firmansyah"),
]

KK_LIST = [
    # no_kk, alamat
    ("3578010101010001", "Jl. Mawar No. 12, Blok A"),
    ("3578010101010002", "Jl. Melati No. 5, Blok B"),
    ("3578010101010003", "Jl. Anggrek No. 8, Blok C"),
]

# anggota per KK: (email_user, hubungan, blok, no_rumah, nik, jenis_kelamin)
KK_ANGGOTA = {
    "3578010101010001": [
        ("warga1@smart-rt.id",  "kepala_keluarga", "A", "12", "3578010101010011", "L"),
        ("warga2@smart-rt.id",  "istri",            "A", "12", "3578010101010012", "P"),
    ],
    "3578010101010002": [
        ("warga3@smart-rt.id",  "kepala_keluarga", "B", "05", "3578010101010013", "L"),
        ("warga4@smart-rt.id",  "istri",            "B", "05", "3578010101010014", "P"),
    ],
    "3578010101010003": [
        ("warga5@smart-rt.id",  "kepala_keluarga", "C", "08", "3578010101010015", "L"),
    ],
}


class Command(BaseCommand):
    help = "Buat sample data untuk semua modul Smart-RT"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Hapus semua data sample sebelum seed ulang (hati-hati!)",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self._reset()

        self.stdout.write(self.style.MIGRATE_HEADING("=== Seed Data Smart-RT ===\n"))

        admin_user = self._seed_users()
        self._seed_permissions(admin_user)
        kk_map, user_map, profile_map = self._seed_warga()
        self._seed_keuangan(admin_user)
        self._seed_iuran(admin_user, profile_map)
        self._seed_pengumuman(admin_user)
        self._seed_kegiatan(admin_user, user_map)
        self._seed_polling(admin_user, user_map)
        self._seed_forum(admin_user, user_map)
        self._seed_pengaduan(user_map)
        self._seed_surat(user_map, admin_user)

        self.stdout.write(self.style.SUCCESS("\n✓ Seed data selesai!\n"))
        self.stdout.write("Akun login:")
        for email, pw, role, *_ in USERS:
            self.stdout.write(f"  {role:<12} {email} / {pw}")

    # ── Reset ──────────────────────────────────────────────────────────────────

    def _reset(self):
        self.stdout.write(self.style.WARNING("Menghapus data sample lama..."))
        emails = [u[0] for u in USERS]
        User.objects.filter(email__in=emails).delete()
        self.stdout.write("  Data user dan relasinya dihapus.")

    # ── Users ──────────────────────────────────────────────────────────────────

    def _seed_users(self):
        self.stdout.write("→ Users & Profil...")
        admin_user = None
        for email, pw, role, phone, _ in USERS:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email.split("@")[0],
                    "phone": phone,
                    "role": role,
                    "status": "active",
                    "is_active": True,
                },
            )
            if created:
                user.set_password(pw)
                user.save()
                self.stdout.write(f"  + {email} ({role})")
            else:
                self.stdout.write(f"  ~ {email} sudah ada")
            if role == "admin":
                admin_user = user
        return admin_user

    # ── Permissions ────────────────────────────────────────────────────────────

    def _seed_permissions(self, admin_user):
        from accounts.permissions import DEFAULT_PERMISSIONS
        from accounts.models import PermissionConfig

        self.stdout.write("→ Permissions...")
        created = 0
        for perm in DEFAULT_PERMISSIONS:
            _, is_new = PermissionConfig.objects.get_or_create(
                key=perm["key"],
                defaults={
                    "label": perm["label"],
                    "description": perm.get("description", ""),
                    "category": perm.get("category", ""),
                    "allowed_roles": perm.get("allowed_roles", []),
                },
            )
            if is_new:
                created += 1
        self.stdout.write(f"  + {created} permission baru")

    # ── Warga & KK ────────────────────────────────────────────────────────────

    def _seed_warga(self):
        from kartu_keluarga.models import KartuKeluarga
        from accounts.models import WargaProfile

        self.stdout.write("→ Kartu Keluarga & Warga Profile...")

        admin_user = User.objects.get(email="admin@smart-rt.id")
        user_map = {u.email: u for u in User.objects.filter(email__in=[u[0] for u in USERS])}

        # Buat KK
        kk_map = {}
        for no_kk, alamat in KK_LIST:
            kk, created = KartuKeluarga.objects.get_or_create(
                no_kk=no_kk,
                defaults={"alamat": alamat, "created_by": admin_user},
            )
            kk_map[no_kk] = kk
            if created:
                self.stdout.write(f"  + KK {no_kk}")

        # Buat WargaProfile
        profile_map = {}
        for no_kk, anggota_list in KK_ANGGOTA.items():
            kk = kk_map[no_kk]
            for email, hubungan, blok, no_rumah, nik, jk in anggota_list:
                user = user_map.get(email)
                if not user:
                    continue
                # Cari nama dari USERS
                nama = next((u[4] for u in USERS if u[0] == email), email.split("@")[0])
                profile, created = WargaProfile.objects.get_or_create(
                    nik=nik,
                    defaults={
                        "user": user,
                        "nama_lengkap": nama,
                        "tempat_lahir": "Surabaya",
                        "tanggal_lahir": date(1990, 1, 15),
                        "jenis_kelamin": jk,
                        "agama": "Islam",
                        "status_perkawinan": "kawin" if hubungan in ("kepala_keluarga", "istri") else "belum_kawin",
                        "pekerjaan": "Karyawan Swasta",
                        "kartu_keluarga": kk,
                        "hubungan_keluarga": hubungan,
                        "alamat": kk.alamat,
                        "blok": blok,
                        "no_rumah": no_rumah,
                        "status": "aktif",
                    },
                )
                profile_map[email] = profile
                if created:
                    self.stdout.write(f"  + Profil {nama} ({hubungan})")

        return kk_map, user_map, profile_map

    # ── Keuangan ──────────────────────────────────────────────────────────────

    def _seed_keuangan(self, admin_user):
        from keuangan.models import KategoriTransaksi, Transaksi, JenisIuran, PengaturanIuran

        self.stdout.write("→ Keuangan...")

        # Kategori
        KATEGORI = [
            ("Iuran Warga", "pemasukan"),
            ("Kas Masuk", "pemasukan"),
            ("Sumbangan / Donasi", "pemasukan"),
            ("Dana Hibah", "pemasukan"),
            ("Pendapatan Lain", "pemasukan"),
            ("Operasional RT", "pengeluaran"),
            ("Kegiatan Warga", "pengeluaran"),
            ("Kebersihan & Lingkungan", "pengeluaran"),
            ("Keamanan", "pengeluaran"),
            ("Perbaikan Fasilitas", "pengeluaran"),
            ("Administrasi", "pengeluaran"),
            ("Pengeluaran Lain", "pengeluaran"),
        ]
        kat_map = {}
        for nama, tipe in KATEGORI:
            kat, _ = KategoriTransaksi.objects.get_or_create(nama=nama, tipe=tipe)
            kat_map[(nama, tipe)] = kat

        # Jenis Iuran
        JenisIuran.objects.get_or_create(
            slug="iuran-bulanan",
            defaults={
                "nama": "Iuran Bulanan",
                "tipe": "wajib",
                "unit": "per_kk",
                "nominal": 50000,
                "keterangan": "Iuran wajib bulanan per KK",
                "is_active": True,
                "urutan": 1,
            },
        )
        JenisIuran.objects.get_or_create(
            slug="iuran-kebersihan",
            defaults={
                "nama": "Iuran Kebersihan",
                "tipe": "wajib",
                "unit": "per_kk",
                "nominal": 20000,
                "keterangan": "Iuran kebersihan lingkungan per KK",
                "is_active": True,
                "urutan": 2,
            },
        )
        self.stdout.write("  + Kategori transaksi & jenis iuran")

        # Pengaturan iuran
        PengaturanIuran.get_instance()

        # Transaksi 6 bulan terakhir
        pemasukan_kat = kat_map.get(("Iuran Warga", "pemasukan"))
        kegiatan_kat = kat_map.get(("Kegiatan Warga", "pengeluaran"))
        kebersihan_kat = kat_map.get(("Kebersihan & Lingkungan", "pengeluaran"))
        operasional_kat = kat_map.get(("Operasional RT", "pengeluaran"))

        created = 0
        for i in range(6):
            tgl_offset = date.today().replace(day=15) - timedelta(days=30 * i)
            bulan = tgl_offset.month
            tahun = tgl_offset.year

            # Pemasukan iuran
            _, is_new = Transaksi.objects.get_or_create(
                kategori=pemasukan_kat,
                tanggal=date(tahun, bulan, 10),
                tipe="pemasukan",
                keterangan=f"Iuran warga bulan {bulan}/{tahun}",
                defaults={
                    "jumlah": 350000,
                    "status": "confirmed",
                    "created_by": admin_user,
                },
            )
            if is_new:
                created += 1

            # Pengeluaran
            _, is_new = Transaksi.objects.get_or_create(
                kategori=kegiatan_kat if i % 2 == 0 else kebersihan_kat,
                tanggal=date(tahun, bulan, 20),
                tipe="pengeluaran",
                keterangan=f"Pengeluaran rutin bulan {bulan}/{tahun}",
                defaults={
                    "jumlah": random.choice([150000, 200000, 175000, 120000]),
                    "status": "confirmed",
                    "created_by": admin_user,
                },
            )
            if is_new:
                created += 1

        self.stdout.write(f"  + {created} transaksi sample")

    # ── Iuran Warga ───────────────────────────────────────────────────────────

    def _seed_iuran(self, admin_user, profile_map):
        from keuangan.models import IuranWarga, JenisIuran

        self.stdout.write("→ Iuran Warga...")

        jenis = JenisIuran.objects.filter(slug="iuran-bulanan").first()
        if not jenis:
            return

        warga_emails = [u[0] for u in USERS if u[2] == "warga"]
        created = 0
        for email in warga_emails:
            profile = profile_map.get(email)
            if not profile:
                continue
            for i in range(3):
                bln = BULAN - i if BULAN - i >= 1 else BULAN - i + 12
                thn = TAHUN if BULAN - i >= 1 else TAHUN - 1
                status = "lunas" if i > 0 else ("pending" if email == warga_emails[-1] else "lunas")
                _, is_new = IuranWarga.objects.get_or_create(
                    warga=profile,
                    jenis=jenis,
                    bulan=bln,
                    tahun=thn,
                    defaults={
                        "jumlah": 50000,
                        "status": status,
                        "confirmed_by": admin_user if status == "lunas" else None,
                        "confirmed_at": timezone.now() if status == "lunas" else None,
                    },
                )
                if is_new:
                    created += 1

        self.stdout.write(f"  + {created} record iuran")

    # ── Pengumuman ────────────────────────────────────────────────────────────

    def _seed_pengumuman(self, admin_user):
        from pengumuman.models import Pengumuman

        self.stdout.write("→ Pengumuman...")

        DATA = [
            ("Rapat Warga Bulanan", "Diinformasikan kepada seluruh warga RT bahwa akan diadakan rapat warga bulanan pada Sabtu, 21 Juni 2025 pukul 19.00 WIB bertempat di Balai RT.", "acara"),
            ("Peringatan Keamanan Lingkungan", "Kepada seluruh warga, harap waspada terhadap tindak kejahatan di malam hari. Pastikan rumah terkunci dengan baik dan laporkan hal mencurigakan ke ketua RT.", "keamanan"),
            ("Jadwal Pengangkutan Sampah", "Mulai bulan ini, jadwal pengangkutan sampah berubah menjadi setiap Senin, Rabu, dan Jumat pagi pukul 06.00 WIB.", "info"),
            ("Gotong Royong RT", "Agenda gotong royong membersihkan saluran air dan taman lingkungan dijadwalkan pada hari Minggu, 22 Juni 2025 pukul 07.00 WIB.", "acara"),
            ("Pembayaran Iuran Bulan Juni", "Reminder pembayaran iuran RT bulan Juni 2025. Harap segera melakukan pembayaran melalui aplikasi atau langsung ke bendahara RT.", "penting"),
        ]
        created = 0
        for judul, isi, kategori in DATA:
            _, is_new = Pengumuman.objects.get_or_create(
                judul=judul,
                defaults={
                    "isi": isi,
                    "kategori": kategori,
                    "is_published": True,
                    "created_by": admin_user,
                },
            )
            if is_new:
                created += 1

        self.stdout.write(f"  + {created} pengumuman")

    # ── Kegiatan ──────────────────────────────────────────────────────────────

    def _seed_kegiatan(self, admin_user, user_map):
        from kegiatan.models import Kegiatan, RSVP

        self.stdout.write("→ Kegiatan...")

        now = timezone.now()
        DATA = [
            ("Rapat Warga Bulanan",          now + timedelta(days=5),  "Balai RT",          20),
            ("Gotong Royong Bersih Saluran",  now + timedelta(days=10), "Lingkungan RT",     None),
            ("Peringatan 17 Agustus",         now + timedelta(days=62), "Lapangan RT",       None),
            ("Pemilihan Ketua RT",            now + timedelta(days=90), "Balai Desa",        50),
            ("Senam Pagi Warga",              now - timedelta(days=7),  "Depan Pos Ronda",   None),
        ]
        created = 0
        for nama, tgl, lokasi, kuota in DATA:
            _, is_new = Kegiatan.objects.get_or_create(
                nama=nama,
                defaults={
                    "tanggal": tgl,
                    "lokasi": lokasi,
                    "kuota_peserta": kuota,
                    "created_by": admin_user,
                },
            )
            if is_new:
                created += 1

        # RSVP dari warga
        kegiatan = Kegiatan.objects.first()
        if kegiatan:
            warga_users = [u for u in user_map.values() if u.role == "warga"]
            for warga in warga_users:
                RSVP.objects.get_or_create(
                    kegiatan=kegiatan,
                    user=warga,
                    defaults={"status": "hadir"},
                )

        self.stdout.write(f"  + {created} kegiatan")

    # ── Polling ───────────────────────────────────────────────────────────────

    def _seed_polling(self, admin_user, user_map):
        from polling.models import Poll, Vote

        self.stdout.write("→ Polling...")

        now = timezone.now()
        DATA = [
            (
                "Kapan waktu yang tepat untuk rapat warga bulanan?",
                ["Sabtu pagi (08.00-10.00)", "Sabtu malam (19.00-21.00)", "Minggu pagi (08.00-10.00)"],
                now + timedelta(days=7),
            ),
            (
                "Jenis kegiatan apa yang ingin diadakan untuk HUT RI ke-80?",
                ["Lomba 17-an klasik", "Pentas seni warga", "Turnamen olahraga", "Kerja bakti + tasyakuran"],
                now + timedelta(days=30),
            ),
            (
                "Bagaimana pendapat Anda tentang fasilitas taman RT saat ini?",
                ["Sudah baik", "Perlu sedikit perbaikan", "Perlu renovasi total"],
                now - timedelta(days=3),
            ),
        ]
        warga_users = [u for u in user_map.values() if u.role == "warga"]
        created_poll = 0
        for pertanyaan, opsi, deadline in DATA:
            poll, is_new = Poll.objects.get_or_create(
                pertanyaan=pertanyaan,
                defaults={
                    "opsi": opsi,
                    "deadline": deadline,
                    "created_by": admin_user,
                },
            )
            if is_new:
                created_poll += 1
                # Tambah beberapa vote
                for i, warga in enumerate(warga_users):
                    Vote.objects.get_or_create(
                        poll=poll,
                        user=warga,
                        defaults={"opsi_index": i % len(opsi)},
                    )

        self.stdout.write(f"  + {created_poll} polling")

    # ── Forum ─────────────────────────────────────────────────────────────────

    def _seed_forum(self, admin_user, user_map):
        from forum.models import Thread, Comment

        self.stdout.write("→ Forum Diskusi...")

        warga_users = list(user_map.values())
        DATA = [
            (
                "Usul pemasangan CCTV di gerbang RT",
                "Menurut saya, perlu dipasang CCTV di gerbang masuk RT untuk meningkatkan keamanan. Bagaimana pendapat warga lain?",
                "keamanan",
                [
                    ("Saya setuju sekali! Kejadian kemarin bikin was-was.", 1),
                    ("Perlu dibahas dulu soal anggaran dan siapa yang mengelola.", 2),
                ],
            ),
            (
                "Jadwal piket jaga malam",
                "Apakah kita perlu mengaktifkan kembali jadwal ronda malam? Kondisi keamanan lingkungan belakangan ini cukup mengkhawatirkan.",
                "keamanan",
                [
                    ("Setuju, saya siap ikut ronda setiap Senin.", 3),
                ],
            ),
            (
                "Usul pengadaan tempat sampah pilah di tiap blok",
                "Bagaimana kalau kita usulkan pengadaan tempat sampah pilah (organik dan anorganik) di tiap blok? Ini bisa membantu program lingkungan bersih.",
                "usul",
                [],
            ),
        ]
        created = 0
        for judul, isi, kategori, comments in DATA:
            thread, is_new = Thread.objects.get_or_create(
                judul=judul,
                defaults={
                    "isi": isi,
                    "kategori": kategori,
                    "created_by": admin_user,
                },
            )
            if is_new:
                created += 1
                for komentar_isi, user_idx in comments:
                    commenter = warga_users[user_idx % len(warga_users)]
                    Comment.objects.create(thread=thread, isi=komentar_isi, created_by=commenter)

        self.stdout.write(f"  + {created} thread forum")

    # ── Pengaduan ─────────────────────────────────────────────────────────────

    def _seed_pengaduan(self, user_map):
        from pengaduan.models import Pengaduan

        self.stdout.write("→ Pengaduan...")

        warga_users = [u for u in user_map.values() if u.role == "warga"]
        if not warga_users:
            return

        DATA = [
            (warga_users[0], "Jalan berlubang di depan Blok A",
             "Terdapat lubang besar di jalan depan Blok A nomor 10-12 yang membahayakan pengendara sepeda motor, terutama saat malam hari.",
             "infrastruktur", "diajukan"),
            (warga_users[1], "Lampu jalan mati di Blok B",
             "Lampu jalan di dekat pos ronda Blok B sudah mati sejak 2 minggu lalu dan belum diperbaiki.",
             "infrastruktur", "diproses"),
            (warga_users[2] if len(warga_users) > 2 else warga_users[0],
             "Sampah menumpuk di dekat saluran air",
             "Ada tumpukan sampah yang tidak diangkut selama beberapa hari di dekat saluran air Blok C, menimbulkan bau tidak sedap.",
             "kebersihan", "selesai"),
        ]
        created = 0
        for warga, judul, deskripsi, kategori, status in DATA:
            _, is_new = Pengaduan.objects.get_or_create(
                warga=warga,
                judul=judul,
                defaults={
                    "deskripsi": deskripsi,
                    "kategori": kategori,
                    "status": status,
                    "status_history": [
                        {"status": "diajukan", "keterangan": "Pengaduan diterima", "updatedBy": warga.email, "updatedAt": timezone.now().isoformat()},
                    ],
                },
            )
            if is_new:
                created += 1

        self.stdout.write(f"  + {created} pengaduan")

    # ── Surat Menyurat ────────────────────────────────────────────────────────

    def _seed_surat(self, user_map, admin_user):
        try:
            from surat.models import JenisSurat, PermohonanSurat
        except ImportError:
            self.stdout.write(self.style.WARNING("  ! Modul surat belum ter-install, skip."))
            return

        self.stdout.write("→ Permohonan Surat...")

        warga_users = [u for u in user_map.values() if u.role == "warga"]
        if not warga_users:
            return

        jenis_domisili = JenisSurat.objects.filter(kode="domisili").first()
        jenis_pengantar = JenisSurat.objects.filter(kode="pengantar").first()
        if not jenis_domisili or not jenis_pengantar:
            self.stdout.write(self.style.WARNING("  ! JenisSurat belum di-seed, jalankan migrate dulu."))
            return

        DATA = [
            (warga_users[0], jenis_domisili, "Keperluan melamar pekerjaan di perusahaan swasta.", "disetujui", "001/RT04/VI/2025"),
            (warga_users[1] if len(warga_users) > 1 else warga_users[0], jenis_pengantar, "Mengurus surat pindah domisili ke kelurahan.", "diajukan", None),
        ]
        created = 0
        for pemohon, jenis, keperluan, status, no_surat in DATA:
            _, is_new = PermohonanSurat.objects.get_or_create(
                pemohon=pemohon,
                jenis=jenis,
                defaults={
                    "keperluan": keperluan,
                    "status": status,
                    "no_surat": no_surat,
                    "reviewed_by": admin_user if status != "diajukan" else None,
                    "reviewed_at": timezone.now() if status != "diajukan" else None,
                    "data_form": {},
                },
            )
            if is_new:
                created += 1

        self.stdout.write(f"  + {created} permohonan surat")
