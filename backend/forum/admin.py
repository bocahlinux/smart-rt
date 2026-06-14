from django.contrib import admin

from .models import Comment, Thread, ThreadVote


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    """Django admin untuk Thread diskusi forum."""

    list_display = ["judul", "kategori", "status", "created_by", "created_at"]
    list_filter = ["kategori", "status", "created_at"]
    search_fields = ["judul", "isi", "created_by__email"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering = ["-created_at"]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """Django admin untuk Comment forum."""

    list_display = ["thread", "created_by", "parent", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["isi", "created_by__email", "thread__judul"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering = ["-created_at"]


@admin.register(ThreadVote)
class ThreadVoteAdmin(admin.ModelAdmin):
    """Django admin untuk ThreadVote (upvote)."""

    list_display = ["thread", "user", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["thread__judul", "user__email"]
    readonly_fields = ["id", "created_at"]
    ordering = ["-created_at"]
