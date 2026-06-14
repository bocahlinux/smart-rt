from django.contrib import admin

from .models import Poll, Vote


@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    list_display = ["pertanyaan", "deadline", "created_by", "is_expired_display", "created_at"]
    list_filter = ["deadline"]
    search_fields = ["pertanyaan"]
    readonly_fields = ["id", "created_at", "updated_at", "created_by"]

    def is_expired_display(self, obj):
        return "✅ Expired" if obj.is_expired else "🟢 Aktif"
    is_expired_display.short_description = "Status"

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ["poll", "user", "opsi_index", "created_at"]
    list_filter = ["poll"]
    search_fields = ["user__email", "poll__pertanyaan"]
    readonly_fields = ["id", "created_at"]
