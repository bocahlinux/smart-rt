import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_wargaprofile_kartu_keluarga_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='wargaprofile',
            name='user',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='profile',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
