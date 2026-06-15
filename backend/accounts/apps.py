from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        from django.db.models.signals import post_migrate

        def _seed_permissions(sender, **kwargs):
            try:
                from accounts.permissions import seed_default_permissions

                seed_default_permissions()
            except Exception:  # noqa: BLE001
                pass

        post_migrate.connect(_seed_permissions, sender=self)
