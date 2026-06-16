"""
Pengaduan services:
- notify_status_change: kirim in-app notification ke pelapor saat status diperbarui
"""

import logging

logger = logging.getLogger(__name__)

STATUS_LABELS = {
    "diajukan": "Diajukan",
    "diproses": "Sedang Diproses",
    "selesai": "Selesai",
    "ditolak": "Ditolak",
}


def notify_status_change(pengaduan, new_status: str, keterangan: str = "") -> None:
    """Kirim in-app notification ke pelapor pengaduan saat status diperbarui.

    Sesuai task 7.4 (Notifikasi perubahan status) di 07-TASK-BREAKDOWN.md.
    """
    from notifications.services import create_notification  # noqa: PLC0415

    label = STATUS_LABELS.get(new_status, new_status)
    judul = f"Pengaduan Diperbarui: {pengaduan.judul[:60]}"
    isi_parts = [f"Status pengaduan Anda berubah menjadi '{label}'."]
    if keterangan:
        isi_parts.append(f"Keterangan: {keterangan[:200]}")
    isi = " ".join(isi_parts)

    try:
        create_notification(
            user=pengaduan.warga,
            judul=judul,
            isi=isi,
            tipe="info",
            link="/pengaduan",
        )
        logger.info(
            "Notifikasi status pengaduan '%s' → '%s' dikirim ke %s.",
            pengaduan.judul,
            new_status,
            pengaduan.warga.email,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Gagal mengirim notifikasi pengaduan (id=%s): %s",
            pengaduan.id,
            exc,
        )
