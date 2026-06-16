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
from itertools import cycle

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

User = get_user_model()

TAHUN = date.today().year
BULAN = date.today().month

# ── 100 nama warga Indonesia ──────────────────────────────────────────────────

NAMA_LAKI = [
    "Budi Santoso", "Agus Setiawan", "Andi Pratama", "Riko Firmansyah", "Doni Herwanto",
    "Fajar Nugroho", "Hendra Kusuma", "Irwan Saputra", "Joko Widodo", "Kurniawan Aji",
    "Lukman Hakim", "Muhammad Faisal", "Nanda Putra", "Oscar Ramadhan", "Prasetyo Wibowo",
    "Qori Hidayat", "Rizki Permana", "Sandi Putra", "Teguh Santoso", "Usman Harun",
    "Vino Bastian", "Wahyu Setiabudi", "Xaverius Hadi", "Yudi Prasetyo", "Zainal Abidin",
    "Bambang Purnomo", "Cahyo Wicaksono", "Dedy Supriadi", "Eko Prabowo", "Ferry Andrianto",
    "Gunawan Saputra", "Haryanto Susilo", "Imam Syafii", "Jimmy Sutomo", "Kevin Halim",
    "Latif Hamdani", "Maman Suryadi", "Nanang Wijaya", "Oni Kurniawan", "Puguh Hartono",
    "Qifli Hamdani", "Raffi Ahmad", "Surya Dharma", "Toni Wahyudi", "Udin Saputra",
    "Valerian Hariadi", "Wawan Susanto", "Yoga Adiputra", "Zulkifli Hasim", "Aris Munandar",
],

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
]

# Flatten (NAMA_LAKI adalah tuple karena trailing comma)
NAMA_LAKI = list(NAMA_LAKI[0])

PEKERJAAN = [
    "Karyawan Swasta", "PNS", "Wirausaha", "Buruh", "Petani",
    "Pedagang", "Guru", "Dokter", "Polisi", "TNI",
    "Ibu Rumah Tangga", "Driver Ojek Online", "Teknisi", "Wiraswasta", "Freelancer",
]

AGAMA = ["Islam", "Islam", "Islam", "Islam", "Kristen", "Katolik", "Hindu", "Buddha"]

BLOK = ["A", "B", "C", "D", "E"]

LOGIN_USERS = [
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


def _nik(idx: int) -> str:
    """Generate 16-digit NIK unik."""
    return f"35780101010{idx:05d}"


def _tanggal_lahir(seed: int) -> date:
    random.seed(seed)
    offset = random.randint(8000, 22000)
    return date(1970, 1, 1) + timedelta(days=offset)


class Command(BaseCommand):
    help = "Seed sample data 100 warga / 50 KK untuk Smart-RT"

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true",
                            help="Hapus user sample dan seed ulang")

    def handle(self, *args, **options):
        if options["reset"]:
            self._reset()

        self.stdout.write(self.style.MIGRATE_HEADING("=== Seed Data Smart-RT ===\n"))

        admin_user = self._seed_login_users()
        self._seed_permissions()
        profile_map, user_warga = self._seed_warga_100(admin_user)
        self._seed_pengaturan_rt(admin_user)
        self._seed_keuangan(admin_user)
        self._seed_iuran(admin_user, profile_map)
        self._seed_pengumuman(admin_user)
        self._seed_kegiatan(admin_user, user_warga)
        self._seed_polling(admin_user, user_warga)
        self._seed_forum(admin_user, user_warga)
        self._seed_pengaduan(user_warga)
        self._seed_surat(user_warga, admin_user)

        self.stdout.write(self.style.SUCCESS("\n✓ Seed data selesai!\n"))
        self.stdout.write("Akun login:")
        for email, pw, role, *_ in LOGIN_USERS:
            self.stdout.write(f"  {role:<12} {email} / {pw}")

    # ── Reset ─────────────────────────────────────────────────────────────────

    def _reset(self):
        self.stdout.write(self.style.WARNING("Menghapus data sample lama..."))
        emails = [u[0] for u in LOGIN_USERS]
        User.objects.filter(email__in=emails).delete()
        # Hapus WargaProfile yang di-seed (yang tidak punya user)
        from accounts.models import WargaProfile
        WargaProfile.objects.filter(nik__startswith="357801010").delete()
        self.stdout.write("  Data lama dihapus.")

    # ── Login Users ───────────────────────────────────────────────────────────

    def _seed_login_users(self):
        self.stdout.write("→ Login users (pengurus + 5 warga)...")
        admin_user = None
        for email, pw, role, phone, _ in LOGIN_USERS:
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
        self.stdout.write(f"  {len(LOGIN_USERS)} user siap")
        return admin_user

    # ── Permissions ───────────────────────────────────────────────────────────

    def _seed_permissions(self):
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
        self.stdout.write(f"  + {created} permission")

    # ── 100 Warga / 50 KK ────────────────────────────────────────────────────

    def _seed_warga_100(self, admin_user):
        from kartu_keluarga.models import KartuKeluarga
        from accounts.models import WargaProfile

        self.stdout.write("→ 100 Warga / 50 KK...")

        all_login_users = {u[0]: u for u in LOGIN_USERS}
        user_map = {u.email: u for u in User.objects.filter(
            email__in=[u[0] for u in LOGIN_USERS]
        )}

        # KK structure: 50 KK, total 100 anggota
        # 10 KK × 3 anggota = 30, 30 KK × 2 anggota = 60, 10 KK × 1 anggota = 10
        kk_sizes = [3] * 10 + [2] * 30 + [1] * 10  # total = 100 anggota
        assert sum(kk_sizes) == 100

        nama_laki_cycle = cycle(NAMA_LAKI)
        nama_perempuan_cycle = cycle(NAMA_PEREMPUAN)

        # Warga login yang sudah punya profil
        WARGA_LOGIN = [
            ("warga1@smart-rt.id", "Budi Santoso",    "L"),
            ("warga2@smart-rt.id", "Sri Wahyuni",     "P"),
            ("warga3@smart-rt.id", "Andi Pratama",    "L"),
            ("warga4@smart-rt.id", "Dewi Lestari",    "P"),
            ("warga5@smart-rt.id", "Riko Firmansyah", "L"),
        ]
        warga_login_cycle = cycle(WARGA_LOGIN)

        profile_map = {}
        user_warga = []
        nik_counter = 1

        for kk_idx, size in enumerate(kk_sizes, start=1):
            no_kk = f"35780101010{kk_idx:05d}"
            blok = BLOK[kk_idx % len(BLOK)]
            no_rumah = str((kk_idx % 30) + 1)
            alamat_kk = f"Jl. Lingkungan Blok {blok} No. {no_rumah}"

            kk, _ = KartuKeluarga.objects.get_or_create(
                no_kk=no_kk,
                defaults={"alamat": alamat_kk, "created_by": admin_user},
            )

            for anggota_idx in range(size):
                hubungan = (
                    "kepala_keluarga" if anggota_idx == 0 else
                    "istri" if anggota_idx == 1 else
                    "anak"
                )

                # Tentukan jenis kelamin
                if hubungan == "kepala_keluarga":
                    jk = "L"
                elif hubungan == "istri":
                    jk = "P"
                else:
                    jk = random.choice(["L", "P"])

                # Pilih nama
                nama = next(nama_laki_cycle) if jk == "L" else next(nama_perempuan_cycle)

                # Cek apakah ini slot untuk warga login (5 warga pertama)
                linked_user = None
                if kk_idx <= 3 and anggota_idx == 0:
                    try:
                        email, nama_override, jk_override = next(warga_login_cycle)
                        linked_user = user_map.get(email)
                        nama = nama_override
                        jk = jk_override
                    except StopIteration:
                        pass
                elif kk_idx == 3 and anggota_idx == 1:
                    # warga2 adalah istri di KK ke-3
                    try:
                        email, nama_override, jk_override = next(warga_login_cycle)
                        linked_user = user_map.get(email)
                        nama = nama_override
                        jk = jk_override
                    except StopIteration:
                        pass

                nik = _nik(nik_counter)
                nik_counter += 1
                tgl_lahir = _tanggal_lahir(nik_counter * 7)
                random.seed(nik_counter)

                status_perkawinan = (
                    "kawin" if hubungan in ("kepala_keluarga", "istri") else
                    "belum_kawin" if (date.today().year - tgl_lahir.year) < 22 else
                    random.choice(["belum_kawin", "kawin"])
                )

                profile, created = WargaProfile.objects.get_or_create(
                    nik=nik,
                    defaults={
                        "user": linked_user,
                        "nama_lengkap": nama,
                        "tempat_lahir": random.choice(["Surabaya", "Malang", "Sidoarjo", "Gresik", "Lamongan"]),
                        "tanggal_lahir": tgl_lahir,
                        "jenis_kelamin": jk,
                        "agama": random.choice(AGAMA),
                        "status_perkawinan": status_perkawinan,
                        "pekerjaan": random.choice(PEKERJAAN),
                        "kartu_keluarga": kk,
                        "hubungan_keluarga": hubungan,
                        "alamat": alamat_kk,
                        "blok": blok,
                        "no_rumah": no_rumah,
                        "status": "aktif",
                    },
                )
                profile_map[nik] = profile

                # Warga yang punya user account
                if linked_user:
                    user_warga.append(linked_user)

        # Tambahkan warga4 dan warga5 ke user_warga secara manual
        for email in ("warga4@smart-rt.id", "warga5@smart-rt.id"):
            u = user_map.get(email)
            if u and u not in user_warga:
                user_warga.append(u)

        self.stdout.write(f"  + {WargaProfile.objects.count()} profil warga, "
                          f"50 KK, {len(user_warga)} akun warga aktif")
        return profile_map, user_warga

    # ── Pengaturan RT ─────────────────────────────────────────────────────────

    def _seed_pengaturan_rt(self, admin_user):
        from surat.models import PengaturanRT

        self.stdout.write("→ Pengaturan RT...")
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
            obj.nik_ketua_rt = "3578010101010002"
            obj.updated_by = admin_user
            obj.save()
            self.stdout.write("  + Pengaturan RT dikonfigurasi")
        else:
            self.stdout.write("  ~ Pengaturan RT sudah ada")

    # ── Keuangan ─────────────────────────────────────────────────────────────

    def _seed_keuangan(self, admin_user):
        from keuangan.models import KategoriTransaksi, Transaksi, JenisIuran, PengaturanIuran

        self.stdout.write("→ Keuangan...")

        KATEGORI = [
            ("Iuran Warga", "pemasukan"), ("Kas Masuk", "pemasukan"),
            ("Sumbangan / Donasi", "pemasukan"), ("Dana Hibah", "pemasukan"),
            ("Pendapatan Lain", "pemasukan"), ("Operasional RT", "pengeluaran"),
            ("Kegiatan Warga", "pengeluaran"), ("Kebersihan & Lingkungan", "pengeluaran"),
            ("Keamanan", "pengeluaran"), ("Perbaikan Fasilitas", "pengeluaran"),
            ("Administrasi", "pengeluaran"), ("Pengeluaran Lain", "pengeluaran"),
        ]
        kat_map = {}
        for nama, tipe in KATEGORI:
            kat, _ = KategoriTransaksi.objects.get_or_create(nama=nama, tipe=tipe)
            kat_map[(nama, tipe)] = kat

        JenisIuran.objects.get_or_create(slug="iuran-bulanan", defaults={
            "nama": "Iuran Bulanan", "tipe": "wajib", "unit": "per_kk",
            "nominal": 50000, "keterangan": "Iuran wajib bulanan per KK",
            "is_active": True, "urutan": 1,
        })
        JenisIuran.objects.get_or_create(slug="iuran-kebersihan", defaults={
            "nama": "Iuran Kebersihan", "tipe": "wajib", "unit": "per_kk",
            "nominal": 20000, "keterangan": "Iuran kebersihan per KK",
            "is_active": True, "urutan": 2,
        })

        PengaturanIuran.get_instance()

        # 6 bulan transaksi
        pemasukan_kat = kat_map[("Iuran Warga", "pemasukan")]
        created = 0
        pengeluaran_kategori = [
            kat_map[("Kegiatan Warga", "pengeluaran")],
            kat_map[("Kebersihan & Lingkungan", "pengeluaran")],
            kat_map[("Operasional RT", "pengeluaran")],
            kat_map[("Keamanan", "pengeluaran")],
        ]
        for i in range(6):
            tgl = date.today().replace(day=10)
            bln = BULAN - i
            thn = TAHUN
            if bln <= 0:
                bln += 12
                thn -= 1
            tgl = date(thn, bln, 10)

            _, is_new = Transaksi.objects.get_or_create(
                kategori=pemasukan_kat, tanggal=tgl, tipe="pemasukan",
                keterangan=f"Iuran warga bulan {bln}/{thn}",
                defaults={"jumlah": 50000 * 50, "status": "confirmed", "created_by": admin_user},
            )
            if is_new:
                created += 1

            kat_keluar = pengeluaran_kategori[i % len(pengeluaran_kategori)]
            _, is_new = Transaksi.objects.get_or_create(
                kategori=kat_keluar, tanggal=date(thn, bln, 25), tipe="pengeluaran",
                keterangan=f"Pengeluaran rutin bulan {bln}/{thn}",
                defaults={"jumlah": random.randint(3, 8) * 100000, "status": "confirmed", "created_by": admin_user},
            )
            if is_new:
                created += 1

        self.stdout.write(f"  + {created} transaksi")

    # ── Iuran ─────────────────────────────────────────────────────────────────

    def _seed_iuran(self, admin_user, profile_map):
        from keuangan.models import IuranWarga, JenisIuran
        from accounts.models import WargaProfile

        self.stdout.write("→ Iuran warga (kepala keluarga 50 KK × 3 bulan)...")

        jenis = JenisIuran.objects.filter(slug="iuran-bulanan").first()
        if not jenis:
            return

        # Ambil 1 profil per KK (kepala keluarga)
        kepala_kk_profiles = WargaProfile.objects.filter(
            hubungan_keluarga="kepala_keluarga",
            is_deleted=False,
        ).select_related("kartu_keluarga")[:50]

        created = 0
        for i, profile in enumerate(kepala_kk_profiles):
            for bulan_offset in range(3):
                bln = BULAN - bulan_offset
                thn = TAHUN
                if bln <= 0:
                    bln += 12
                    thn -= 1
                # Sebagian pending, sebagian lunas
                status = "pending" if (bulan_offset == 0 and i % 5 == 0) else "lunas"
                _, is_new = IuranWarga.objects.get_or_create(
                    warga=profile, jenis=jenis, bulan=bln, tahun=thn,
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
            ("Rapat Warga Bulanan", "Diinformasikan kepada seluruh warga RT bahwa akan diadakan rapat warga bulanan pada Sabtu mendatang pukul 19.00 WIB bertempat di Balai RT. Kehadiran seluruh kepala keluarga sangat diharapkan.", "acara"),
            ("Peringatan Keamanan Lingkungan", "Kepada seluruh warga, harap waspada terhadap tindak kejahatan di malam hari. Pastikan rumah terkunci dengan baik. Segera laporkan hal mencurigakan ke ketua RT.", "keamanan"),
            ("Jadwal Pengangkutan Sampah", "Mulai bulan ini jadwal pengangkutan sampah berubah menjadi setiap Senin, Rabu, dan Jumat pagi pukul 06.00 WIB. Harap letakkan sampah di depan rumah sebelum jam tersebut.", "info"),
            ("Gotong Royong RT", "Agenda gotong royong membersihkan saluran air dan taman lingkungan dijadwalkan Minggu pagi pukul 07.00 WIB. Setiap rumah tangga diharapkan mengirimkan minimal 1 perwakilan.", "acara"),
            ("Pembayaran Iuran Bulanan", "Reminder pembayaran iuran RT. Harap segera melakukan pembayaran melalui aplikasi Smart-RT atau langsung ke bendahara RT paling lambat tanggal 20 setiap bulannya.", "penting"),
        ]
        created = sum(
            1 for judul, isi, kat in DATA
            if Pengumuman.objects.get_or_create(judul=judul, defaults={
                "isi": isi, "kategori": kat, "is_published": True, "created_by": admin_user,
            })[1]
        )
        self.stdout.write(f"  + {created} pengumuman")

    # ── Kegiatan ──────────────────────────────────────────────────────────────

    def _seed_kegiatan(self, admin_user, user_warga):
        from kegiatan.models import Kegiatan, RSVP

        self.stdout.write("→ Kegiatan...")
        now = timezone.now()
        DATA = [
            ("Rapat Warga Bulanan",         now + timedelta(days=5),   "Balai RT",         20),
            ("Gotong Royong Saluran Air",    now + timedelta(days=10),  "Lingkungan RT",    None),
            ("Peringatan HUT RI ke-80",      now + timedelta(days=62),  "Lapangan RT",      None),
            ("Pemilihan Ketua RT Periode Baru", now + timedelta(days=90), "Balai Desa",     50),
            ("Senam Pagi Warga",             now - timedelta(days=7),   "Depan Pos Ronda",  None),
            ("Bazar Ramadhan",               now + timedelta(days=30),  "Jl. Lingkungan",   None),
        ]
        created = 0
        for nama, tgl, lokasi, kuota in DATA:
            keg, is_new = Kegiatan.objects.get_or_create(
                nama=nama,
                defaults={"tanggal": tgl, "lokasi": lokasi, "kuota_peserta": kuota, "created_by": admin_user},
            )
            if is_new:
                created += 1
                for i, u in enumerate(user_warga[:5]):
                    RSVP.objects.get_or_create(
                        kegiatan=keg, user=u,
                        defaults={"status": "hadir" if i < 3 else "masih_ragu"},
                    )
        self.stdout.write(f"  + {created} kegiatan")

    # ── Polling ───────────────────────────────────────────────────────────────

    def _seed_polling(self, admin_user, user_warga):
        from polling.models import Poll, Vote

        self.stdout.write("→ Polling...")
        now = timezone.now()
        DATA = [
            ("Kapan waktu tepat rapat warga bulanan?",
             ["Sabtu pagi (08.00-10.00)", "Sabtu malam (19.00-21.00)", "Minggu pagi (08.00-10.00)"],
             now + timedelta(days=7)),
            ("Jenis kegiatan HUT RI ke-80?",
             ["Lomba 17-an klasik", "Pentas seni warga", "Turnamen olahraga", "Kerja bakti + tasyakuran"],
             now + timedelta(days=30)),
            ("Bagaimana kondisi fasilitas taman RT saat ini?",
             ["Sudah baik", "Perlu sedikit perbaikan", "Perlu renovasi total"],
             now - timedelta(days=3)),
        ]
        created = 0
        for pertanyaan, opsi, deadline in DATA:
            poll, is_new = Poll.objects.get_or_create(
                pertanyaan=pertanyaan,
                defaults={"opsi": opsi, "deadline": deadline, "created_by": admin_user},
            )
            if is_new:
                created += 1
                for i, u in enumerate(user_warga):
                    Vote.objects.get_or_create(
                        poll=poll, user=u,
                        defaults={"opsi_index": i % len(opsi)},
                    )
        self.stdout.write(f"  + {created} polling")

    # ── Forum ─────────────────────────────────────────────────────────────────

    def _seed_forum(self, admin_user, user_warga):
        from forum.models import Thread, Comment

        self.stdout.write("→ Forum Diskusi...")
        DATA = [
            ("Usul pemasangan CCTV di gerbang RT",
             "Menurut saya perlu dipasang CCTV di gerbang masuk RT untuk meningkatkan keamanan. Bagaimana pendapat warga lain?",
             "keamanan",
             [("Saya setuju! Kejadian kemarin bikin was-was.", 0),
              ("Perlu dibahas soal anggaran dan siapa yang mengelola.", 1)]),
            ("Jadwal piket jaga malam perlu diaktifkan?",
             "Apakah kita perlu mengaktifkan kembali ronda malam? Kondisi keamanan belakangan ini cukup mengkhawatirkan.",
             "keamanan",
             [("Setuju, saya siap ikut ronda setiap Senin.", 2)]),
            ("Usul tempat sampah pilah di tiap blok",
             "Bagaimana kalau kita usulkan tempat sampah pilah (organik/anorganik) di tiap blok? Lebih ramah lingkungan.",
             "usul", []),
        ]
        created = 0
        for judul, isi, kat, comments in DATA:
            thread, is_new = Thread.objects.get_or_create(
                judul=judul,
                defaults={"isi": isi, "kategori": kat, "created_by": admin_user},
            )
            if is_new:
                created += 1
                for komentar, uid in comments:
                    if uid < len(user_warga):
                        Comment.objects.create(thread=thread, isi=komentar, created_by=user_warga[uid])
        self.stdout.write(f"  + {created} thread")

    # ── Pengaduan ─────────────────────────────────────────────────────────────

    def _seed_pengaduan(self, user_warga):
        from pengaduan.models import Pengaduan

        self.stdout.write("→ Pengaduan...")
        if not user_warga:
            return
        DATA = [
            (0, "Jalan berlubang di depan Blok A", "Ada lubang besar di jalan depan Blok A No. 10-12 yang membahayakan pengendara.", "infrastruktur", "diajukan"),
            (1, "Lampu jalan mati di Blok B", "Lampu jalan di dekat pos ronda Blok B sudah mati sejak 2 minggu lalu.", "infrastruktur", "diproses"),
            (2, "Sampah menumpuk dekat saluran air", "Tumpukan sampah di Blok C tidak diangkut selama beberapa hari, menimbulkan bau.", "kebersihan", "selesai"),
            (3, "Air PDAM keruh sejak kemarin", "Air PDAM di blok D mengalami kekeruhan sejak kemarin sore. Mohon segera ditindaklanjuti.", "infrastruktur", "diajukan"),
        ]
        created = 0
        for uid, judul, deskripsi, kat, status in DATA:
            u = user_warga[uid % len(user_warga)]
            _, is_new = Pengaduan.objects.get_or_create(
                warga=u, judul=judul,
                defaults={
                    "deskripsi": deskripsi, "kategori": kat, "status": status,
                    "status_history": [{"status": "diajukan", "keterangan": "Masuk",
                                        "updatedBy": u.email, "updatedAt": timezone.now().isoformat()}],
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

        self.stdout.write("→ Permohonan Surat...")
        jenis_domisili = JenisSurat.objects.filter(kode="domisili").first()
        jenis_pengantar = JenisSurat.objects.filter(kode="pengantar").first()
        jenis_sktm = JenisSurat.objects.filter(kode="tidak_mampu").first()
        if not jenis_domisili or not user_warga:
            return

        DATA = [
            (user_warga[0], jenis_domisili, "Keperluan melamar pekerjaan.", "disetujui", "001/RT04/VI/2025"),
            (user_warga[1] if len(user_warga) > 1 else user_warga[0], jenis_pengantar, "Mengurus surat pindah ke kelurahan.", "diajukan", None),
            (user_warga[2] if len(user_warga) > 2 else user_warga[0], jenis_sktm or jenis_domisili, "Untuk beasiswa pendidikan anak.", "diproses", None),
        ]
        created = 0
        for pemohon, jenis, keperluan, status, no_surat in DATA:
            if not jenis:
                continue
            _, is_new = PermohonanSurat.objects.get_or_create(
                pemohon=pemohon, jenis=jenis,
                defaults={
                    "keperluan": keperluan, "status": status, "no_surat": no_surat,
                    "reviewed_by": admin_user if status not in ("diajukan", "diproses") else None,
                    "reviewed_at": timezone.now() if status not in ("diajukan", "diproses") else None,
                    "data_form": {},
                },
            )
            if is_new:
                created += 1
        self.stdout.write(f"  + {created} permohonan surat")
