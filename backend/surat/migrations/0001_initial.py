import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="JenisSurat",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("kode", models.CharField(
                    choices=[
                        ("domisili", "Surat Keterangan Domisili"),
                        ("tidak_mampu", "Surat Ket. Tidak Mampu (SKTM)"),
                        ("pengantar", "Surat Pengantar"),
                        ("kelahiran", "Surat Ket. Kelahiran"),
                        ("kematian", "Surat Ket. Kematian"),
                        ("pindah", "Surat Ket. Pindah"),
                        ("usaha", "Surat Ket. Usaha (SKU)"),
                        ("belum_menikah", "Surat Ket. Belum Menikah"),
                        ("izin_keramaian", "Surat Izin Kegiatan/Hajatan"),
                        ("rekomendasi", "Surat Rekomendasi"),
                    ],
                    max_length=30,
                    unique=True,
                )),
                ("nama", models.CharField(max_length=150)),
                ("deskripsi", models.TextField(blank=True, default="")),
                ("field_tambahan", models.JSONField(
                    blank=True,
                    default=list,
                    help_text="Daftar nama field tambahan yang wajib diisi pemohon",
                )),
                ("is_active", models.BooleanField(default=True)),
                ("urutan", models.IntegerField(default=0, help_text="Urutan tampil (kecil = pertama)")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "jenis_surat", "ordering": ["urutan", "nama"]},
        ),
        migrations.CreateModel(
            name="PermohonanSurat",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("data_form", models.JSONField(default=dict, help_text="Data form yang diisi pemohon")),
                ("keperluan", models.TextField(blank=True, default="", help_text="Keperluan/tujuan pembuatan surat")),
                ("status", models.CharField(
                    choices=[
                        ("diajukan", "Diajukan"),
                        ("diproses", "Sedang Diproses"),
                        ("disetujui", "Disetujui"),
                        ("ditolak", "Ditolak"),
                        ("selesai", "Selesai"),
                    ],
                    default="diajukan",
                    max_length=20,
                )),
                ("catatan_admin", models.TextField(blank=True, default="")),
                ("no_surat", models.CharField(blank=True, max_length=100, null=True, unique=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("jenis", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="permohonan_set",
                    to="surat.jenissurat",
                )),
                ("pemohon", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="permohonan_surat",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("reviewed_by", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="surat_direview",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"db_table": "permohonan_surat", "ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="jenissurat",
            index=models.Index(fields=["is_active"], name="idx_jenis_surat_active"),
        ),
        migrations.AddIndex(
            model_name="permohonanSurat",
            index=models.Index(fields=["pemohon"], name="idx_permohonan_pemohon"),
        ),
        migrations.AddIndex(
            model_name="permohonanSurat",
            index=models.Index(fields=["status"], name="idx_permohonan_status"),
        ),
        migrations.AddIndex(
            model_name="permohonanSurat",
            index=models.Index(fields=["jenis"], name="idx_permohonan_jenis"),
        ),
    ]
