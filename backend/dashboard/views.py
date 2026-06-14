from datetime import date

from django.db.models import Q, Sum
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User, WargaProfile
from kegiatan.models import Kegiatan
from keuangan.models import IuranWarga, Transaksi
from pengaduan.models import Pengaduan
from pengumuman.models import Pengumuman

PENGURUS_ROLES = {"admin", "sekretaris", "bendahara", "pengurus"}


class IsPengurus(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in PENGURUS_ROLES


class DashboardPengurusView(APIView):
    permission_classes = [IsPengurus]

    def get(self, request):
        today = date.today()
        bulan = today.month
        tahun = today.year

        total_warga = User.objects.filter(status="active", role="warga").count()
        warga_aktif = WargaProfile.objects.filter(is_deleted=False, status="aktif").count()

        saldo_pemasukan = (
            Transaksi.objects.filter(tipe="pemasukan", status="confirmed").aggregate(
                total=Sum("jumlah")
            )["total"]
            or 0
        )
        saldo_pengeluaran = (
            Transaksi.objects.filter(tipe="pengeluaran", status="confirmed").aggregate(
                total=Sum("jumlah")
            )["total"]
            or 0
        )
        saldo_kas = saldo_pemasukan - saldo_pengeluaran

        pengaduan_aktif = Pengaduan.objects.filter(
            status__in=["diajukan", "diproses"]
        ).count()
        pengaduan_selesai = Pengaduan.objects.filter(status="selesai").count()

        kegiatan_mendatang = Kegiatan.objects.filter(tanggal__date__gte=today).count()

        iuran_lunas = IuranWarga.objects.filter(
            bulan=bulan, tahun=tahun, status="lunas"
        ).count()
        iuran_pending = IuranWarga.objects.filter(
            bulan=bulan, tahun=tahun, status="pending"
        ).count()

        return Response(
            {
                "totalWarga": total_warga,
                "wargaAktif": warga_aktif,
                "saldoKas": float(saldo_kas),
                "pengaduanAktif": pengaduan_aktif,
                "pengaduanSelesai": pengaduan_selesai,
                "kegiatanMendatang": kegiatan_mendatang,
                "iuranBulanIni": {
                    "bulan": bulan,
                    "tahun": tahun,
                    "lunas": iuran_lunas,
                    "pending": iuran_pending,
                },
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

        return Response(
            {
                "iuranBulanIni": iuran_status,
                "pengumumanTerbaru": pengumuman_list,
                "pengaduanSaya": pengaduan_list,
                "kegiatanMendatang": kegiatan_list,
            }
        )
