import uuid

from django.db import migrations


JENIS_SURAT = [
    {
        "kode": "domisili",
        "nama": "Surat Keterangan Domisili",
        "deskripsi": "Keterangan tempat tinggal / domisili warga di wilayah RT ini.",
        "field_tambahan": [],
        "urutan": 1,
    },
    {
        "kode": "tidak_mampu",
        "nama": "Surat Ket. Tidak Mampu (SKTM)",
        "deskripsi": "Digunakan untuk keperluan beasiswa, keringanan biaya, atau bantuan sosial.",
        "field_tambahan": ["tujuan_penggunaan"],
        "urutan": 2,
    },
    {
        "kode": "pengantar",
        "nama": "Surat Pengantar",
        "deskripsi": "Surat pengantar umum ke instansi/kantor pemerintah.",
        "field_tambahan": ["tujuan_instansi"],
        "urutan": 3,
    },
    {
        "kode": "kelahiran",
        "nama": "Surat Ket. Kelahiran",
        "deskripsi": "Keterangan kelahiran bayi untuk pengurusan akta lahir.",
        "field_tambahan": ["nama_bayi", "tanggal_lahir", "nama_ayah", "nama_ibu"],
        "urutan": 4,
    },
    {
        "kode": "kematian",
        "nama": "Surat Ket. Kematian",
        "deskripsi": "Keterangan kematian warga untuk pengurusan akta kematian.",
        "field_tambahan": ["nama_almarhum", "tanggal_meninggal"],
        "urutan": 5,
    },
    {
        "kode": "pindah",
        "nama": "Surat Ket. Pindah",
        "deskripsi": "Keterangan pindah domisili ke luar wilayah RT.",
        "field_tambahan": ["alamat_tujuan"],
        "urutan": 6,
    },
    {
        "kode": "usaha",
        "nama": "Surat Ket. Usaha (SKU)",
        "deskripsi": "Keterangan keberadaan usaha kecil/menengah warga.",
        "field_tambahan": ["nama_usaha", "jenis_usaha", "alamat_usaha"],
        "urutan": 7,
    },
    {
        "kode": "belum_menikah",
        "nama": "Surat Ket. Belum Menikah",
        "deskripsi": "Keterangan bahwa pemohon belum pernah menikah.",
        "field_tambahan": [],
        "urutan": 8,
    },
    {
        "kode": "izin_keramaian",
        "nama": "Surat Izin Kegiatan/Hajatan",
        "deskripsi": "Permohonan izin penyelenggaraan kegiatan atau hajatan di lingkungan RT.",
        "field_tambahan": ["nama_kegiatan", "tanggal_kegiatan", "jumlah_tamu_perkiraan"],
        "urutan": 9,
    },
    {
        "kode": "rekomendasi",
        "nama": "Surat Rekomendasi",
        "deskripsi": "Surat rekomendasi dari RT untuk berbagai keperluan.",
        "field_tambahan": ["tujuan_rekomendasi"],
        "urutan": 10,
    },
]


def seed_jenis_surat(apps, schema_editor):
    JenisSurat = apps.get_model("surat", "JenisSurat")
    for data in JENIS_SURAT:
        JenisSurat.objects.get_or_create(
            kode=data["kode"],
            defaults={
                "id": uuid.uuid4(),
                "nama": data["nama"],
                "deskripsi": data["deskripsi"],
                "field_tambahan": data["field_tambahan"],
                "is_active": True,
                "urutan": data["urutan"],
            },
        )


def unseed_jenis_surat(apps, schema_editor):
    JenisSurat = apps.get_model("surat", "JenisSurat")
    JenisSurat.objects.filter(kode__in=[d["kode"] for d in JENIS_SURAT]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("surat", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_jenis_surat, reverse_code=unseed_jenis_surat),
    ]
