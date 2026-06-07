import re

from django.core.exceptions import ValidationError


class PasswordComplexityValidator:
    """Wajibkan password mengandung huruf besar, huruf kecil, dan angka.

    Lihat docs/02-SRS.md FR-AUTH-10 dan docs/11-SECURITY.md §4.2:
    minimal 8 karakter (ditangani MinimumLengthValidator), 1 huruf besar,
    1 huruf kecil, 1 angka.
    """

    def validate(self, password, user=None):
        errors = []
        if not re.search(r"[A-Z]", password):
            errors.append("Password harus mengandung minimal satu huruf besar.")
        if not re.search(r"[a-z]", password):
            errors.append("Password harus mengandung minimal satu huruf kecil.")
        if not re.search(r"\d", password):
            errors.append("Password harus mengandung minimal satu angka.")
        if errors:
            raise ValidationError(errors, code="password_too_weak")

    def get_help_text(self):
        return "Password harus mengandung huruf besar, huruf kecil, dan angka."
