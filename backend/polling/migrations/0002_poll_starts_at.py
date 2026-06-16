from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("polling", "0001_initial_kegiatan_polling"),
    ]

    operations = [
        migrations.AddField(
            model_name="poll",
            name="starts_at",
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text="Waktu mulai voting (null = segera)",
            ),
        ),
    ]
