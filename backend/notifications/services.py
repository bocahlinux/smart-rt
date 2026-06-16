"""
Notification services:
- create_notification: buat Notification in-app untuk user tertentu
- broadcast_pengumuman: buat notif + kirim web push ke semua user
- send_web_push: kirim satu web push ke subscription endpoint
"""

import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def create_notification(user, judul, isi, tipe="info", pengumuman=None, link=""):
    """Buat Notification in-app untuk user."""
    from .models import Notification  # noqa: PLC0415

    return Notification.objects.create(
        user=user,
        judul=judul,
        isi=isi,
        tipe=tipe,
        pengumuman=pengumuman,
        link=link or "",
    )


def send_web_push(subscription, judul, isi):
    """Kirim Web Push ke satu PushSubscription. Abaikan jika VAPID belum dikonfigurasi."""
    private_pem = getattr(settings, "VAPID_PRIVATE_PEM", "")
    claim_email = getattr(settings, "VAPID_CLAIM_EMAIL", "mailto:admin@smartrt.local")

    if not private_pem or "PRIVATE KEY" not in private_pem:
        logger.debug("VAPID_PRIVATE_PEM tidak dikonfigurasi — skip web push.")
        return

    try:
        from pywebpush import webpush, WebPushException  # noqa: PLC0415

        payload = json.dumps({"judul": judul, "isi": isi[:160]})
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh,
                    "auth": subscription.auth,
                },
            },
            data=payload,
            vapid_private_key=private_pem,
            vapid_claims={"sub": claim_email},
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Web push gagal (endpoint=%s): %s", subscription.endpoint[:40], exc)


def notify_user(user, judul, isi, tipe="info", url=None):
    """Kirim notifikasi in-app + web push ke satu user."""
    from .models import PushSubscription  # noqa: PLC0415

    create_notification(user=user, judul=judul, isi=isi, tipe=tipe, link=url or "")
    for sub in PushSubscription.objects.filter(user=user):
        _send_push_with_url(sub, judul, isi, url)


def notify_admins(judul, isi, url=None):
    """Kirim notifikasi ke semua user dengan role admin/sekretaris/pengurus."""
    from accounts.models import User  # noqa: PLC0415
    from .models import PushSubscription  # noqa: PLC0415

    admins = User.objects.filter(role__in=["admin", "sekretaris", "pengurus"], is_active=True)
    for user in admins:
        create_notification(user=user, judul=judul, isi=isi, tipe="penting", link=url or "")
        for sub in PushSubscription.objects.filter(user=user):
            _send_push_with_url(sub, judul, isi, url)


def _send_push_with_url(subscription, judul, isi, url=None):
    """Kirim web push dengan field url opsional untuk navigasi saat notif diklik."""
    private_pem = getattr(settings, "VAPID_PRIVATE_PEM", "")
    claim_email = getattr(settings, "VAPID_CLAIM_EMAIL", "mailto:admin@smartrt.local")

    if not private_pem or "PRIVATE KEY" not in private_pem:
        return

    try:
        from pywebpush import webpush, WebPushException  # noqa: PLC0415

        payload = json.dumps({"judul": judul, "isi": isi[:160], "url": url or "/"})
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
            },
            data=payload,
            vapid_private_key=private_pem,
            vapid_claims={"sub": claim_email},
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Web push gagal (endpoint=%s): %s", subscription.endpoint[:40], exc)


def broadcast_pengumuman(pengumuman):
    """
    Setelah pengumuman dibuat:
    1. Buat Notification in-app untuk semua user aktif
    2. Kirim Web Push ke semua PushSubscription
    """
    from accounts.models import User  # noqa: PLC0415
    from .models import PushSubscription  # noqa: PLC0415

    tipe = pengumuman.kategori if pengumuman.kategori in {"penting", "acara", "keamanan"} else "info"

    # In-app notifications
    users = User.objects.filter(is_active=True)
    notifications = [
        create_notification(
            user=u,
            judul=pengumuman.judul,
            isi=pengumuman.isi[:200],
            tipe=tipe,
            pengumuman=pengumuman,
        )
        for u in users
    ]
    logger.info("Broadcast pengumuman '%s' → %d notifikasi dibuat.", pengumuman.judul, len(notifications))

    # Web Push
    subscriptions = PushSubscription.objects.all()
    for sub in subscriptions:
        send_web_push(sub, pengumuman.judul, pengumuman.isi[:160])
