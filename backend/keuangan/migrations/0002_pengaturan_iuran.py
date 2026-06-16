from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('keuangan', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PengaturanIuran',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nominal_default', models.DecimalField(decimal_places=2, default=50000, help_text='Nominal default iuran bulanan warga (Rp)', max_digits=15)),
                ('keterangan', models.TextField(blank=True, default='', help_text='Deskripsi iuran bulanan')),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pengaturan_iuran_updated', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Pengaturan Iuran',
                'db_table': 'pengaturan_iuran',
            },
        ),
    ]
