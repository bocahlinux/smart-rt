"""Settings for running the test suite (pytest + APITestCase)."""

from .base import *  # noqa: F401,F403

DEBUG = False

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",  # Hash cepat khusus untuk test
]

MEDIA_ROOT = BASE_DIR / "test_media"  # noqa: F405
