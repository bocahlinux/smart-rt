from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("keuangan", "0002_pengaturan_iuran"),
    ]

    operations = [
        migrations.AddField(
            model_name="pengaturaniuran",
            name="saldo_awal",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                help_text="Saldo awal kas RT saat pertama kali go-production (Rp)",
                max_digits=15,
            ),
        ),
    ]
