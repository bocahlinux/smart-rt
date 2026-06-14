"""Settings for running the test suite (pytest + APITestCase)."""

from .base import *  # noqa: F401,F403

DEBUG = False

# SQLite untuk test — tidak butuh PostgreSQL running
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test_db.sqlite3",  # noqa: F405
    }
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",  # Hash cepat khusus untuk test
]

MEDIA_ROOT = BASE_DIR / "test_media"  # noqa: F405
