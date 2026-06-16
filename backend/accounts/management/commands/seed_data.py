"""
Seed sample data untuk semua modul Smart-RT.

Jalankan:
    python manage.py seed_data

Seed ulang bersih:
    python manage.py seed_data --reset

Idempotent — aman dijalankan berkali-kali.
"""
import random
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

User = get_user_model()

RNG = random.Random(2025)

TAHUN = date.today().year
BULAN = date.today().month

# ── Nama warga Indonesia ───────────────────────────────────────────────────────

NAMA_LAKI = [
    "Budi Santoso", "Agus Setiawan", "Andi Pratama", "Riko Firmansyah", "Doni Herwanto",
    "Fajar Nugroho", "Hendra Kusuma", "Irwan Saputra", "Joko Purnomo", "Kurniawan Aji",
    "Lukman Hakim", "Muhammad Faisal", "Nanda Putra", "Oscar Ramadhan", "Prasetyo Wibowo",
    "Qori Hidayat", "Rizki Permana", "Sandi Putra", "Teguh Santoso", "Usman Harun",
    "Vino Bastian", "Wahyu Setiabudi", "Yoga Aditya", "Yudi Prasetyo", "Zainal Abidin",
    "Bambang Purnomo", "Cahyo Wicaksono", "Dedy Supriadi", "Eko Prabowo", "Ferry Andrianto",
    "Gunawan Saputra", "Haryanto Susilo", "Imam Syafii", "Jimmy Sutomo", "Kevin Halim",
    "Latif Hamdani", "Maman Suryadi", "Nanang Wijaya", "Oni Kurniawan", "Puguh Hartono",
    "Rafli Ahmad", "Surya Dharma", "Toni Wahyudi", "Udin Saputra", "Valerian Hariadi",
    "Wawan Susanto", "Arif Budiman", "Zulkifli Hasim", "Aris Munandar", "Bagas Prasetyo",
    "Chandra Wijaya", "Darmawan Kusuma", "Erwin Nugroho", "Firman Hidayat", "Galih Santoso",
    "Hendri Saputra", "Ikhsan Maulana", "Jefri Setiawan", "Khoirul Anwar", "Leo Dermawan",
    "Miftah Khoiri", "Nur Cahyo", "Okta Rinaldi", "Prima Yudha", "Roni Setiawan",
    "Setya Budi", "Topan Wicaksono", "Untung Prayitno", "Vinsen Hariadi", "Widodo Eko",
    "Yayan Priyanto", "Zakaria Harun", "Alvin Saputra", "Benny Kusuma", "Catur Nugroho",
]

NAMA_PEREMPUAN = [
    "Sri Wahyuni", "Dewi Lestari", "Siti Rahayu", "Rina Marlina", "Yuni Astuti",
    "Fitri Handayani", "Hesti Purwanti", "Indah Permatasari", "Juliana Susanti", "Kartika Dewi",
    "Linda Wulandari", "Maya Anggraini", "Nisa Fauziyah", "Okta Ratnasari", "Putri Maharani",
    "Rini Astuti", "Sari Dewi", "Tuti Handayani", "Umi Kulsum", "Vina Melati",
    "Wati Rahayu", "Yani Kusuma", "Zakia Nur", "Anis Fitriana", "Baiq Rohani",
    "Citra Lestari", "Dini Anggraini", "Endang Susilowati", "Farida Hanum", "Galuh Pramesthi",
    "Hana Permata", "Iis Sumiati", "Juwita Sari", "Kiki Amelia", "Lilis Suryani",
    "Mira Septiani", "Nana Supriyati", "Oni Rahayu", "Pipit Setiawati", "Qori Anisa",
    "Retno Wulandari", "Suci Ramadhani", "Tika Fitriani", "Ummi Kalsum", "Vivi Oktavia",
    "Wiwin Hartati", "Yayuk Prasetya", "Zeni Mardiana", "Anni Kusuma", "Bella Puspita",
    "Cindy Apriani", "Desi Wulandari", "Erna Safitri", "Fika Ramadhani", "Gita Permata",
    "Heni Susanti", "Intan Cahyani", "Jayanti Ningsih", "Karina Putri", "Lena Marliani",
    "Mirna Sari", "Novi Astuti", "Ovi Yulianti", "Prita Dewi", "Reni Anggraini",
    "Silvi Wulandari", "Tiara Kusuma", "Utami Ningsih", "Vera Setiawati", "Winda Purnama",
    "Yesi Puspita", "Zulfah Sari", "Aprilia Dewi", "Bela Saputri", "Cahyani Putri",
]

PEKERJAAN = [
    "Karyawan Swasta", "PNS", "Wirausaha", "Buruh", "Petani",
    "Pedagang", "Guru", "Dokter", "Polisi", "TNI",
    "Ibu Rumah Tangga", "Driver Ojek Online", "Teknisi", "Wiraswasta", "Freelancer",
    "Perawat", "Bidan", "Mekanik", "Tukang Bangunan", "Satpam",
]

AGAMA = ["Islam"] * 6 + ["Kristen", "Katolik", "Hindu", "Buddha"]

KOTA_LAHIR = ["Surabaya", "Malang", "Sidoarjo", "Gresik", "Lamongan",
               "Pasuruan", "Mojokerto", "Blitar", "Kediri", "Jember"]

BLOK = ["A", "B", "C", "D", "E"]

# ── Akun login ─────────────────────────────────────────────────────────────────

PENGURUS_USERS = [
    ("admin@smart-rt.id",       "admin123",       "admin",      "08100000001", "Admin Sistem"),
    ("ketua@smart-rt.id",       "ketua123",       "ketua_rt",   "08100000002", "Suharto Wibowo"),
    ("sekretaris@smart-rt.id",  "sekretaris123",  "sekretaris", "08100000003", "Rahayu Putri"),
    ("bendahara@smart-rt.id",   "bendahara123",   "bendahara",  "08100000004", "Wahyu Susanto"),
    ("pengurus1@smart-rt.id",   "pengurus123",    "pengurus",   "08100000005", "Sari Anggraini"),
    ("pengurus2@smart-rt.id",   "pengurus123",    "pengurus",   "08100000006", "Bambang Irianto"),
]

WARGA_LOGIN_DATA = [
    # (email, password, role, phone, nama, jk)
    ("warga01@smart-rt.id",  "warga123", "warga", "08120000001", "Budi Santoso",      "L"),
    ("warga02@smart-rt.id",  "warga123", "warga", "08120000002", "Sri Wahyuni",        "P"),
    ("warga03@smart-rt.id",  "warga123", "warga", "08120000003", "Andi Pratama",       "L"),
    ("warga04@smart-rt.id",  "warga123", "warga", "08120000004", "Dewi Lestari",       "P"),
    ("warga05@smart-rt.id",  "warga123", "warga", "08120000005", "Riko Firmansyah",    "L"),
    ("warga06@smart-rt.id",  "warga123", "warga", "08120000006", "Fitri Handayani",    "P"),
    ("warga07@smart-rt.id",  "warga123", "warga", "08120000007", "Fajar Nugroho",      "L"),
    ("warga08@smart-rt.id",  "warga123", "warga", "08120000008", "Indah Permatasari",  "P"),
    ("warga09@smart-rt.id",  "warga123", "warga", "08120000009", "Hendra Kusuma",      "L"),
    ("warga10@smart-rt.id",  "warga123", "warga", "08120000010", "Maya Anggraini",     "P"),
    ("warga11@smart-rt.id",  "warga123", "warga", "08120000011", "Irwan Saputra",      "L"),
    ("warga12@smart-rt.id",  "warga123", "warga", "08120000012", "Linda Wulandari",    "P"),
    ("warga13@smart-rt.id",  "warga123", "warga", "08120000013", "Rizki Permana",      "L"),
    ("warga14@smart-rt.id",  "warga123", "warga", "08120000014", "Kartika Dewi",       "P"),
    ("warga15@smart-rt.id",  "warga123", "warga", "08120000015", "Teguh Santoso",      "L"),
    ("warga16@smart-rt.id",  "warga123", "warga", "08120000016", "Nisa Fauziyah",      "P"),
    ("warga17@smart-rt.id",  "warga123", "warga", "08120000017", "Wahyu Setiabudi",    "L"),
    ("warga18@smart-rt.id",  "warga123", "warga", "08120000018", "Putri Maharani",     "P"),
    ("warga19@smart-rt.id",  "warga123", "warga", "08120000019", "Kurniawan Aji",      "L"),
    ("warga20@smart-rt.id",  "warga123", "warga", "08120000020", "Retno Wulandari",    "P"),
]

ALL_LOGIN_USERS = PENGURUS_USERS + [
    (email, pw, role, phone, nama) for email, pw, role, phone, nama, _ in WARGA_LOGIN_DATA
]


def _nik(idx: int) -> str:
    return f"35780101{idx:08d}"


def _tgl_lahir(min_age: int, max_age: int) -> date:
    today = date.today()
    days_offset = RNG.randint(min_age * 365, max_age * 365)
    return today - timedelta(days=days_offset)


def _bulan_offset(offset: int):
    """Kembalikan (bulan, tahun) offset bulan ke belakang dari sekarang."""
    bln = BULAN - offset
    thn = TAHUN
    while bln <= 0:
        bln += 12
        thn -= 1
    return bln, thn


class Command(BaseCommand):
    help = "Seed sample data 150 warga / 50 KK untuk Smart-RT"

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true",
                            help="Hapus data sample dan seed ulang")

    def handle(self, *args, **options):
        if options["reset"]:
            self._reset()

        self.stdout.write(self.style.MIGRATE_HEADING("=== Seed Data Smart-RT ===\n"))

        admin_user, ketua_user = self._seed_login_users()
        self._seed_permissions()
        _, user_warga = self._seed_warga_150(admin_user)
        self._seed_pengaturan_rt(admin_user)
        self._seed_keuangan(admin_user)
        self._seed_pengumuman(admin_user, ketua_user)
        self._seed_kegiatan(admin_user, user_warga)
        self._seed_polling(admin_user, user_warga)
        self._seed_forum(admin_user, user_warga)
        self._seed_pengaduan(user_warga)
        self._seed_surat(user_warga, admin_user)

        self.stdout.write(self.style.SUCCESS("\nOK Seed data selesai!\n"))
        self.stdout.write("Akun pengurus:")
        for email, pw, role, *_ in PENGURUS_USERS:
            self.stdout.write(f"  {role:<12} {email} / {pw}")
        self.stdout.write("Akun warga (warga01–warga20@smart-rt.id / warga123)")

    # ── Reset ─────────────────────────────────────────────────────────────────

    def _reset(self):
        self.stdout.write(self.style.WARNING("Menghapus data sample lama..."))
        emails = [u[0] for u in ALL_LOGIN_USERS]
        seed_users = User.objects.filter(email__in=emails)

        # Hapus data dependen dulu sebelum user (urutan penting)
        try:
            from keuangan.models import IuranWarga, Transaksi
            from accounts.models import WargaProfile
            from kartu_keluarga.models import KartuKeluarga
            from surat.models import PermohonanSurat
            from pengaduan.models import Pengaduan
            from forum.models import Comment, Thread, ThreadVote
            from polling.models import Vote, Poll
            from kegiatan.models import RSVP, Kegiatan
            from pengumuman.models import Pengumuman

            IuranWarga.objects.filter(warga__nik__startswith="35780101").delete()
            PermohonanSurat.objects.filter(pemohon__in=seed_users).delete()
            Pengaduan.objects.filter(warga__in=seed_users).delete()
            ThreadVote.objects.filter(user__in=seed_users).delete()
            Comment.objects.filter(created_by__in=seed_users).delete()
            Vote.objects.filter(user__in=seed_users).delete()
            RSVP.objects.filter(user__in=seed_users).delete()
            WargaProfile.objects.filter(nik__startswith="35780101").delete()
            Thread.objects.filter(created_by__in=seed_users).delete()
            Poll.objects.filter(created_by__in=seed_users).delete()
            Kegiatan.objects.filter(created_by__in=seed_users).delete()
            Pengumuman.objects.filter(created_by__in=seed_users).delete()
            Transaksi.objects.filter(created_by__in=seed_users).delete()
            KartuKeluarga.objects.filter(created_by__in=seed_users).delete()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"  Sebagian data tidak terhapus: {e}"))

        seed_users.delete()
        self.stdout.write("  Data lama dihapus.")

    # ── Login Users ───────────────────────────────────────────────────────────

    def _seed_login_users(self):
        self.stdout.write("[*] Login users (6 pengurus + 20 warga)...")
        admin_user = ketua_user = None
        for email, pw, role, phone, *_ in ALL_LOGIN_USERS:
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
            if role == "admin":
                admin_user = user
            if role == "ketua_rt":
                ketua_user = user
        self.stdout.write(f"  {len(ALL_LOGIN_USERS)} user siap")
        return admin_user, ketua_user

    # ── Permissions ───────────────────────────────────────────────────────────

    def _seed_permissions(self):
        from accounts.permissions import DEFAULT_PERMISSIONS
        from accounts.models import PermissionConfig

        self.stdout.write("[*] Permissions...")
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
        self.stdout.write(f"  + {created} permission")

    # ── 150 Warga / 50 KK ────────────────────────────────────────────────────

    def _seed_warga_150(self, admin_user):
        from kartu_keluarga.models import KartuKeluarga
        from accounts.models import WargaProfile

        self.stdout.write("[*] 150 Warga / 50 KK...")

        # [4]*20 + [3]*10 + [2]*20 = 80+30+40 = 150
        kk_sizes = [4] * 20 + [3] * 10 + [2] * 20
        RNG.shuffle(kk_sizes)
        assert sum(kk_sizes) == 150

        # Map email[*]user untuk warga login
        warga_login_emails = [row[0] for row in WARGA_LOGIN_DATA]
        user_map = {u.email: u for u in User.objects.filter(email__in=warga_login_emails)}
        warga_login_cycle = iter(WARGA_LOGIN_DATA)
        warga_assigned_emails = set()

        nama_laki_cycle = self._cycle(NAMA_LAKI)
        nama_perempuan_cycle = self._cycle(NAMA_PEREMPUAN)

        kk_list = []
        user_warga = []
        nik_counter = 1

        for kk_idx, size in enumerate(kk_sizes, start=1):
            no_kk = f"35780101{kk_idx:08d}"
            blok = BLOK[kk_idx % len(BLOK)]
            no_rumah = str((kk_idx % 25) + 1)
            alamat_kk = f"Jl. Lingkungan Blok {blok} No. {no_rumah}, RT 04/RW 03"

            kk, _ = KartuKeluarga.objects.get_or_create(
                no_kk=no_kk,
                defaults={"alamat": alamat_kk, "created_by": admin_user},
            )
            kk_list.append(kk)

            for slot in range(size):
                if slot == 0:
                    hubungan = "kepala_keluarga"
                    jk = "L"
                elif slot == 1 and RNG.random() < 0.85:
                    hubungan = "istri"
                    jk = "P"
                elif slot == 1:
                    hubungan = "anak"
                    jk = RNG.choice(["L", "P"])
                else:
                    hubungan = "anak"
                    jk = RNG.choice(["L", "P"])

                # Tentukan rentang usia berdasarkan hubungan
                if hubungan == "kepala_keluarga":
                    tgl_lahir = _tgl_lahir(28, 65)
                elif hubungan == "istri":
                    tgl_lahir = _tgl_lahir(25, 60)
                else:
                    tgl_lahir = _tgl_lahir(1, 30)

                # Cek apakah ada akun warga yang belum di-assign ke profil ini
                linked_user = None
                nama = None
                try:
                    next_warga = next(warga_login_cycle)
                    w_email, _, _, _, w_nama, w_jk = next_warga
                    if w_email not in warga_assigned_emails:
                        linked_user = user_map.get(w_email)
                        nama = w_nama
                        jk = w_jk
                        warga_assigned_emails.add(w_email)
                        if hubungan != "kepala_keluarga":
                            hubungan = "kepala_keluarga" if w_jk == "L" else "istri"
                except StopIteration:
                    pass

                if nama is None:
                    if jk == "L":
                        nama = next(nama_laki_cycle)
                    else:
                        nama = next(nama_perempuan_cycle)

                nik = _nik(nik_counter)
                nik_counter += 1

                status_perkawinan = (
                    "kawin" if hubungan in ("kepala_keluarga", "istri") else
                    "belum_kawin" if (date.today().year - tgl_lahir.year) < 20 else
                    RNG.choice(["belum_kawin", "kawin"])
                )

                WargaProfile.objects.get_or_create(
                    nik=nik,
                    defaults={
                        "user": linked_user,
                        "nama_lengkap": nama,
                        "tempat_lahir": RNG.choice(KOTA_LAHIR),
                        "tanggal_lahir": tgl_lahir,
                        "jenis_kelamin": jk,
                        "agama": RNG.choice(AGAMA),
                        "status_perkawinan": status_perkawinan,
                        "pekerjaan": RNG.choice(PEKERJAAN),
                        "kartu_keluarga": kk,
                        "hubungan_keluarga": hubungan,
                        "alamat": alamat_kk,
                        "blok": blok,
                        "no_rumah": no_rumah,
                        "status": "aktif",
                    },
                )

                if linked_user and linked_user not in user_warga:
                    user_warga.append(linked_user)

        # Pastikan semua warga yang belum di-assign masuk ke user_warga
        for email in warga_login_emails:
            u = user_map.get(email)
            if u and u not in user_warga:
                user_warga.append(u)

        self.stdout.write(f"  + {WargaProfile.objects.filter(nik__startswith='35780101').count()} "
                          f"profil warga, 50 KK, {len(user_warga)} akun warga aktif")
        return kk_list, user_warga

    def _cycle(self, lst):
        """Infinite cycle iterator."""
        i = 0
        while True:
            yield lst[i % len(lst)]
            i += 1

    # ── Pengaturan RT ─────────────────────────────────────────────────────────

    def _seed_pengaturan_rt(self, admin_user):
        from surat.models import PengaturanRT

        self.stdout.write("[*] Pengaturan RT...")
        obj = PengaturanRT.get_instance()
        if not obj.nama_ketua_rt:
            obj.nama_rt = "RT 04"
            obj.nama_rw = "RW 03"
            obj.kelurahan = "Kel. Keputran"
            obj.kecamatan = "Kec. Tegalsari"
            obj.kota = "Kota Surabaya"
            obj.provinsi = "Jawa Timur"
            obj.kode_pos = "60265"
            obj.nama_ketua_rt = "Suharto Wibowo"
            obj.nik_ketua_rt = "3578010101000002"
            obj.updated_by = admin_user
            obj.save()
            self.stdout.write("  + Pengaturan RT dikonfigurasi")
        else:
            self.stdout.write("  - Pengaturan RT sudah ada")

    # ── Keuangan ─────────────────────────────────────────────────────────────

    def _seed_keuangan(self, admin_user):
        from keuangan.models import KategoriTransaksi, Transaksi, JenisIuran, PengaturanIuran, IuranWarga
        from accounts.models import WargaProfile

        self.stdout.write("[*] Keuangan (kategori, transaksi 6 bulan, iuran 3 jenis)...")

        # ── Kategori transaksi ──
        KATEGORI = [
            ("Iuran Bulanan Warga",      "pemasukan"),
            ("Iuran Keamanan Warga",     "pemasukan"),
            ("Iuran Kebersihan Warga",   "pemasukan"),
            ("Kas Masuk",                "pemasukan"),
            ("Sumbangan / Donasi",       "pemasukan"),
            ("Dana Hibah / Bantuan",     "pemasukan"),
            ("Pendapatan Lain",          "pemasukan"),
            ("Operasional RT",           "pengeluaran"),
            ("Kegiatan Warga",           "pengeluaran"),
            ("Kebersihan & Lingkungan",  "pengeluaran"),
            ("Keamanan Lingkungan",      "pengeluaran"),
            ("Perbaikan Fasilitas",      "pengeluaran"),
            ("Administrasi & ATK",       "pengeluaran"),
            ("Sosial & Kemasyarakatan",  "pengeluaran"),
            ("Pengeluaran Lain",         "pengeluaran"),
        ]
        kat_map = {}
        for nama, tipe in KATEGORI:
            kat, _ = KategoriTransaksi.objects.get_or_create(nama=nama, tipe=tipe)
            kat_map[(nama, tipe)] = kat

        # ── Jenis Iuran ──
        jenis_bulanan, _ = JenisIuran.objects.get_or_create(slug="iuran-bulanan", defaults={
            "nama": "Iuran Bulanan", "tipe": "wajib", "unit": "per_kk",
            "nominal": 50000, "keterangan": "Iuran wajib bulanan per KK", "is_active": True, "urutan": 1,
        })
        jenis_keamanan, _ = JenisIuran.objects.get_or_create(slug="iuran-keamanan", defaults={
            "nama": "Iuran Keamanan", "tipe": "wajib", "unit": "per_kk",
            "nominal": 15000, "keterangan": "Iuran keamanan lingkungan per KK", "is_active": True, "urutan": 2,
        })
        jenis_kebersihan, _ = JenisIuran.objects.get_or_create(slug="iuran-kebersihan", defaults={
            "nama": "Iuran Kebersihan", "tipe": "opsional", "unit": "per_kk",
            "nominal": 20000, "keterangan": "Iuran kebersihan lingkungan (opsional)", "is_active": True, "urutan": 3,
        })

        PengaturanIuran.get_instance()

        # ── Transaksi 6 bulan ──
        TRANSAKSI_DATA = [
            # (kat_key, tipe, keterangan_template, jumlah_fn)
            (("Iuran Bulanan Warga", "pemasukan"), "pemasukan",
             "Pemasukan iuran bulanan bulan {bln}/{thn}", lambda: 50000 * RNG.randint(40, 50)),
            (("Iuran Keamanan Warga", "pemasukan"), "pemasukan",
             "Pemasukan iuran keamanan bulan {bln}/{thn}", lambda: 15000 * RNG.randint(38, 50)),
            (("Iuran Kebersihan Warga", "pemasukan"), "pemasukan",
             "Pemasukan iuran kebersihan bulan {bln}/{thn}", lambda: 20000 * RNG.randint(25, 45)),
            (("Kebersihan & Lingkungan", "pengeluaran"), "pengeluaran",
             "Biaya kebersihan dan petugas sampah bulan {bln}/{thn}", lambda: RNG.randint(4, 8) * 100000),
            (("Keamanan Lingkungan", "pengeluaran"), "pengeluaran",
             "Biaya jaga malam dan keamanan bulan {bln}/{thn}", lambda: RNG.randint(3, 6) * 100000),
            (("Operasional RT", "pengeluaran"), "pengeluaran",
             "Biaya operasional RT bulan {bln}/{thn}", lambda: RNG.randint(1, 3) * 100000),
        ]
        TAMBAHAN_TRANSAKSI = [
            # Transaksi tidak rutin — hanya bulan tertentu
            (("Sumbangan / Donasi", "pemasukan"), "pemasukan",
             "Donasi warga untuk pembangunan taman", 2500000),
            (("Perbaikan Fasilitas", "pengeluaran"), "pengeluaran",
             "Perbaikan lampu jalan Blok B dan C", 1800000),
            (("Kegiatan Warga", "pengeluaran"), "pengeluaran",
             "Biaya konsumsi rapat warga bulanan", 350000),
            (("Sosial & Kemasyarakatan", "pengeluaran"), "pengeluaran",
             "Santunan kepada warga lansia tidak mampu", 750000),
            (("Dana Hibah / Bantuan", "pemasukan"), "pemasukan",
             "Dana hibah dari kelurahan untuk kegiatan HUT RI", 5000000),
            (("Administrasi & ATK", "pengeluaran"), "pengeluaran",
             "Pembelian ATK dan kebutuhan administrasi RT", 280000),
            (("Kegiatan Warga", "pengeluaran"), "pengeluaran",
             "Biaya lomba 17 Agustus warga RT", 3200000),
            (("Perbaikan Fasilitas", "pengeluaran"), "pengeluaran",
             "Perbaikan pos ronda dan pengecatan pagar", 2100000),
        ]

        tx_created = 0
        for offset in range(6):
            bln, thn = _bulan_offset(offset)
            tgl_masuk = date(thn, bln, 10)
            tgl_keluar = date(thn, bln, 25)

            for kat_key, tx_tipe, keterangan_tpl, jumlah_fn in TRANSAKSI_DATA:
                kat = kat_map[kat_key]
                tgl = tgl_masuk if tx_tipe == "pemasukan" else tgl_keluar
                keterangan = keterangan_tpl.format(bln=bln, thn=thn)
                _, is_new = Transaksi.objects.get_or_create(
                    kategori=kat, tanggal=tgl, tipe=tx_tipe, keterangan=keterangan,
                    defaults={"jumlah": jumlah_fn(), "status": "confirmed", "created_by": admin_user},
                )
                if is_new:
                    tx_created += 1

        # Tambahan transaksi di bulan-bulan tertentu
        for i, (kat_key, keterangan, jumlah) in enumerate(
                (k, c, j) for k, _, c, j in TAMBAHAN_TRANSAKSI):
            kat = kat_map[kat_key]
            tipe = kat_key[1]
            bln, thn = _bulan_offset(i % 6)
            tgl = date(thn, bln, 15 + (i % 5))
            _, is_new = Transaksi.objects.get_or_create(
                kategori=kat, tipe=tipe, keterangan=keterangan,
                defaults={"tanggal": tgl, "jumlah": jumlah, "status": "confirmed", "created_by": admin_user},
            )
            if is_new:
                tx_created += 1

        self.stdout.write(f"  + {tx_created} transaksi")

        # ── Iuran 6 bulan per KK ──
        kepala_kk_qs = list(
            __import__("accounts").models.WargaProfile.objects
            .filter(hubungan_keluarga="kepala_keluarga", is_deleted=False)
            .select_related("kartu_keluarga")
            .order_by("id")[:50]
        )

        iuran_created = 0
        for i, profile in enumerate(kepala_kk_qs):
            for offset in range(6):
                bln, thn = _bulan_offset(offset)
                # Realistis: 10% pending bulan terkini, sisanya lunas
                is_pending = (offset == 0 and RNG.random() < 0.15)

                for jenis in [jenis_bulanan, jenis_keamanan, jenis_kebersihan]:
                    # Kebersihan opsional: 70% KK bayar
                    if jenis == jenis_kebersihan and RNG.random() > 0.70:
                        continue
                    status = "pending" if (is_pending and offset == 0) else "lunas"
                    _, is_new = IuranWarga.objects.get_or_create(
                        warga=profile, jenis=jenis, bulan=bln, tahun=thn,
                        defaults={
                            "jumlah": int(jenis.nominal),
                            "status": status,
                            "confirmed_by": admin_user if status == "lunas" else None,
                            "confirmed_at": timezone.now() if status == "lunas" else None,
                        },
                    )
                    if is_new:
                        iuran_created += 1

        self.stdout.write(f"  + {iuran_created} record iuran")

    # ── Pengumuman ────────────────────────────────────────────────────────────

    def _seed_pengumuman(self, admin_user, ketua_user):
        from pengumuman.models import Pengumuman

        self.stdout.write("[*] 40 Pengumuman...")

        DATA = [
            # (judul, isi, kategori, is_published)
            ("Rapat Warga Bulanan — Agenda Penting", "Diinformasikan kepada seluruh warga RT 04 RW 03 bahwa akan diadakan rapat warga bulanan pada Sabtu mendatang pukul 19.00 WIB di Balai RT. Agenda: laporan keuangan, evaluasi kegiatan, dan rencana ke depan. Kehadiran kepala keluarga sangat diharapkan.", "acara", True),
            ("Peringatan Keamanan — Waspada Modus Baru", "Kepada seluruh warga, harap waspada terhadap modus penipuan baru yang berkeliaran di lingkungan RT. Jangan mudah percaya pada orang asing yang mengaku petugas. Segera laporkan ke RT jika ada hal mencurigakan.", "keamanan", True),
            ("Jadwal Pengangkutan Sampah Terbaru", "Mulai bulan ini, jadwal pengangkutan sampah berubah: Senin, Rabu, dan Jumat pukul 06.00 WIB. Harap letakkan sampah di depan rumah sebelum pukul 06.00. Sampah yang tidak diletakkan tepat waktu tidak akan diangkut.", "info", True),
            ("Gotong Royong Bersih Lingkungan", "Agenda gotong royong membersihkan saluran air, taman, dan area umum dijadwalkan Minggu pagi pukul 07.00 WIB. Setiap rumah tangga wajib mengirimkan minimal 1 perwakilan. Bawa peralatan kebersihan masing-masing.", "acara", True),
            ("Reminder Pembayaran Iuran RT Bulan Ini", "Kepada seluruh warga, harap segera melunasi iuran RT (bulanan Rp50.000, keamanan Rp15.000, kebersihan Rp20.000) paling lambat tanggal 20. Pembayaran melalui aplikasi Smart-RT atau langsung ke bendahara RT.", "penting", True),
            ("Peresmian Taman RT 04 yang Baru Direnovasi", "Dengan bangga kami umumkan peresmian taman RT 04 yang telah selesai direnovasi. Taman kini dilengkapi bangku, lampu taman, dan area bermain anak. Peresmian akan dilakukan Sabtu ini pukul 10.00 bersama seluruh warga.", "acara", True),
            ("Pemasangan CCTV di Gerbang Utama", "RT 04 telah berhasil memasang 3 unit kamera CCTV di gerbang utama, gerbang belakang, dan area parkir. Rekaman tersimpan 30 hari. Untuk keperluan pemutaran rekaman, hubungi ketua RT.", "info", True),
            ("Pemadaman Listrik Terjadwal", "PLN akan melakukan pemeliharaan jaringan listrik pada hari Kamis pukul 08.00–16.00. Mohon mempersiapkan kebutuhan listrik cadangan. Maaf atas ketidaknyamanan ini.", "penting", True),
            ("Seleksi Anggota Karang Taruna RT", "Dibuka pendaftaran anggota Karang Taruna RT 04 periode baru. Syarat: warga RT, usia 17-35 tahun, aktif dan bersemangat. Daftar melalui aplikasi atau hubungi sekretaris RT.", "acara", True),
            ("Laporan Keuangan RT Triwulan I", "Berikut ringkasan keuangan RT 04 triwulan I: Total pemasukan Rp8.250.000, pengeluaran Rp6.180.000, saldo Rp2.070.000. Laporan lengkap dapat dilihat di papan pengumuman balai RT atau melalui menu Keuangan di aplikasi.", "info", True),
            ("Bazar Ramadhan RT 04", "Dalam rangka menyambut bulan suci Ramadhan, RT 04 akan mengadakan bazar Ramadhan pada akhir pekan ini mulai pukul 15.00 sampai 21.00 di Jl. Lingkungan. Terbuka untuk umum. Tersedia berbagai takjil, kuliner, dan produk UMKM warga.", "acara", True),
            ("Waspada Nyamuk DBD — Fogging Dijadwalkan", "Mengingat meningkatnya kasus DBD di lingkungan, RT 04 akan melakukan fogging pada hari Sabtu pagi pukul 08.00. Harap tutup makanan dan minuman, keluar sementara selama proses berlangsung. PSN 3M Plus tetap dilaksanakan rutin.", "keamanan", True),
            ("Pemilihan Ketua RT Periode 2025–2028", "Masa jabatan ketua RT akan berakhir pada Desember 2025. Panitia pemilihan dibentuk dan proses nominasi dimulai. Warga yang ingin mencalonkan diri atau mengusulkan calon dapat menghubungi sekretaris RT.", "penting", True),
            ("Kebersihan Saluran Air — Gotong Royong", "Saluran air di Blok C dan D mulai tersumbat. Gotong royong pembersihan saluran akan dilaksanakan Minggu ini pukul 07.00 dengan melibatkan semua warga Blok C dan D. Mohon kehadiran dan partisipasinya.", "acara", True),
            ("Pendataan Warga Pendatang Baru", "Kepada seluruh warga yang memiliki tamu, kontrakan, atau anggota keluarga baru yang tinggal di RT 04, harap segera melaporkan ke RT untuk proses pendataan dan administrasi. Prosedur lengkap tersedia di aplikasi Smart-RT.", "info", True),
            ("Imunisasi Gratis untuk Balita", "Posyandu RT 04 akan mengadakan imunisasi gratis untuk balita 0-5 tahun pada Selasa pukul 09.00–11.00 di Posyandu Blok A. Bawa KMS dan KTP orang tua. Terbatas untuk 50 balita pertama.", "info", True),
            ("Perbaikan Jalan Lingkungan Blok A", "Perbaikan jalan berlubang di Blok A (depan No. 5–12) akan dimulai Senin minggu depan selama 3 hari. Mohon warga Blok A bersabar dan mencari jalur alternatif sementara.", "penting", True),
            ("Jadwal Ronda Malam — Siklus Baru", "Siklus piket ronda malam untuk bulan ini telah diperbarui. Jadwal dapat dilihat di papan pengumuman atau melalui grup WhatsApp RT. Warga yang mendapat giliran harap hadir tepat waktu pukul 22.00.", "keamanan", True),
            ("Bantuan Sembako untuk Warga Tidak Mampu", "RT 04 mendistribusikan bantuan sembako dari Kelurahan untuk 15 KK yang terdaftar sebagai penerima manfaat. Pengambilan dilakukan di Balai RT pada Sabtu pukul 09.00–11.00 dengan membawa KTP dan KK.", "penting", True),
            ("Sistem Pengaduan Online Kini Aktif", "Smart-RT kini dilengkapi fitur pengaduan online. Warga dapat melaporkan masalah infrastruktur, keamanan, kebersihan, dan sosial melalui menu Pengaduan di aplikasi. Setiap laporan akan ditindaklanjuti dalam 3x24 jam.", "info", True),
            ("Perlombaan HUT RI ke-80 — Daftar Sekarang!", "Dalam rangka memperingati HUT RI ke-80, RT 04 menyelenggarakan berbagai lomba seru: balap karung, makan kerupuk, tarik tambang, dan lomba memasak. Pendaftaran dibuka hingga H-3. Daftar melalui aplikasi atau hubungi panitia.", "acara", True),
            ("Perawatan Lampu Jalan Blok B dan D", "Petugas PLN akan melakukan perawatan dan penggantian lampu jalan yang mati di Blok B (3 titik) dan Blok D (2 titik) pada Rabu pagi. Pekerjaan diperkirakan selesai dalam 1 hari.", "info", True),
            ("Sosialisasi Aplikasi Smart-RT", "Bagi warga yang belum familiar dengan aplikasi Smart-RT, akan diadakan sosialisasi pada Minggu pukul 10.00 di Balai RT. Dibantu oleh tim pengurus RT. Bawa smartphone dan pastikan sudah terinstall aplikasinya.", "acara", True),
            ("Peningkatan Keamanan — Kunci Ganda Gerbang", "Mulai pekan depan, gerbang utama akan dikunci ganda mulai pukul 22.00–05.00. Warga yang pulang larut malam harap menghubungi petugas jaga ronda melalui nomor yang tertera di papan pengumuman.", "keamanan", True),
            ("Rapat Koordinasi Pengurus RT", "Pengurus RT akan mengadakan rapat koordinasi internal pada Jumat malam pukul 20.00 di rumah Ketua RT. Agenda: evaluasi bulan berjalan dan perencanaan program. Khusus untuk anggota pengurus.", "info", False),
            ("Iuran Suka Cita — Kelahiran dan Pernikahan", "Diinformasikan bahwa iuran suka cita sebesar Rp20.000/KK akan dikumpulkan untuk warga yang baru menikah dan melahirkan bulan ini. Pengumpulan oleh perwakilan per blok mulai Senin.", "info", True),
            ("Pembuatan E-KTP — Jadwal Mobile", "Dinas Kependudukan akan hadir di Balai RT pada hari Kamis pukul 09.00–14.00 untuk layanan pembuatan E-KTP, KK, dan akte kelahiran secara mobile. Bawa dokumen persyaratan.", "penting", True),
            ("Buka Puasa Bersama Warga RT 04", "Menyambut Ramadhan, RT 04 mengadakan buka puasa bersama pada hari ke-15 Ramadhan di Masjid Al-Ikhlas Blok A pukul 17.30. Mohon warga berpartisipasi membawa makanan berbagi.", "acara", True),
            ("Laporan Realisasi Kegiatan Bulan Lalu", "Laporan kegiatan bulan lalu: 1 rapat warga (dihadiri 35 KK), 1 gotong royong (120 peserta), 1 fogging DBD. Program berjalan lancar. Terima kasih atas partisipasi seluruh warga.", "info", True),
            ("Penertiban Parkir Kendaraan di Gang", "Beberapa warga mengeluhkan kendaraan yang diparkir sembarangan di gang sehingga mengganggu lalu lintas. Mohon kepada pemilik kendaraan untuk memarkirkan kendaraan di area yang telah disediakan.", "penting", True),
            ("Subsidi Internet RT — Wifi Bersama", "RT 04 berencana memasang wifi bersama di area balai RT dan taman. Biaya akan ditanggung bersama. Warga yang berminat agar mengisi formulir di aplikasi sebelum Jumat.", "info", True),
            ("Peringatan Bahaya Kebakaran", "Memasuki musim kemarau, risiko kebakaran meningkat. Pastikan instalasi listrik terpelihara, matikan kompor sebelum keluar rumah, dan simpan nomor pemadam kebakaran. APAR tersedia di pos ronda.", "keamanan", True),
            ("Pengajian Rutin Warga — Minggu Ke-2", "Pengajian rutin warga RT 04 dilaksanakan setiap minggu ke-2 setiap bulan di masjid. Bulan ini pada hari Ahad pukul 08.00. Terbuka untuk seluruh warga dan keluarga.", "acara", True),
            ("Penyuluhan Kesehatan Gratis", "Puskesmas Kecamatan akan mengadakan penyuluhan dan pemeriksaan kesehatan gratis (tensi, gula darah, kolesterol) di Balai RT pada Senin pukul 09.00. Khusus untuk warga 40 tahun ke atas.", "info", True),
            ("Insentif Warga Aktif Bayar Iuran Tepat Waktu", "Mulai bulan ini, RT menerapkan program penghargaan: warga yang membayar semua iuran tepat waktu selama 3 bulan berturut-turut mendapatkan stiker bintang dan diumumkan di papan RT.", "penting", True),
            ("Kolam Retensi — Rencana Pembangunan", "Kelurahan berencana membangun kolam retensi di lahan kosong belakang RT untuk mencegah banjir. Warga diundang memberikan masukan melalui menu Polling di aplikasi Smart-RT.", "info", True),
            ("Lomba Kebersihan Antar Blok", "RT 04 mengadakan lomba kebersihan dan keindahan antar blok selama satu bulan ke depan. Penilaian meliputi kebersihan jalan depan rumah, penghijauan, dan pengelolaan sampah. Pemenang mendapat hadiah menarik.", "acara", True),
            ("Layanan Pengambilan Surat — Jam Operasional", "Layanan pengambilan surat keterangan RT kini dapat dilakukan melalui aplikasi Smart-RT. Proses persetujuan 1x24 jam kerja. Surat dapat diunduh langsung dari aplikasi setelah disetujui.", "info", True),
            ("Antisipasi Banjir — Cek Saluran Air", "Memasuki musim hujan, warga dimohon untuk secara rutin memeriksa dan membersihkan saluran air di sekitar rumah. RT akan mengadakan pembersihan saluran utama bersama pada Sabtu ini.", "keamanan", True),
            ("Apresiasi Warga Berprestasi RT 04", "RT 04 bangga mengumumkan 3 warga berprestasi bulan ini: siswa berprestasi tingkat kota, ibu PKK teladan, dan pemuda wirausaha sukses. Selamat dan semoga menjadi inspirasi bagi seluruh warga.", "info", True),
        ]

        penulis = [admin_user, ketua_user]
        created = 0
        for i, (judul, isi, kategori, is_published) in enumerate(DATA):
            _, is_new = Pengumuman.objects.get_or_create(
                judul=judul,
                defaults={
                    "isi": isi,
                    "kategori": kategori,
                    "is_published": is_published,
                    "created_by": penulis[i % 2],
                },
            )
            if is_new:
                created += 1
        self.stdout.write(f"  + {created} pengumuman")

    # ── Kegiatan ──────────────────────────────────────────────────────────────

    def _seed_kegiatan(self, admin_user, user_warga):
        from kegiatan.models import Kegiatan, RSVP

        self.stdout.write("[*] 25 Kegiatan...")
        now = timezone.now()

        DATA = [
            # (nama, delta_hari, lokasi, kuota)
            ("Rapat Warga Bulanan",                  7,   "Balai RT 04",             None),
            ("Gotong Royong Saluran Air Blok C",     14,  "Blok C & D",              None),
            ("Peringatan HUT RI ke-80 — Upacara",    62,  "Lapangan RT",             None),
            ("Lomba 17-an Warga RT 04",              63,  "Lapangan RT",             None),
            ("Bazar Ramadhan RT 04",                 30,  "Jl. Lingkungan Utama",    None),
            ("Pemilihan Ketua RT Baru",              90,  "Balai RT 04",             100),
            ("Pengajian & Ceramah Agama",            10,  "Masjid Al-Ikhlas Blok A", None),
            ("Senam Pagi Bersama Warga",             3,   "Depan Pos Ronda",         50),
            ("Sosialisasi Aplikasi Smart-RT",        20,  "Balai RT 04",             30),
            ("Penyuluhan Kesehatan Gratis",          25,  "Balai RT 04",             None),
            ("Buka Puasa Bersama Ramadhan",          45,  "Masjid Al-Ikhlas Blok A", None),
            ("Peresmian Taman RT 04",                5,   "Taman RT 04",             None),
            ("Lomba Kebersihan Antar Blok",          60,  "Seluruh lingkungan RT",   None),
            ("Fogging DBD Lingkungan RT",            2,   "Seluruh RT 04",           None),
            ("Rapat Koordinasi Pengurus RT",         4,   "Rumah Ketua RT",          10),
            ("Santunan Lansia & Anak Yatim",         35,  "Balai RT 04",             None),
            ("Workshop Kewirausahaan Warga",         50,  "Balai RT 04",             40),
            ("Turnamen Olahraga Warga",              70,  "Lapangan RT",             None),
            # Kegiatan masa lalu
            ("Rapat Warga Bulanan (Bulan Lalu)",    -30,  "Balai RT 04",             None),
            ("Gotong Royong Bersih Lingkungan",     -45,  "Seluruh lingkungan RT",   None),
            ("Pemeriksaan Kesehatan Gratis",        -20,  "Balai RT 04",             None),
            ("Bazar Produk UMKM Warga",             -60,  "Jl. Lingkungan Utama",    None),
            ("Sosialisasi Keamanan Lingkungan",     -15,  "Balai RT 04",             None),
            ("Pelatihan P3K Warga",                 -90,  "Balai RT 04",             25),
            ("Malam Kesenian Warga RT 04",          -10,  "Lapangan RT",             None),
        ]

        created = 0
        for nama, delta, lokasi, kuota in DATA:
            tgl = now + timedelta(days=delta)
            keg, is_new = Kegiatan.objects.get_or_create(
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
                # RSVP dari sebagian warga
                n_rsvp = RNG.randint(3, min(len(user_warga), 15))
                sample = RNG.sample(user_warga, n_rsvp)
                statuses = ["hadir"] * (n_rsvp // 2 + 1) + ["masih_ragu"] * (n_rsvp // 2) + ["tidak_hadir"]
                for j, u in enumerate(sample):
                    RSVP.objects.get_or_create(
                        kegiatan=keg, user=u,
                        defaults={"status": statuses[j % len(statuses)]},
                    )

        self.stdout.write(f"  + {created} kegiatan")

    # ── Polling ───────────────────────────────────────────────────────────────

    def _seed_polling(self, admin_user, user_warga):
        from polling.models import Poll, Vote

        self.stdout.write("[*] 30 Polling...")
        now = timezone.now()

        DATA = [
            # (pertanyaan, [opsi], delta_hari_deadline)
            ("Kapan waktu terbaik rapat warga bulanan?",
             ["Sabtu pagi (08.00–10.00)", "Sabtu malam (19.00–21.00)", "Minggu pagi (08.00–10.00)", "Minggu sore (16.00–18.00)"], 7),
            ("Kegiatan apa yang paling diinginkan untuk HUT RI ke-80?",
             ["Lomba 17-an klasik", "Pentas seni & hiburan", "Turnamen olahraga", "Kerja bakti + tasyakuran"], 30),
            ("Bagaimana penilaian warga terhadap kondisi taman RT saat ini?",
             ["Sudah sangat baik", "Baik tapi perlu sedikit perbaikan", "Perlu renovasi menyeluruh"], -3),
            ("Apakah warga setuju dengan pemasangan CCTV tambahan di gang?",
             ["Sangat setuju", "Setuju", "Tidak setuju", "Perlu dibahas lebih lanjut"], 14),
            ("Frekuensi gotong royong yang ideal?",
             ["Setiap minggu", "2 minggu sekali", "1 bulan sekali", "Kondisional saja"], -7),
            ("Sistem pembayaran iuran yang lebih disukai?",
             ["Transfer bank / dompet digital", "Bayar langsung ke bendahara", "Melalui aplikasi Smart-RT"], 21),
            ("Perlukah RT memiliki grup WhatsApp resmi khusus pengumuman?",
             ["Ya, sangat perlu", "Sudah cukup dengan aplikasi Smart-RT", "Tidak perlu"], 5),
            ("Apakah perlu menambah jam operasional pos ronda?",
             ["Ya, tambah sampai subuh", "Cukup sampai jam 02.00", "Tidak perlu perubahan"], 10),
            ("Prioritas penggunaan kas RT saat ini?",
             ["Perbaikan jalan dan infrastruktur", "Kegiatan sosial warga", "Keamanan lingkungan", "Tabungan kas darurat"], 15),
            ("Seberapa puas Anda dengan pelayanan pengurus RT?",
             ["Sangat puas", "Puas", "Cukup puas", "Belum puas"], -14),
            ("Apakah RT perlu membuat koperasi simpan pinjam warga?",
             ["Ya, sangat mendukung", "Perlu dikaji lebih dalam", "Tidak perlu"], 45),
            ("Jenis tanaman apa yang cocok untuk taman RT?",
             ["Tanaman bunga & hias", "Tanaman buah", "Tanaman obat (toga)", "Kombinasi ketiganya"], 20),
            ("Apakah perlu diadakan kelas belajar bersama untuk anak-anak RT?",
             ["Ya, sangat diperlukan", "Perlu, tapi bergantung anggaran", "Tidak diperlukan"], 30),
            ("Model kegiatan olahraga yang diminati warga?",
             ["Senam pagi rutin", "Futsal / badminton", "Jalan sehat bersama", "Semua jenis bergantian"], -5),
            ("Apakah warga mendukung pembuatan kolam retensi untuk cegah banjir?",
             ["Sangat mendukung", "Mendukung dengan syarat", "Tidak mendukung", "Abstain"], 25),
            ("Bagaimana pendapat Anda tentang aplikasi Smart-RT?",
             ["Sangat membantu", "Cukup membantu", "Biasa saja", "Perlu banyak perbaikan"], -10),
            ("Waktu pelaksanaan fogging DBD yang ideal?",
             ["Pagi hari (07.00–09.00)", "Siang hari (11.00–13.00)", "Sore hari (16.00–18.00)"], 7),
            ("Perlukah RT mengadakan bazar UMKM rutin bulanan?",
             ["Ya, sangat mendukung", "Perlu, tapi 3 bulanan saja", "Tidak perlu"], 40),
            ("Apakah warga setuju iuran kebersihan dinaikkan untuk penambahan petugas?",
             ["Setuju naik Rp5.000", "Setuju naik Rp10.000", "Tidak setuju naik"], 10),
            ("Fasilitas umum apa yang paling mendesak diperbaiki?",
             ["Jalan berlubang", "Lampu jalan yang mati", "Drainase / selokan", "Pos ronda"], 20),
            ("Apakah perlu mengadakan lomba kebersihan antar blok setiap bulan?",
             ["Ya, perlu rutin", "Cukup 3 bulan sekali", "Hanya saat event tertentu"], 15),
            ("Seberapa sering Anda menggunakan aplikasi Smart-RT dalam sebulan?",
             ["Setiap hari", "2–3 kali seminggu", "1–2 kali sebulan", "Jarang sekali"], -20),
            ("Apakah perlu diadakan pelatihan keterampilan untuk ibu rumah tangga?",
             ["Sangat perlu", "Perlu", "Tidak perlu"], 35),
            ("Preferensi menu buka puasa bersama Ramadhan?",
             ["Masakan khas Jawa Timur", "Aneka gorengan & takjil", "Nasi kotak + lauk pauk", "Potluck (warga bawa sendiri)"], 45),
            ("Perlukah RT menyediakan APAR tambahan di tiap blok?",
             ["Ya, sangat perlu", "Perlu, tapi butuh sosialisasi", "Tidak perlu"], 25),
            ("Jam berapa batas keributan / kebisingan malam yang disepakati warga?",
             ["Pukul 21.00", "Pukul 22.00", "Pukul 23.00"], -15),
            ("Apakah RT perlu memiliki media sosial resmi (Instagram/Facebook)?",
             ["Ya, sangat perlu", "Cukup dengan aplikasi Smart-RT saja", "Tidak perlu"], 30),
            ("Model pengawasan keamanan yang paling efektif?",
             ["CCTV + pos ronda", "Ronda malam warga", "Satpam profesional", "Kombinasi"], 20),
            ("Perlukah dibuat aturan tertulis soal parkir di gang?",
             ["Ya, perlu dibuat peraturan tertulis", "Cukup imbauan lisan", "Tidak perlu aturan"], 10),
            ("Apakah Anda puas dengan transparansi laporan keuangan RT?",
             ["Sangat puas", "Puas", "Cukup puas", "Belum puas, perlu lebih detail"], -30),
        ]

        created = 0
        for pertanyaan, opsi, delta in DATA:
            deadline = now + timedelta(days=delta)
            poll, is_new = Poll.objects.get_or_create(
                pertanyaan=pertanyaan,
                defaults={"opsi": opsi, "deadline": deadline, "created_by": admin_user},
            )
            if is_new:
                created += 1
                # Tambah votes dari user_warga
                n_votes = RNG.randint(5, len(user_warga))
                voters = RNG.sample(user_warga, n_votes)
                for u in voters:
                    Vote.objects.get_or_create(
                        poll=poll, user=u,
                        defaults={"opsi_index": RNG.randint(0, len(opsi) - 1)},
                    )

        self.stdout.write(f"  + {created} polling")

    # ── Forum ─────────────────────────────────────────────────────────────────

    def _seed_forum(self, admin_user, user_warga):
        from forum.models import Thread, Comment

        self.stdout.write("[*] 25 Thread Forum...")

        DATA = [
            # (judul, isi, kategori, [(komentar, uid_index)])
            ("Usul pemasangan CCTV tambahan di gang sempit",
             "Gang di Blok C dan D sangat gelap dan sering terjadi kejadian mencurigakan. Saya usul pemasangan CCTV dan lampu jalan tambahan. Bagaimana pendapat warga lain?",
             "keamanan",
             [("Saya sangat setuju. Kemarin ada motor asing yang mondar-mandir sampai larut malam.", 0),
              ("Perlu dibahas soal anggaran dan siapa yang bertanggung jawab mengelolanya.", 1),
              ("Setuju! Keamanan adalah prioritas utama. Kami siap iuran tambahan.", 2)]),
            ("Jadwal piket ronda malam perlu diaktifkan kembali?",
             "Dalam beberapa bulan terakhir piket ronda malam tidak berjalan. Kondisi keamanan lingkungan mulai mengkhawatirkan. Bagaimana pendapat warga tentang mengaktifkannya kembali?",
             "keamanan",
             [("Setuju banget. Saya dan tetangga siap ikut ronda setiap Senin dan Kamis.", 3),
              ("Perlu ada koordinator yang tegas agar tidak terjadi mangkir.", 4)]),
            ("Usul tempat sampah pilah di setiap blok",
             "Bagaimana kalau kita usulkan tempat sampah pilah (organik dan anorganik) di tiap blok? Lebih ramah lingkungan dan membantu petugas kebersihan.",
             "usul",
             [("Ide yang bagus! Bisa mengajukan ke kelurahan untuk bantuan tempat sampah.", 5),
              ("Perlu sosialisasi dulu ke semua warga agar mau memilah sampah dari rumah.", 0)]),
            ("Kondisi saluran air Blok B — perlu perhatian",
             "Saluran air di depan Blok B No. 8–15 mulai mampet dan menimbulkan bau. Sudah saya laporkan tapi belum ada tindakan. Mohon pengurus RT segera menindaklanjuti.",
             "kebersihan",
             [("Iya, saya juga merasakan. Saat hujan air meluap ke jalan.", 1),
              ("Perlu gotong royong khusus untuk blok B segera.", 2),
              ("Sudah saya sampaikan ke ketua RT, akan dijadwalkan minggu ini.", 3)]),
            ("Taman RT baru — masukan untuk fasilitas",
             "Taman RT yang baru akan direnovasi. Saya ingin mengumpulkan masukan dari warga: fasilitas apa yang paling dibutuhkan? Bangku taman, area bermain anak, jogging track, atau kolam koi?",
             "usul",
             [("Prioritaskan area bermain anak! Anak-anak di sini sangat membutuhkannya.", 4),
              ("Bangku taman untuk lansia juga penting. Mereka butuh tempat duduk yang nyaman.", 5),
              ("Kalau bisa ada lampu taman agar tetap aman dan terang di malam hari.", 6)]),
            ("Keluhan: Motor parkir di depan gang",
             "Setiap hari ada beberapa motor yang parkir sembarangan di depan gang utama, menghalangi akses keluar masuk. Ini sangat mengganggu terutama pagi hari ketika anak sekolah dan warga berangkat kerja.",
             "lainnya",
             [("Memang sudah lama jadi masalah. Perlu ada tanda dilarang parkir yang jelas.", 7),
              ("Saya setuju perlu aturan tertulis dan sanksi bagi yang melanggar.", 8)]),
            ("Info: Toko sembako Pak Budi tutup — ada alternatif?",
             "Toko sembako Pak Budi yang biasa jadi langganan warga RT ternyata tutup permanen. Ada yang tahu toko sembako terdekat yang harganya terjangkau dan buka malam?",
             "lainnya",
             [("Di Jl. Mawar No. 5 ada yang baru buka, harga kompetitif buka sampai jam 22.", 9),
              ("Minimarket di ujung jalan juga bisa jadi alternatif, tapi harga sedikit lebih mahal.", 10)]),
            ("Diskusi: Wifi bersama RT — kelayakannya?",
             "Usulan RT memasang wifi bersama untuk area balai dan taman. Apakah warga setuju? Estimasi biaya Rp150.000/KK per bulan untuk kuota 100 Mbps. Bagaimana pendapat?",
             "usul",
             [("Sangat setuju! Harga segitu jauh lebih murah dari paket pribadi.", 11),
              ("Perlu dipikirkan juga soal keamanan data dan siapa yang mengelola.", 0),
              ("Saya abstain, sudah punya paket sendiri yang cukup.", 12)]),
            ("Kebisingan malam hari dari kos-kosan Blok D",
             "Setiap akhir pekan penghuni kos di Blok D No. 18 sangat berisik hingga larut malam. Sudah beberapa kali ditegur tapi tidak ada perubahan. Mohon bantuan pengurus RT.",
             "keamanan",
             [("Saya juga terganggu. Sebaiknya ada teguran resmi dari RT.", 13),
              ("Perlu ada aturan tertulis jam kebisingan yang disepakati warga RT.", 14)]),
            ("Ide: Bank sampah RT — siapa yang mau bergabung?",
             "Saya ingin membentuk bank sampah di RT 04. Warga bisa mengumpulkan sampah daur ulang (botol, kardus, koran) dan mendapat poin yang bisa ditukar hadiah. Siapa yang tertarik?",
             "usul",
             [("Ide bagus! Saya mau ikut. Bisa sekalian edukasi ke anak-anak.", 15),
              ("Kapan rencana dimulai? Saya punya banyak kardus dan botol di rumah.", 16)]),
            ("Masalah air PDAM — sering mati mendadak",
             "Dalam sebulan terakhir air PDAM sering mati tanpa pemberitahuan, kadang sampai 6 jam. Ini sangat mengganggu terutama untuk memasak dan MCK. Apakah warga lain juga mengalami?",
             "lainnya",
             [("Iya, saya juga sering kena. Sebaiknya RT berkoordinasi dengan PDAM setempat.", 17),
              ("Saran: minta jadwal pemeliharaan dari PDAM supaya bisa antisipasi.", 18)]),
            ("Usul: Kelas belajar gratis untuk anak SD di RT",
             "Ada yang mau membantu mengajar anak-anak SD di lingkungan RT? Banyak yang butuh bimbingan belajar tapi orang tua tidak mampu bayar les. Bisa dilaksanakan di balai RT.",
             "usul",
             [("Saya guru SD, siap membantu 2x seminggu untuk mata pelajaran Matematika dan IPA.", 19),
              ("Bagus sekali! Saya bisa bantu untuk Bahasa Indonesia dan PKN.", 0)]),
            ("Laporan: Lampu gang Blok A No. 7 mati 2 minggu",
             "Lampu penerangan di gang Blok A antara No. 7 dan No. 9 sudah mati sejak 2 minggu lalu. Sudah melapor ke pengurus tapi belum ada tindak lanjut. Mohon segera diperbaiki.",
             "kebersihan",
             [("Iya, saya lewat sana setiap malam sangat gelap dan berbahaya.", 1),
              ("Sudah saya teruskan ke petugas listrik RT, akan dicek Senin ini.", 2)]),
            ("Senam pagi bersama — jadwal dan peserta",
             "Untuk yang berminat ikut senam pagi bersama, saya usulkan setiap Minggu pukul 06.30 di taman RT. Instruktur sudah ada. Mohon konfirmasi siapa saja yang akan ikut.",
             "acara",
             [("Saya ikut! Udah lama mau olahraga bareng warga.", 3),
              ("Keluarga saya mau ikut semua. Terima kasih inisiatifnya!", 4),
              ("Boleh saya ajak teman dari RT sebelah? Makin ramai makin seru.", 5)]),
            ("Masukan untuk menu buka puasa bersama Ramadhan",
             "Dalam rangka buka puasa bersama Ramadhan, panitia membutuhkan masukan menu. Selama ini selalu nasi kotak, apakah warga mau mencoba format potluck (setiap KK bawa 1 hidangan)?",
             "acara",
             [("Format potluck lebih seru dan hemat! Bisa coba masakan warga yang beragam.", 6),
              ("Setuju potluck! Tapi perlu koordinasi agar menu tidak menumpuk di kategori sama.", 7)]),
            ("Keresahan: Sampah sering dibuang sembarangan",
             "Beberapa hari terakhir saya menemukan sampah dibuang di pinggir jalan Blok E, bukan di tempat yang disediakan. Ini sangat tidak higienis. Perlu ada penindakan dan sosialisasi ulang.",
             "kebersihan",
             [("Setuju harus ada tindakan tegas. Mungkin perlu dipasang tulisan atau kamera pengawas.", 8),
              ("Mungkin jadwal pengangkutan sampahnya yang perlu disesuaikan.", 9)]),
            ("Usul: Pembuatan grup belajar bahasa Inggris warga",
             "Ada yang berminat membentuk kelompok belajar bahasa Inggris informal untuk remaja dan dewasa di RT? Bisa 1 minggu sekali di balai RT, gratis dan santai.",
             "usul",
             [("Saya mau! Bisa bantu mengajar karena memang bidang saya.", 10),
              ("Bagus! Anak saya yang SMA juga butuh latihan speaking.", 11)]),
            ("Permintaan: Pos ronda perlu diperbaiki",
             "Pos ronda di Blok B sudah bocor atapnya dan kursinya rusak. Kondisi ini bikin petugas ronda tidak nyaman. Mohon ada anggaran untuk perbaikan kecil.",
             "lainnya",
             [("Benar, saya juga jaga di sana dan memang kurang nyaman.", 12),
              ("Bisa usulan ke RT agar dimasukkan dalam rencana anggaran bulan depan.", 13)]),
            ("Info: Pendaftaran beasiswa kelurahan dibuka",
             "Untuk informasi, Kelurahan membuka pendaftaran beasiswa untuk anak SD–SMA dari keluarga tidak mampu. Syarat lengkap dan formulir bisa diambil di Kelurahan. Deadline akhir bulan ini.",
             "lainnya",
             [("Terima kasih infonya! Sangat bermanfaat untuk warga yang membutuhkan.", 14),
              ("Ada yang bisa bantu mengisi formulirnya untuk orang tua yang tidak melek digital?", 15)]),
            ("Usulan: Area parkir motor bersama di ujung gang",
             "Untuk mengurangi motor parkir sembarangan di gang, bagaimana kalau RT menyediakan area parkir bersama? Ada lahan kosong di ujung gang Blok A yang bisa dimanfaatkan.",
             "usul",
             [("Ide bagus! Bisa sekalian ditutup dan dikenai biaya kecil untuk perawatan.", 16),
              ("Perlu koordinasi dengan pemilik lahan terlebih dahulu.", 17)]),
            ("Diskusi: Frekuensi rapat warga yang ideal",
             "Apakah rapat warga sebulan sekali sudah cukup? Atau perlu lebih sering? Kadang ada agenda mendesak yang tidak bisa menunggu sebulan.",
             "usul",
             [("Sebulan sekali sudah cukup, tapi untuk hal mendesak bisa melalui grup WA atau aplikasi RT.", 18),
              ("Setuju. Rapat fisik sebulan sekali, untuk info mendesak pakai media digital.", 19)]),
            ("Keluhan: Bau dari got di dekat pasar",
             "Saluran air dekat pasar kecil di ujung Blok E sangat bau, terutama saat musim hujan. Sudah sangat mengganggu warga sekitar. Mohon koordinasi dengan kelurahan untuk penanganan.",
             "kebersihan",
             [("Saya juga merasakan. Ini sudah bertahun-tahun tidak ditangani.", 0),
              ("Perlu surat resmi dari RT ke Kelurahan agar segera ditindaklanjuti.", 1)]),
            ("Rencana: Tanaman obat di taman RT (TOGA)",
             "Saya usul agar sebagian area taman RT ditanami tanaman obat keluarga (TOGA) seperti jahe, kunyit, daun sirih, dan lidah buaya. Bisa dimanfaatkan warga secara gratis.",
             "usul",
             [("Ide yang sangat bermanfaat! Apalagi bisa dikelola ibu-ibu PKK.", 2),
              ("Setuju! Bisa juga jadi program unggulan RT untuk lomba kebersihan antar RT.", 3)]),
            ("Pertanyaan: Bisakah surat keterangan RT untuk lamaran kerja diproses cepat?",
             "Saya butuh surat keterangan domisili untuk melamar kerja, dan prosesnya cukup memakan waktu. Apakah ada cara untuk mempercepat? Saya butuh dalam 2 hari.",
             "lainnya",
             [("Sekarang bisa melalui aplikasi Smart-RT, proses lebih cepat 1x24 jam.", 4),
              ("Saya juga pernah mengalami hal sama. Disarankan langsung hubungi sekretaris RT.", 5)]),
            ("Kabar baik: Warga RT 04 juara lomba kebersihan kecamatan!",
             "Alhamdulillah, RT 04 kita berhasil meraih juara 2 lomba kebersihan tingkat kecamatan. Ini pencapaian luar biasa berkat kerja keras seluruh warga. Terima kasih atas partisipasi dan semangat kebersamaan kita!",
             "acara",
             [("Selamat! Kita harus pertahankan bahkan tingkatkan. Bangga jadi warga RT 04!", 6),
              ("Luar biasa! Ini bukti bahwa warga RT 04 kompak dan peduli lingkungan.", 7),
              ("Tahun depan kita targetkan juara 1! Semangat terus warga RT 04.", 8)]),
        ]

        created = 0
        for judul, isi, kategori, comments in DATA:
            thread, is_new = Thread.objects.get_or_create(
                judul=judul,
                defaults={"isi": isi, "kategori": kategori, "created_by": admin_user},
            )
            if is_new:
                created += 1
                for komentar, uid in comments:
                    if uid < len(user_warga):
                        Comment.objects.create(
                            thread=thread, isi=komentar, created_by=user_warga[uid],
                        )

        self.stdout.write(f"  + {created} thread forum")

    # ── Pengaduan ─────────────────────────────────────────────────────────────

    def _seed_pengaduan(self, user_warga):
        from pengaduan.models import Pengaduan

        self.stdout.write("[*] 67 Pengaduan...")
        if not user_warga:
            return

        now = timezone.now()

        RAW = [
            # (uid_idx, judul, deskripsi, kategori, status)
            (0,  "Jalan berlubang di depan Blok A No. 10",       "Ada lubang besar di jalan depan Blok A No. 10–12 yang membahayakan pengendara motor, terutama di malam hari.", "infrastruktur", "diajukan"),
            (1,  "Lampu jalan mati di Blok B dekat pos ronda",    "Lampu jalan di dekat pos ronda Blok B sudah mati sejak 2 minggu lalu. Sangat berbahaya di malam hari.", "infrastruktur", "diproses"),
            (2,  "Sampah menumpuk di pinggir got Blok C",         "Tumpukan sampah di Blok C tidak diangkut selama 4 hari, menimbulkan bau menyengat dan mengundang lalat.", "kebersihan", "selesai"),
            (3,  "Air PDAM keruh di Blok D",                      "Air PDAM di Blok D mengalami kekeruhan sejak kemarin sore. Tidak bisa digunakan untuk memasak.", "infrastruktur", "diproses"),
            (4,  "Ada orang asing mencurigakan malam hari",       "Tadi malam ada 2 orang asing yang mondar-mandir di gang Blok E hingga pukul 01.00. Terlihat mencurigakan.", "keamanan", "selesai"),
            (5,  "Selokan di Blok B tersumbat dan meluap",        "Selokan di depan Blok B No. 5–8 tersumbat oleh sampah plastik. Saat hujan air meluap ke jalan.", "kebersihan", "diproses"),
            (6,  "Kendaraan parkir menghalangi gang",             "Ada kendaraan yang parkir di tengah gang utama sejak pagi hingga malam, menghalangi akses warga.", "infrastruktur", "diajukan"),
            (7,  "Kebisingan dari kos di Blok D akhir pekan",    "Penghuni kos di Blok D No. 18 sangat berisik setiap akhir pekan hingga larut malam. Sudah 3x ditegur.", "sosial", "diproses"),
            (8,  "Tembok gang Blok C retak dan berpotensi roboh", "Tembok pembatas gang di Blok C terlihat retak parah. Khawatir akan roboh dan membahayakan pejalan kaki.", "infrastruktur", "selesai"),
            (9,  "Anak-anak bermain petasan malam hari",          "Sekelompok anak-anak bermain petasan besar di jalan utama malam hari. Berbahaya dan sangat mengganggu.", "keamanan", "selesai"),
            (10, "Pohon tumbang menghalangi jalan Blok A",        "Ada pohon besar tumbang di jalan depan Blok A No. 3 akibat angin kencang. Perlu segera dibersihkan.", "infrastruktur", "selesai"),
            (11, "Pungutan liar dari oknum",                      "Ada seseorang yang mengaku sebagai 'petugas RT' meminta sumbangan dari rumah ke rumah. Tidak ada surat resmi.", "keamanan", "diajukan"),
            (12, "Bau limbah dari pembuangan belakang Blok E",    "Pembuangan air limbah di belakang Blok E menimbulkan bau sangat menyengat yang mengganggu warga sekitar.", "kebersihan", "diproses"),
            (13, "Pengemis agresif di lingkungan RT",             "Ada pengemis yang bersikap agresif saat diberi penolakan. Sudah beberapa warga merasa terancam.", "sosial", "diajukan"),
            (14, "Jembatan kecil Blok D goyah dan berbahaya",    "Jembatan kecil penghubung gang di Blok D sudah goyah dan kayu lantainya hampir patah.", "infrastruktur", "diproses"),
            (15, "Anjing liar berkeliaran di Blok B",             "Beberapa anjing liar sering berkeliaran di Blok B malam hari. Sudah ada anak kecil yang hampir digigit.", "keamanan", "selesai"),
            (16, "Pipa air bocor di Blok C No. 7",               "Pipa air utama di depan Blok C No. 7 bocor dan menggenangi jalan. Sudah 2 hari dibiarkan.", "infrastruktur", "selesai"),
            (17, "Sampah dibakar sembarangan di Blok A",         "Ada warga yang membakar sampah di pekarangan dekat rumah sehingga asap mengganggu tetangga.", "kebersihan", "diajukan"),
            (18, "Parkir motor di trotoar jalan masuk",          "Motor-motor sering diparkir di trotoar jalan masuk sehingga pejalan kaki terpaksa turun ke jalan.", "infrastruktur", "diproses"),
            (19, "Pencurian jemuran di Blok C malam hari",       "Kemarin malam jemuran saya diambil orang. Sudah beberapa warga mengalami hal serupa dalam sebulan ini.", "keamanan", "diproses"),
            (0,  "Atap pos ronda bocor saat hujan",              "Atap pos ronda di Blok B sudah bocor parah. Petugas ronda tidak bisa berteduh dengan nyaman saat hujan.", "infrastruktur", "diajukan"),
            (1,  "Konflik antar warga soal batas tanah",         "Ada sengketa batas tanah antara warga No. 12 dan No. 14 Blok A yang mulai memanas. Perlu mediasi RT.", "sosial", "diproses"),
            (2,  "Anak jalanan nongkrong di taman RT",           "Sekelompok anak jalanan dari luar RT sering nongkrong di taman RT hingga larut malam, membuat warga tidak nyaman.", "keamanan", "selesai"),
            (3,  "Air got hitam dan bau di Blok E",              "Air di got depan Blok E berwarna hitam pekat dan berbau busuk. Kondisi ini sudah berlangsung lama.", "kebersihan", "diproses"),
            (4,  "Pedagang kaki lima menghalangi gang masuk",    "Ada pedagang kaki lima yang berjualan di depan gerbang masuk RT setiap pagi, menghalangi kendaraan keluar masuk.", "lainnya", "diajukan"),
            (5,  "Genangan air di depan Blok B pasca hujan",     "Setiap kali hujan lebat, air tergenang di depan Blok B hingga betis orang dewasa. Drainase perlu diperbaiki.", "infrastruktur", "diproses"),
            (6,  "Pengantar paket masuk sembarangan tanpa izin", "Beberapa pengantar paket online masuk ke dalam lingkungan RT tanpa lapor ke pos jaga. Perlu aturan yang jelas.", "keamanan", "diajukan"),
            (7,  "Warga baru tidak melapor ke RT",               "Ada keluarga baru yang sudah 2 bulan tinggal di Blok D tapi belum melapor ke RT. Perlu didata.", "sosial", "diajukan"),
            (8,  "Kerusakan pagar pembatas taman",               "Pagar pembatas taman RT rusak di beberapa bagian. Berbahaya untuk anak-anak yang bermain di sekitarnya.", "infrastruktur", "selesai"),
            (9,  "Suara bising mesin di Blok E tengah malam",    "Ada suara mesin/kompresor bising dari salah satu rumah di Blok E yang beroperasi hingga tengah malam.", "sosial", "diproses"),
            (10, "Tong sampah di Blok A penuh tidak dikosongkan","Tong sampah komunal di Blok A penuh sejak 3 hari lalu tapi belum juga dikosongkan oleh petugas.", "kebersihan", "diajukan"),
            (11, "Kabel listrik menjuntai rendah di gang",       "Ada kabel listrik yang menjuntai sangat rendah di gang Blok C, berbahaya bagi pengguna sepeda dan pejalan kaki.", "infrastruktur", "diproses"),
            (12, "Gangguan dari tempat kost baru Blok D",        "Penghuni kost baru di Blok D sering mengadakan pesta hingga pukul 03.00. Sangat mengganggu warga sekitar.", "sosial", "selesai"),
            (13, "Penipuan berkedok survey di lingkungan RT",    "Ada orang yang mengaku dari lembaga survey dan meminta data pribadi warga. Perlu diwaspadai.", "keamanan", "diajukan"),
            (14, "Pompa air umum di Blok B rusak",               "Pompa air umum yang biasa digunakan warga Blok B untuk keperluan darurat sudah rusak sejak seminggu lalu.", "infrastruktur", "diproses"),
            (15, "Sampah plastik menumpuk di selokan utama",     "Selokan utama di jalan masuk RT dipenuhi sampah plastik sehingga aliran air terhambat dan berpotensi banjir.", "kebersihan", "selesai"),
            (16, "Pelecehan verbal di lingkungan RT",            "Ada warga yang sering mengeluarkan kata-kata kasar di depan umum yang membuat warga lain tidak nyaman.", "sosial", "diajukan"),
            (17, "Genset tetangga mengganggu ketenangan",        "Tetangga di Blok A No. 20 menggunakan genset bersuara sangat keras hampir setiap malam dari pukul 19.00.", "sosial", "diproses"),
            (18, "Banjir kecil di gang Blok C saat hujan",       "Gang di Blok C No. 5–10 selalu terendam saat hujan deras karena saluran air tertutup sampah padat.", "infrastruktur", "selesai"),
            (19, "Marka jalan rusak dan tidak terlihat",         "Marka jalan di pintu masuk RT sudah pudar dan tidak terlihat jelas, berpotensi menyebabkan kecelakaan.", "infrastruktur", "diajukan"),
            (0,  "Taman tidak dirawat, rumput liar tumbuh",      "Taman RT 04 yang sudah dibangun tidak dirawat secara rutin, rumput liar tumbuh tinggi dan terkesan kumuh.", "kebersihan", "diproses"),
            (1,  "Listrik sering turun di Blok E",               "Listrik di Blok E sering tiba-tiba padam atau drop tegangannya, menyebabkan kerusakan peralatan elektronik.", "infrastruktur", "diajukan"),
            (2,  "Kandang ayam milik warga berbau",              "Ada warga di Blok D yang memelihara ayam dalam jumlah besar di halaman rumah. Baunya sangat mengganggu.", "kebersihan", "diproses"),
            (3,  "Perselisihan parkir antar warga",              "Dua warga berselisih soal tempat parkir yang diklaim sebagai milik pribadi masing-masing. Perlu mediasi.", "sosial", "selesai"),
            (4,  "Papan pengumuman RT rusak",                    "Papan pengumuman RT di depan balai sudah rusak dan lapuk. Informasi tidak dapat dibaca dengan jelas.", "infrastruktur", "diajukan"),
            (5,  "Sampah dibuang di depan rumah orang",          "Ada oknum yang sering membuang sampah di depan rumah tetangga pada malam hari, menimbulkan konflik.", "kebersihan", "diproses"),
            (6,  "Pintu gerbang RT sering tidak dikunci",        "Pintu gerbang belakang RT sering dibiarkan terbuka dan tidak terkunci setelah tengah malam.", "keamanan", "selesai"),
            (7,  "Fasilitas bermain anak di taman rusak",        "Ayunan dan perosotan di taman RT sudah rusak dan berkarat. Berbahaya untuk anak-anak yang bermain.", "infrastruktur", "diproses"),
            (8,  "Warga luar RT sering masuk tanpa izin",        "Beberapa orang dari luar RT sering masuk dan duduk-duduk di taman hingga malam tanpa ada pengawasan.", "keamanan", "diajukan"),
            (9,  "Petugas kebersihan tidak datang 3 hari",       "Petugas kebersihan tidak datang membersihkan area umum selama 3 hari berturut-turut tanpa pemberitahuan.", "kebersihan", "selesai"),
            (10, "Remaja ugal-ugalan di jalan lingkungan",       "Sekelompok remaja sering kebut-kebutan di jalan lingkungan RT terutama malam hari, membahayakan pejalan kaki.", "keamanan", "diproses"),
            (11, "Konsleting listrik di tiang depan RT",         "Ada percikan api dari panel listrik di tiang depan gerbang RT. Sangat berbahaya dan perlu segera ditangani.", "infrastruktur", "selesai"),
            (12, "Bau asap pembakaran sampah Blok E",            "Warga Blok E mengeluhkan bau asap tebal setiap sore dari pembakaran sampah di area belakang RT.", "kebersihan", "diajukan"),
            (13, "Jalan masuk ke balai RT berlumpur",            "Jalanan masuk menuju balai RT menjadi berlumpur dan licin saat hujan karena tidak ada pengerasan jalan.", "infrastruktur", "diproses"),
            (14, "Kasus bullying di antara anak-anak RT",        "Beberapa anak melaporkan di-bully oleh anak yang lebih besar di area taman dan gang RT. Perlu mediasi.", "sosial", "diajukan"),
            (15, "Kucing liar mengganggu warga Blok A",          "Banyak kucing liar yang berkeliaran di Blok A, mengacak-acak sampah warga dan membuat kotor lingkungan.", "kebersihan", "diproses"),
            (16, "Tanah longsor kecil di Blok C",                "Terjadi tanah longsor kecil di area tanah kosong Blok C akibat hujan deras. Perlu segera ditangani.", "infrastruktur", "selesai"),
            (17, "Tukang parkir liar di depan gerbang",          "Ada tukang parkir liar yang memungut uang dari tamu yang berkunjung ke RT tanpa izin dari pengurus.", "lainnya", "diajukan"),
            (18, "Kamar mandi umum balai RT kotor",              "Kamar mandi di balai RT sangat kotor dan berbau. Tidak ada jadwal pembersihan yang rutin.", "kebersihan", "diproses"),
            (19, "Antena TV komunal mati",                       "Antena TV komunal yang biasa digunakan warga di area balai RT sudah rusak sejak 2 minggu lalu.", "infrastruktur", "diajukan"),
            (0,  "Konflik tetangga soal kucing peliharaan",      "Kucing peliharaan tetangga sering masuk ke rumah dan merusak barang. Sudah ditegur tapi tidak diindahkan.", "sosial", "diproses"),
            (1,  "Kendaraan berat merusak jalan gang",           "Beberapa kendaraan berat proyek sering melintas di gang sempit dan merusak aspal jalan.", "infrastruktur", "diajukan"),
            (2,  "Drainase Blok B butuh pelebaran",              "Drainase di Blok B terlalu sempit untuk menampung debit air saat hujan lebat. Perlu perluasan saluran.", "infrastruktur", "selesai"),
            (3,  "Lapangan kecil kotor dan tidak terawat",       "Lapangan kecil yang biasa digunakan anak-anak bermain bola di Blok D kotor dan tidak dirawat secara rutin.", "kebersihan", "diproses"),
            (4,  "CCTV depan gerbang rusak",                     "Kamera CCTV yang terpasang di depan gerbang utama terlihat mati. Perlu segera diperbaiki untuk keamanan.", "keamanan", "diajukan"),
            (5,  "Juknis sampah organik belum dipahami warga",   "Masih banyak warga yang mencampur sampah organik dan anorganik meskipun sudah ada sosialisasi.", "kebersihan", "diproses"),
            (6,  "Sengketa batas pagar antar tetangga",          "Ada perselisihan antara dua warga soal batas pagar yang diklaim masing-masing pihak. Sudah hampir adu mulut.", "sosial", "diajukan"),
        ]

        created = 0
        for uid, judul, deskripsi, kategori, status in RAW:
            u = user_warga[uid % len(user_warga)]
            _, is_new = Pengaduan.objects.get_or_create(
                warga=u, judul=judul,
                defaults={
                    "deskripsi": deskripsi,
                    "kategori": kategori,
                    "status": status,
                    "status_history": [
                        {
                            "status": "diajukan",
                            "keterangan": "Laporan masuk",
                            "updatedBy": u.email,
                            "updatedAt": now.isoformat(),
                        }
                    ],
                },
            )
            if is_new:
                created += 1

        self.stdout.write(f"  + {created} pengaduan")

    # ── Surat ─────────────────────────────────────────────────────────────────

    def _seed_surat(self, user_warga, admin_user):
        try:
            from surat.models import JenisSurat, PermohonanSurat
        except ImportError:
            return

        self.stdout.write("[*] 45 Permohonan Surat...")
        if not user_warga:
            return

        jenis_map = {j.kode: j for j in JenisSurat.objects.all()}
        if not jenis_map:
            self.stdout.write("  ! Tidak ada JenisSurat — skip")
            return

        now = timezone.now()

        RAW = [
            # (uid_idx, kode, keperluan, status, no_surat)
            (0,  "domisili",      "Melamar pekerjaan di perusahaan swasta",                 "selesai",   "001/RT04/VI/2025"),
            (1,  "pengantar",     "Mengurus perpanjangan KTP di kelurahan",                  "selesai",   "002/RT04/VI/2025"),
            (2,  "tidak_mampu",   "Mengajukan beasiswa pendidikan anak",                     "disetujui", "003/RT04/VI/2025"),
            (3,  "domisili",      "Keperluan membuka rekening bank",                         "selesai",   "004/RT04/VI/2025"),
            (4,  "pengantar",     "Mengurus surat nikah di KUA",                             "diproses",  None),
            (5,  "usaha",         "Mengajukan izin usaha warung makan",                      "disetujui", "005/RT04/VI/2025"),
            (6,  "kelahiran",     "Mendaftarkan kelahiran anak pertama",                     "selesai",   "006/RT04/VI/2025"),
            (7,  "domisili",      "Persyaratan lamaran beasiswa pemerintah",                 "diajukan",  None),
            (8,  "belum_menikah", "Persyaratan melamar kerja di BUMN",                      "disetujui", "007/RT04/VI/2025"),
            (9,  "pindah",        "Pindah domisili ke luar kota",                           "selesai",   "008/RT04/VI/2025"),
            (10, "domisili",      "Keperluan pembuatan SIM",                                 "diproses",  None),
            (11, "tidak_mampu",   "Keperluan keringanan biaya rumah sakit",                  "selesai",   "009/RT04/VI/2025"),
            (12, "pengantar",     "Mengurus surat pindah ke kelurahan lain",                 "diajukan",  None),
            (13, "rekomendasi",   "Rekomendasi untuk mendaftar program PKH",                 "disetujui", "010/RT04/V/2025"),
            (14, "izin_keramaian","Izin mengadakan syukuran pernikahan di lingkungan RT",    "selesai",   "011/RT04/V/2025"),
            (15, "domisili",      "Mendaftar program pelatihan kerja pemerintah",             "diajukan",  None),
            (16, "usaha",         "Membuka toko online dengan alamat RT",                    "diproses",  None),
            (17, "kelahiran",     "Melengkapi dokumen akte kelahiran anak",                  "selesai",   "012/RT04/V/2025"),
            (18, "domisili",      "Keperluan mendaftar kuliah di perguruan tinggi",           "disetujui", "013/RT04/V/2025"),
            (19, "pengantar",     "Perpanjangan paspor di kantor imigrasi",                  "selesai",   "014/RT04/V/2025"),
            (0,  "belum_menikah", "Keperluan mendaftar CPNS 2025",                          "diajukan",  None),
            (1,  "tidak_mampu",   "Mengajukan subsidi listrik R-1",                          "diproses",  None),
            (2,  "domisili",      "Persyaratan mencairkan BPJS Ketenagakerjaan",             "selesai",   "015/RT04/V/2025"),
            (3,  "pindah",        "Kepindahan ke luar provinsi karena pindah kerja",         "disetujui", "016/RT04/V/2025"),
            (4,  "kematian",      "Pengurusan surat kematian orang tua",                     "selesai",   "017/RT04/IV/2025"),
            (5,  "rekomendasi",   "Pengajuan bantuan modal usaha UMKM",                      "diajukan",  None),
            (6,  "domisili",      "Registrasi kartu prakerja",                               "diproses",  None),
            (7,  "izin_keramaian","Hajatan ulang tahun dengan tamu lebih dari 50 orang",     "selesai",   "018/RT04/IV/2025"),
            (8,  "usaha",         "Mendaftarkan UMKM untuk mendapat NIB",                    "disetujui", "019/RT04/IV/2025"),
            (9,  "pengantar",     "Keperluan membuat akte pernikahan di catatan sipil",      "selesai",   "020/RT04/IV/2025"),
            (10, "domisili",      "Keperluan mendaftar program Kartu Indonesia Sehat",        "diajukan",  None),
            (11, "belum_menikah", "Persyaratan melamar kerja di perusahaan asing",           "diproses",  None),
            (12, "tidak_mampu",   "Permohonan keringanan iuran BPJS Kesehatan",             "selesai",   "021/RT04/IV/2025"),
            (13, "kelahiran",     "Melengkapi data kelahiran anak untuk KK",                 "diajukan",  None),
            (14, "domisili",      "Mendaftar beasiswa pesantren kilat",                      "disetujui", "022/RT04/III/2025"),
            (15, "pindah",        "Pindah ke rumah baru dalam satu RT",                      "selesai",   "023/RT04/III/2025"),
            (16, "rekomendasi",   "Rekomendasi untuk pelatihan vokasi Disnaker",             "diproses",  None),
            (17, "domisili",      "Keperluan membuat nomor NPWP",                            "selesai",   "024/RT04/III/2025"),
            (18, "usaha",         "Surat keterangan usaha untuk pinjaman bank",              "diajukan",  None),
            (19, "pengantar",     "Melengkapi berkas pengajuan KPR",                         "selesai",   "025/RT04/III/2025"),
            (0,  "izin_keramaian","Izin pesta perpisahan sebelum pindah kota",               "disetujui", "026/RT04/II/2025"),
            (1,  "domisili",      "Mendaftar bantuan sosial desa/kelurahan",                 "diproses",  None),
            (2,  "kematian",      "Administrasi kematian untuk pencairan asuransi",          "selesai",   "027/RT04/II/2025"),
            (3,  "tidak_mampu",   "Permohonan beasiswa anak yatim dari yayasan",            "diajukan",  None),
            (4,  "domisili",      "Keperluan mengurus sertifikasi tanah BPN",                "selesai",   "028/RT04/II/2025"),
        ]

        created = 0
        for uid, kode, keperluan, status, no_surat in RAW:
            jenis = jenis_map.get(kode)
            if not jenis:
                continue
            pemohon = user_warga[uid % len(user_warga)]

            # Idempotency: skip jika sudah ada kombinasi ini
            if PermohonanSurat.objects.filter(pemohon=pemohon, jenis=jenis, keperluan=keperluan).exists():
                continue

            PermohonanSurat.objects.create(
                pemohon=pemohon,
                jenis=jenis,
                keperluan=keperluan,
                status=status,
                no_surat=no_surat,
                reviewed_by=admin_user if status not in ("diajukan", "diproses") else None,
                reviewed_at=now if status not in ("diajukan", "diproses") else None,
                data_form={},
            )
            created += 1

        self.stdout.write(f"  + {created} permohonan surat")
