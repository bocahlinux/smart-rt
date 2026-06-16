from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("surat", "0003_pengaturan_rt"),
    ]

    operations = [
        migrations.AddField(
            model_name="pengaturanrt",
            name="logo",
            field=models.ImageField(blank=True, null=True, upload_to="pengaturan-rt/logo/"),
        ),
    ]
