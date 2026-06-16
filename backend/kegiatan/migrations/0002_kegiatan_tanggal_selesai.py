from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("kegiatan", "0001_initial_kegiatan_polling"),
    ]

    operations = [
        migrations.AddField(
            model_name="kegiatan",
            name="tanggal_selesai",
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text="Jam selesai kegiatan (opsional)",
            ),
        ),
    ]
