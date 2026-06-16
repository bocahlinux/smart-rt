import uuid

from django.db import models
from django.utils import timezone

from accounts.models import User


class Poll(models.Model):
    """Polling / voting untuk keputusan bersama warga RT."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    pertanyaan = models.CharField(max_length=500)

    # Daftar opsi disimpan sebagai JSON array, misal: ["Sabtu pagi", "Minggu sore"]
    opsi = models.JSONField()

    starts_at = models.DateTimeField(null=True, blank=True, help_text="Waktu mulai voting (null = segera)")
    deadline = models.DateTimeField()

    created_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="polls_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "polls"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["deadline"], name="idx_polls_deadline"),
            models.Index(fields=["created_by"], name="idx_polls_created_by"),
        ]

    def __str__(self):
        return self.pertanyaan

    @property
    def is_expired(self):
        """True jika deadline sudah lewat."""
        return timezone.now() > self.deadline

    def get_results(self):
        """Hitung vote per opsi. Return dict {opsi_label: count}."""
        results = {opsi: 0 for opsi in self.opsi}
        for vote in self.votes.all():
            if 0 <= vote.opsi_index < len(self.opsi):
                results[self.opsi[vote.opsi_index]] += 1
        return results

    def total_votes(self):
        """Total jumlah vote yang masuk."""
        return self.votes.count()


class Vote(models.Model):
    """Vote user pada sebuah Poll (satu user satu vote per poll)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="votes")

    # Index pilihan opsi (0-based) — sesuai urutan Poll.opsi list
    opsi_index = models.IntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "votes"
        # Constraint: 1 user hanya bisa vote 1 kali per poll
        unique_together = [["poll", "user"]]
        indexes = [
            models.Index(fields=["poll"], name="idx_votes_poll"),
            models.Index(fields=["user"], name="idx_votes_user"),
        ]

    def __str__(self):
        return f"Vote by {self.user.email} on {self.poll.pertanyaan[:40]}"
