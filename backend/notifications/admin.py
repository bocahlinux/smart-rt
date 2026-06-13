from django.contrib import admin

from .models import Notification, PushSubscription


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["judul", "user", "tipe", "is_read", "created_at"]
    list_filter = ["tipe", "is_read"]
    search_fields = ["judul", "user__email"]
    readonly_fields = ["id", "created_at"]


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "created_at"]
    search_fields = ["user__email", "endpoint"]
    readonly_fields = ["id", "created_at"]
