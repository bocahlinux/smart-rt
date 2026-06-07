import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended User model — RESTRICTED (password hash never exposed).

    Lihat docs/05-DATABASE.md §4.1 dan §5 untuk skema lengkap.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        SEKRETARIS = "sekretaris", "Sekretaris"
        BENDAHARA = "bendahara", "Bendahara"
        PENGURUS = "pengurus", "Pengurus"
        WARGA = "warga", "Warga"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACTIVE = "active", "Active"
        REJECTED = "rejected", "Rejected"

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True)  # SENSITIF
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.WARGA)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "phone"]

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["email"], name="idx_users_email"),
            models.Index(fields=["phone"], name="idx_users_phone"),
            models.Index(fields=["role"], name="idx_users_role"),
            models.Index(fields=["status"], name="idx_users_status"),
        ]

    def __str__(self):
        return self.email
