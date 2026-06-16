from datetime import date

from django.db.models import Sum
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User, WargaProfile
from accounts.permissions import has_perm
from kartu_keluarga.models import PengajuanAnggotaBaru, PengajuanPenghapusanAnggota, PengajuanPerubahanWarga, KartuKeluarga
from kegiatan.models import Kegiatan
from keuangan.models import IuranWarga, PengaturanIuran, Transaksi
from pengaduan.models import Pengaduan
from pengumuman.models import Pengumuman
from polling.models import Poll


class IsPengurus(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and has_perm(request.user, "akses_dashboard_pengurus")


class DashboardPengurusView(APIView):
    permission_classes = [IsPengurus]

    def get(self, request):
        today = date.today()
        now = timezone.now()
        bulan = today.month
        tahun = today.year
        bulan_awal = today.replace(day=1)

        # ── Warga & KK ──
        total_warga = User.objects.filter(status="active", role="warga").count()
        warga_aktif = WargaProfile.objects.filter(is_deleted=False, status="aktif").count()
        total_kk = KartuKeluarga.objects.count()
        warga_baru_bulan_ini = WargaProfile.objects.filter(
            is_deleted=False, created_at__date__gte=bulan_awal
        ).count()

        # ── Keuangan ──
        saldo_pemasukan = float(
            Transaksi.objects.filter(tipe="pemasukan", status="confirmed").aggregate(
                total=Sum("jumlah")
            )["total"] or 0
        )
        saldo_pengeluaran = float(
            Transaksi.objects.filter(tipe="pengeluaran", status="confirmed").aggregate(
                total=Sum("jumlah")
            )["total"] or 0
        )
        iuran_lunas_total = float(
            IuranWarga.objects.filter(status="lunas").aggregate(
                total=Sum("jumlah")
            )["total"] or 0
        )
        saldo_awal_pengaturan = float(PengaturanIuran.get_instance().saldo_awal)
        saldo_kas = saldo_awal_pengaturan + saldo_pemasukan + iuran_lunas_total - saldo_pengeluaran

        # ── Iuran bulan ini ──
        iuran_lunas = IuranWarga.objects.filter(bulan=bulan, tahun=tahun, status="lunas").count()
        iuran_bulan_pending = IuranWarga.objects.filter(bulan=bulan, tahun=tahun, status="pending").count()
        # Total pending (semua bulan) — untuk badge konfirmasi
        iuran_pending_total = IuranWarga.objects.filter(status="pending").count()

        # ── Warga belum lunas — KK-aware ──
        lunas_kk_ids = IuranWarga.objects.filter(
            bulan=bulan, tahun=tahun, status="lunas", jenis__unit="per_kk",
        ).values_list("warga__kartu_keluarga_id", flat=True).distinct()
        lunas_warga_ids = IuranWarga.objects.filter(
            bulan=bulan, tahun=tahun, status="lunas", jenis__unit="per_warga",
        ).values_list("warga_id", flat=True)
        if not IuranWarga.objects.filter(bulan=bulan, tahun=tahun, jenis__unit="per_kk").exists():
            lunas_warga_ids = IuranWarga.objects.filter(
                bulan=bulan, tahun=tahun, status="lunas",
            ).values_list("warga_id", flat=True)
            lunas_kk_ids = []
        warga_belum_lunas_qs = (
            WargaProfile.objects.filter(is_deleted=False, status="aktif")
            .exclude(id__in=lunas_warga_ids)
            .exclude(kartu_keluarga_id__in=lunas_kk_ids)
            .select_related("kartu_keluarga")
            .order_by("blok", "no_rumah", "nama_lengkap")[:30]
        )
        warga_belum_lunas = [
            {
                "id": str(w.id),
                "namaLengkap": w.nama_lengkap,
                "blok": w.blok or "",
                "noRumah": w.no_rumah or "",
                "noKk": w.kartu_keluarga.no_kk if w.kartu_keluarga else None,
            }
            for w in warga_belum_lunas_qs
        ]

        # ── Pengaduan ──
        pengaduan_aktif = Pengaduan.objects.filter(status__in=["diajukan", "diproses"]).count()
        pengaduan_selesai = Pengaduan.objects.filter(status="selesai").count()
        pengaduan_terbaru_qs = (
            Pengaduan.objects.filter(status__in=["diajukan", "diproses"])
            .order_by("-created_at")[:5]
        )
        pengaduan_terbaru = [
            {
                "id": str(p.id),
                "judul": p.judul,
                "status": p.status,
                "createdAt": p.created_at.isoformat(),
            }
            for p in pengaduan_terbaru_qs
        ]

        # ── Kegiatan mendatang ──
        kegiatan_mendatang_count = Kegiatan.objects.filter(tanggal__date__gte=today).count()
        kegiatan_qs = Kegiatan.objects.filter(tanggal__date__gte=today).order_by("tanggal")[:5]
        kegiatan_mendatang_list = [
            {
                "id": str(k.id),
                "nama": k.nama,
                "tanggal": k.tanggal.isoformat(),
                "lokasi": k.lokasi,
            }
            for k in kegiatan_qs
        ]

        # ── Pengumuman terbaru ──
        pengumuman_qs = Pengumuman.objects.filter(is_published=True).order_by("-created_at")[:5]
        pengumuman_terbaru = [
            {
                "id": str(p.id),
                "judul": p.judul,
                "kategori": p.kategori,
                "createdAt": p.created_at.isoformat(),
            }
            for p in pengumuman_qs
        ]

        # ── Pengajuan KK pending ──
        pengajuan_kk_pending = (
            PengajuanAnggotaBaru.objects.filter(status="pending").count()
            + PengajuanPenghapusanAnggota.objects.filter(status="pending").count()
            + PengajuanPerubahanWarga.objects.filter(status="pending").count()
        )

        # ── Polling aktif ──
        polling_aktif = Poll.objects.filter(deadline__gt=now).count()

        return Response(
            {
                "role": request.user.role,
                "totalWarga": total_warga,
                "wargaAktif": warga_aktif,
                "totalKk": total_kk,
                "wargaBaruBulanIni": warga_baru_bulan_ini,
                "saldoKas": saldo_kas,
                "pengaduanAktif": pengaduan_aktif,
                "pengaduanSelesai": pengaduan_selesai,
                "kegiatanMendatang": kegiatan_mendatang_count,
                "iuranBulanIni": {
                    "bulan": bulan,
                    "tahun": tahun,
                    "lunas": iuran_lunas,
                    "pending": iuran_bulan_pending,
                },
                "iuranPending": iuran_pending_total,
                "wargaBelumLunas": warga_belum_lunas,
                "pengajuanKkPending": pengajuan_kk_pending,
                "pollingAktif": polling_aktif,
                "kegiatanMendatangList": kegiatan_mendatang_list,
                "pengumumanTerbaru": pengumuman_terbaru,
                "pengaduanTerbaru": pengaduan_terbaru,
            }
        )


class DashboardWargaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = date.today()
        bulan = today.month
        tahun = today.year

        # Status iuran bulan ini — WargaProfile linked via user
        iuran_status = None
        try:
            profile = request.user.profile
            iuran = IuranWarga.objects.filter(
                warga=profile, bulan=bulan, tahun=tahun
            ).first()
            if iuran:
                iuran_status = {
                    "status": iuran.status,
                    "jumlah": float(iuran.jumlah),
                    "bulan": bulan,
                    "tahun": tahun,
                }
            else:
                iuran_status = {"status": "belum_bayar", "bulan": bulan, "tahun": tahun}
        except Exception:
            iuran_status = {"status": "belum_bayar", "bulan": bulan, "tahun": tahun}

        # Pengumuman terbaru (5 terakhir yang sudah dipublikasikan)
        pengumuman_qs = Pengumuman.objects.filter(is_published=True).order_by(
            "-created_at"
        )[:5]
        pengumuman_list = [
            {
                "id": str(p.id),
                "judul": p.judul,
                "kategori": p.kategori,
                "createdAt": p.created_at.isoformat(),
            }
            for p in pengumuman_qs
        ]

        # Pengaduan saya
        pengaduan_qs = Pengaduan.objects.filter(warga=request.user).order_by(
            "-created_at"
        )[:5]
        pengaduan_list = [
            {
                "id": str(p.id),
                "judul": p.judul,
                "status": p.status,
                "createdAt": p.created_at.isoformat(),
            }
            for p in pengaduan_qs
        ]

        # Kegiatan mendatang (3 terdekat)
        kegiatan_qs = Kegiatan.objects.filter(tanggal__date__gte=today).order_by(
            "tanggal"
        )[:3]
        kegiatan_list = [
            {
                "id": str(k.id),
                "nama": k.nama,
                "tanggal": k.tanggal.isoformat(),
                "lokasi": k.lokasi,
            }
            for k in kegiatan_qs
        ]

        # Info profil warga
        profile_info = None
        try:
            profile = request.user.profile
            kk_obj = profile.kartu_keluarga
            profile_info = {
                "namaLengkap": profile.nama_lengkap,
                "noKk": kk_obj.no_kk if kk_obj else None,
                "jumlahAnggotaKK": kk_obj.anggota.filter(is_deleted=False).count() if kk_obj else 0,
                "kartuKeluargaId": str(kk_obj.id) if kk_obj else None,
            }
        except Exception:
            pass

        # Riwayat iuran 3 bulan terakhir
        riwayat_iuran = []
        try:
            profile = request.user.profile
            for i in range(3):
                b = bulan - i
                t = tahun
                while b <= 0:
                    b += 12
                    t -= 1
                record = IuranWarga.objects.filter(warga=profile, bulan=b, tahun=t).first()
                riwayat_iuran.append({
                    "bulan": b,
                    "tahun": t,
                    "status": record.status if record else "belum_bayar",
                })
        except Exception:
            pass

        return Response(
            {
                "profileInfo": profile_info,
                "iuranBulanIni": iuran_status,
                "riwayatIuran": riwayat_iuran,
                "pengumumanTerbaru": pengumuman_list,
                "pengaduanSaya": pengaduan_list,
                "kegiatanMendatang": kegiatan_list,
            }
        )
