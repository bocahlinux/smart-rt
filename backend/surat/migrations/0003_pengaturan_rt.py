from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("surat", "0002_seed_jenis_surat"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PengaturanRT",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("nama_rt", models.CharField(default="RT 04", max_length=20)),
                ("nama_rw", models.CharField(default="RW 03", max_length=20)),
                ("kelurahan", models.CharField(default="Kelurahan ...", max_length=100)),
                ("kecamatan", models.CharField(default="Kecamatan ...", max_length=100)),
                ("kota", models.CharField(default="Kota ...", max_length=100)),
                ("provinsi", models.CharField(default="Jawa Timur", max_length=100)),
                ("kode_pos", models.CharField(blank=True, default="", max_length=10)),
                ("nama_ketua_rt", models.CharField(blank=True, default="", max_length=255)),
                ("nik_ketua_rt", models.CharField(blank=True, default="", max_length=16)),
                ("tanda_tangan", models.ImageField(blank=True, null=True, upload_to="pengaturan-rt/ttd/")),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("updated_by", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="pengaturan_rt_updated",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"db_table": "pengaturan_rt", "verbose_name": "Pengaturan RT"},
        ),
    ]
