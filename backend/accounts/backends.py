from django.contrib.auth.backends import ModelBackend

from .models import User


class CaseInsensitiveEmailBackend(ModelBackend):
    """Login by email, case-insensitive — registrasi sudah mengecek duplikasi
    email dengan `__iexact` (lihat serializers.py), tapi `ModelBackend` bawaan
    melakukan lookup case-sensitive. Tanpa ini, user yang daftar dengan
    "Budi@Gmail.com" tidak bisa login memakai "budi@gmail.com"."""

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        if username is None or password is None:
            return None
        try:
            user = User.objects.get(email__iexact=username)
        except User.DoesNotExist:
            return None
        except User.MultipleObjectsReturned:
            user = User.objects.filter(email__iexact=username).order_by("created_at").first()

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
