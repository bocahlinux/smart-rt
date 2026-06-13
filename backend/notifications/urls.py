from django.urls import path

from .views import (
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    PushSubscribeView,
    PushUnsubscribeView,
    VapidPublicKeyView,
)

app_name = "notifications"

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="list"),
    path(
        "notifications/read-all/",
        NotificationMarkAllReadView.as_view(),
        name="read-all",
    ),
    path(
        "notifications/<uuid:pk>/read/",
        NotificationMarkReadView.as_view(),
        name="mark-read",
    ),
    path(
        "notifications/push/subscribe/",
        PushSubscribeView.as_view(),
        name="push-subscribe",
    ),
    path(
        "notifications/push/unsubscribe/",
        PushUnsubscribeView.as_view(),
        name="push-unsubscribe",
    ),
    path(
        "notifications/push/vapid-public-key/",
        VapidPublicKeyView.as_view(),
        name="vapid-key",
    ),
]
