from django.db import migrations, models


def seed_ketua_rt_to_permissions(apps, schema_editor):
    """Tambahkan ketua_rt ke semua PermissionConfig yang belum memilikinya,
    sesuai dengan DEFAULT_PERMISSIONS terbaru."""
    from accounts.permissions import DEFAULT_PERMISSIONS

    PermissionConfig = apps.get_model("accounts", "PermissionConfig")
    for default in DEFAULT_PERMISSIONS:
        key = default["key"]
        try:
            obj = PermissionConfig.objects.get(key=key)
            default_roles = set(default["allowed_roles"])
            existing_roles = set(obj.allowed_roles)
            missing = default_roles - existing_roles
            if missing:
                obj.allowed_roles = sorted(existing_roles | missing)
                obj.save(update_fields=["allowed_roles"])
        except PermissionConfig.DoesNotExist:
            PermissionConfig.objects.create(
                key=key,
                label=default["label"],
                description=default.get("description", ""),
                category=default.get("category", ""),
                allowed_roles=list(default["allowed_roles"]),
            )


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_permissionconfig'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('admin', 'Admin'),
                    ('ketua_rt', 'Ketua RT'),
                    ('sekretaris', 'Sekretaris'),
                    ('bendahara', 'Bendahara'),
                    ('pengurus', 'Pengurus'),
                    ('warga', 'Warga'),
                ],
                default='warga',
                max_length=20,
            ),
        ),
        migrations.RunPython(
            seed_ketua_rt_to_permissions,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
