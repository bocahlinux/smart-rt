from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_wargaprofile_user_nullable'),
    ]

    operations = [
        migrations.CreateModel(
            name='PermissionConfig',
            fields=[
                ('key', models.CharField(max_length=64, primary_key=True, serialize=False)),
                ('label', models.CharField(max_length=100)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('category', models.CharField(blank=True, max_length=64)),
                ('allowed_roles', models.JSONField(default=list)),
            ],
            options={
                'db_table': 'permission_configs',
                'ordering': ['category', 'key'],
            },
        ),
    ]
