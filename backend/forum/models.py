import uuid

from django.db import models

from accounts.models import User


class Thread(models.Model):
    """Thread diskusi forum RT."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Kategori(models.TextChoices):
        KEAMANAN = "keamanan", "Keamanan"
        KEBERSIHAN = "kebersihan", "Kebersihan"
        ACARA = "acara", "Acara"
        USUL = "usul", "Usul"
        LAINNYA = "lainnya", "Lainnya"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PINNED = "pinned", "Pinned"
        LOCKED = "locked", "Locked"

    judul = models.CharField(max_length=255)
    isi = models.TextField()
    kategori = models.CharField(
        max_length=20, choices=Kategori.choices, default=Kategori.LAINNYA
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="threads")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "threads"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["kategori"], name="idx_threads_kategori"),
            models.Index(fields=["status"], name="idx_threads_status"),
            models.Index(fields=["created_by"], name="idx_threads_created_by"),
        ]

    def __str__(self):
        return self.judul


class Comment(models.Model):
    """Komentar dalam thread forum."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name="comments")
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )
    isi = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="forum_comments")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "comments"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["thread"], name="idx_comments_thread"),
            models.Index(fields=["parent"], name="idx_comments_parent"),
        ]

    def __str__(self):
        return f"Comment by {self.created_by} on {self.thread}"


class ThreadVote(models.Model):
    """Upvote user pada thread (satu user satu vote per thread)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="thread_votes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "thread_votes"
        unique_together = ["thread", "user"]
        indexes = [
            models.Index(fields=["thread"], name="idx_thread_votes_thread"),
        ]

    def __str__(self):
        return f"Vote by {self.user} on {self.thread}"
