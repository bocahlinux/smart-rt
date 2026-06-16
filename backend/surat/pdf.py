"""PDF generation untuk surat menyurat RT menggunakan WeasyPrint."""
from __future__ import annotations

import base64
from datetime import date
from pathlib import Path

from django.template.loader import render_to_string

BULAN_ID = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

STATUS_PERKAWINAN_LABEL = {
    "belum_kawin": "Belum Kawin",
    "kawin": "Kawin",
    "cerai_hidup": "Cerai Hidup",
    "cerai_mati": "Cerai Mati",
}


def _ttd_as_base64(pengaturan) -> str | None:
    if not pengaturan.tanda_tangan:
        return None
    try:
        path = pengaturan.tanda_tangan.path
        data = Path(path).read_bytes()
        ext = Path(path).suffix.lower().lstrip(".")
        mime = "image/png" if ext == "png" else "image/jpeg"
        return f"data:{mime};base64,{base64.b64encode(data).decode()}"
    except (FileNotFoundError, OSError, ValueError):
        return None


def generate_pdf(permohonan) -> bytes:
    """Render HTML template lalu konversi ke PDF bytes via WeasyPrint."""
    from weasyprint import HTML

    from .models import PengaturanRT

    pengaturan = PengaturanRT.get_instance()
    pemohon = permohonan.pemohon
    profile = getattr(pemohon, "profile", None)

    today = date.today()
    tanggal_str = f"{today.day} {BULAN_ID[today.month]} {today.year}"

    # Build TTL string
    if profile and profile.tanggal_lahir:
        tgl = profile.tanggal_lahir
        ttl = f"{profile.tempat_lahir or '-'}, {tgl.day} {BULAN_ID[tgl.month]} {tgl.year}"
    elif profile and profile.tempat_lahir:
        ttl = profile.tempat_lahir
    else:
        ttl = "-"

    context = {
        "permohonan": permohonan,
        "pengaturan": pengaturan,
        "profile": profile,
        "tanggal_str": tanggal_str,
        "ttd_base64": _ttd_as_base64(pengaturan),
        "nama_pemohon": profile.nama_lengkap if profile else pemohon.email,
        "nik_pemohon": (profile.nik or "-") if profile else "-",
        "alamat_pemohon": (profile.alamat or "-") if profile else "-",
        "pekerjaan_pemohon": (profile.pekerjaan or "-") if profile else "-",
        "ttl_pemohon": ttl,
        "jenis_kelamin_pemohon": (
            "Laki-laki" if profile and profile.jenis_kelamin == "L" else
            "Perempuan" if profile and profile.jenis_kelamin == "P" else "-"
        ),
        "agama_pemohon": (profile.agama or "-") if profile else "-",
        "status_perkawinan_pemohon": (
            STATUS_PERKAWINAN_LABEL.get(profile.status_perkawinan, profile.status_perkawinan or "-")
            if profile else "-"
        ),
        # Extra form fields as key-value pairs (excluding fields already shown separately)
        "data_form_items": [
            (k.replace("_", " ").title(), v)
            for k, v in (permohonan.data_form or {}).items()
            if k not in {
                "nama_bayi", "tanggal_lahir", "nama_ayah", "nama_ibu",
                "nama_almarhum", "tanggal_meninggal", "alamat_tujuan",
                "nama_usaha", "jenis_usaha", "alamat_usaha",
                "nama_kegiatan", "tanggal_kegiatan", "jumlah_tamu_perkiraan",
                "tujuan_penggunaan", "tujuan_instansi", "tujuan_rekomendasi",
            }
        ],
    }

    html_str = render_to_string("surat/letter.html", context)
    pdf_bytes: bytes = HTML(string=html_str, base_url=None).write_pdf()
    return pdf_bytes
