"""Seed kategori transaksi default agar TransaksiFormPage tidak kosong."""
from django.core.management.base import BaseCommand

from keuangan.models import KategoriTransaksi

DEFAULT_KATEGORI = [
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


class Command(BaseCommand):
    help = "Seed kategori transaksi default untuk keuangan RT"

    def handle(self, *args, **options):
        created = 0
        skipped = 0
        for nama, tipe in DEFAULT_KATEGORI:
            _, is_new = KategoriTransaksi.objects.get_or_create(nama=nama, tipe=tipe)
            if is_new:
                created += 1
            else:
                skipped += 1
        self.stdout.write(
            self.style.SUCCESS(f"Selesai: {created} kategori baru ditambahkan, {skipped} sudah ada.")
        )
