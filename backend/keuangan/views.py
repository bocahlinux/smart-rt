"""Views keuangan RT — transaksi, kategori, iuran warga, dashboard, laporan PDF."""

import io
import uuid
from datetime import date

from decimal import Decimal

from django.db.models import Q, Sum
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsBendahara
from audit.services import log_action
from .filters import IuranWargaFilter, TransaksiFilter
from .models import IuranWarga, JenisIuran, KategoriTransaksi, PengaturanIuran, Transaksi
from .permissions import IsBendaharaOrAdmin, IsOwnerIuranOrBendahara
from .serializers import (
    DashboardKeuanganSerializer,
    IuranKonfirmasiSerializer,
    IuranWargaListSerializer,
    IuranWargaUploadSerializer,
    JenisIuranSerializer,
    KategoriTransaksiSerializer,
    PengaturanIuranSerializer,
    TransaksiCreateSerializer,
    TransaksiListSerializer,
    WargaIuranSerializer,
)


class JenisIuranViewSet(viewsets.ModelViewSet):
    """CRUD jenis/kategori iuran — list terbuka untuk semua user login, CUD hanya bendahara/admin."""

    queryset = JenisIuran.objects.all()
    serializer_class = JenisIuranSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        return [IsBendaharaOrAdmin()]

    def list(self, request, *args, **kwargs):
        aktif_only = request.query_params.get("aktif", "").lower() in ("1", "true", "yes")
        qs = self.get_queryset()
        if aktif_only:
            qs = qs.filter(is_active=True)
        serializer = self.get_serializer(qs, many=True)
        return Response({"status": "success", "data": serializer.data})

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response({"status": "success", "data": serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        log_action(user=request.user, action="create", table_name="jenis_iuran",
                   record_id=instance.id, new_data={"nama": instance.nama, "tipe": instance.tipe}, request=request)
        return Response({"status": "success", "data": serializer.data, "message": "Jenis iuran berhasil ditambahkan"},
                        status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        log_action(user=request.user, action="update", table_name="jenis_iuran",
                   record_id=instance.id, new_data={"nama": instance.nama, "nominal": str(instance.nominal)}, request=request)
        return Response({"status": "success", "data": self.get_serializer(instance).data})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.iuran_set.exists():
            return Response({"status": "error", "message": "Jenis iuran tidak dapat dihapus karena sudah memiliki data iuran.",
                             "code": "HAS_RELATED_DATA"}, status=status.HTTP_400_BAD_REQUEST)
        log_action(user=request.user, action="delete", table_name="jenis_iuran",
                   record_id=instance.id, old_data={"nama": instance.nama}, request=request)
        instance.delete()
        return Response({"status": "success", "message": "Jenis iuran berhasil dihapus"})


class KategoriTransaksiViewSet(viewsets.ModelViewSet):
    """CRUD kategori transaksi — hanya bendahara/admin."""

    queryset = KategoriTransaksi.objects.all()
    serializer_class = KategoriTransaksiSerializer
    permission_classes = [IsBendaharaOrAdmin]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsBendaharaOrAdmin()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        log_action(
            user=request.user,
            action="create",
            table_name="kategori_transaksi",
            record_id=instance.id,
            new_data={"nama": instance.nama, "tipe": instance.tipe},
            request=request,
        )
        return Response(
            {"status": "success", "data": serializer.data, "message": "Kategori berhasil ditambahkan"},
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        log_action(
            user=request.user,
            action="update",
            table_name="kategori_transaksi",
            record_id=instance.id,
            new_data={"nama": instance.nama, "tipe": instance.tipe},
            request=request,
        )
        return Response({"status": "success", "data": serializer.data})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        log_action(
            user=request.user,
            action="delete",
            table_name="kategori_transaksi",
            record_id=instance.id,
            old_data={"nama": instance.nama, "tipe": instance.tipe},
            request=request,
        )
        self.perform_destroy(instance)
        return Response({"status": "success", "message": "Kategori berhasil dihapus"})

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        return Response({"status": "success", "data": serializer.data})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({"status": "success", "data": serializer.data})


class TransaksiViewSet(viewsets.ModelViewSet):
    """CRUD transaksi keuangan RT — hanya bendahara/admin."""

    queryset = Transaksi.objects.select_related("kategori", "created_by", "confirmed_by")
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TransaksiFilter
    ordering_fields = ["tanggal", "jumlah", "created_at"]
    ordering = ["-tanggal"]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsBendaharaOrAdmin()]
        return [IsBendaharaOrAdmin()]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return TransaksiCreateSerializer
        return TransaksiListSerializer

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        serializer = TransaksiListSerializer(page or qs, many=True, context={"request": request})
        if page is not None:
            paginator = self.paginator
            return Response({
                "status": "success",
                "data": serializer.data,
                "pagination": {
                    "page": paginator.page.number,
                    "limit": paginator.page_size,
                    "total": paginator.page.paginator.count,
                    "totalPages": paginator.page.paginator.num_pages,
                },
            })
        return Response({"status": "success", "data": serializer.data})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = TransaksiListSerializer(instance, context={"request": request})
        return Response({"status": "success", "data": serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = TransaksiCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        log_action(
            user=request.user,
            action="create",
            table_name="transaksi",
            record_id=instance.id,
            new_data={
                "jumlah": str(instance.jumlah),
                "tipe": instance.tipe,
                "tanggal": str(instance.tanggal),
                "keterangan": instance.keterangan,
            },
            request=request,
        )
        return Response(
            {
                "status": "success",
                "data": {"id": str(instance.id), "jumlah": str(instance.jumlah)},
                "message": "Transaksi berhasil ditambahkan",
            },
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        # Cegah edit transaksi yang terkunci
        old_data = {
            "jumlah": str(instance.jumlah),
            "tipe": instance.tipe,
            "tanggal": str(instance.tanggal),
        }
        serializer = TransaksiCreateSerializer(
            instance, data=request.data, partial=partial, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        log_action(
            user=request.user,
            action="update",
            table_name="transaksi",
            record_id=instance.id,
            old_data=old_data,
            new_data={
                "jumlah": str(instance.jumlah),
                "tipe": instance.tipe,
                "tanggal": str(instance.tanggal),
                "keterangan": instance.keterangan,
            },
            request=request,
        )
        return Response({"status": "success", "data": {"id": str(instance.id)}, "message": "Transaksi berhasil diperbarui"})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        log_action(
            user=request.user,
            action="delete",
            table_name="transaksi",
            record_id=instance.id,
            old_data={
                "jumlah": str(instance.jumlah),
                "tipe": instance.tipe,
                "tanggal": str(instance.tanggal),
            },
            request=request,
        )
        self.perform_destroy(instance)
        return Response({"status": "success", "message": "Transaksi berhasil dihapus"})

    @action(detail=False, methods=["get"], url_path="laporan")
    def laporan(self, request):
        """Export laporan keuangan PDF — bendahara/admin."""
        dari_str = request.query_params.get("dari")
        sampai_str = request.query_params.get("sampai")
        tahun = request.query_params.get("tahun", date.today().year)

        qs = Transaksi.objects.select_related("kategori", "created_by").filter(
            status=Transaksi.Status.CONFIRMED
        )
        if dari_str:
            qs = qs.filter(tanggal__gte=dari_str)
        if sampai_str:
            qs = qs.filter(tanggal__lte=sampai_str)

        total_pemasukan = qs.filter(tipe="pemasukan").aggregate(total=Sum("jumlah"))["total"] or 0
        total_pengeluaran = qs.filter(tipe="pengeluaran").aggregate(total=Sum("jumlah"))["total"] or 0
        saldo = total_pemasukan - total_pengeluaran

        log_action(
            user=request.user,
            action="export",
            table_name="transaksi",
            record_id=uuid.uuid4(),
            new_data={"dari": dari_str, "sampai": sampai_str, "format": "pdf"},
            request=request,
        )

        fmt = request.query_params.get("fmt", "pdf")
        if fmt == "pdf":
            return self._render_laporan_pdf(qs, total_pemasukan, total_pengeluaran, saldo, dari_str, sampai_str)

        # JSON fallback
        data = TransaksiListSerializer(qs, many=True, context={"request": request}).data
        return Response({
            "status": "success",
            "data": {
                "transaksi": data,
                "summary": {
                    "totalPemasukan": str(total_pemasukan),
                    "totalPengeluaran": str(total_pengeluaran),
                    "saldo": str(saldo),
                },
            },
        })

    def _render_laporan_pdf(self, qs, total_pemasukan, total_pengeluaran, saldo, dari_str, sampai_str):
        """Render laporan keuangan sebagai PDF menggunakan WeasyPrint."""
        try:
            from weasyprint import HTML
        except ImportError:
            return Response(
                {"status": "error", "message": "Library WeasyPrint tidak tersedia di server"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        periode = ""
        if dari_str and sampai_str:
            periode = f"{dari_str} s/d {sampai_str}"
        elif dari_str:
            periode = f"sejak {dari_str}"
        elif sampai_str:
            periode = f"sampai {sampai_str}"

        rows = ""
        for i, t in enumerate(qs, 1):
            rows += f"""<tr>
                <td>{i}</td>
                <td>{t.tanggal}</td>
                <td>{t.kategori.nama}</td>
                <td>{t.keterangan or '-'}</td>
                <td class="{'pemasukan' if t.tipe == 'pemasukan' else 'pengeluaran'}">{t.tipe.title()}</td>
                <td class="nominal">Rp {t.jumlah:,.0f}</td>
            </tr>"""

        html_content = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<title>Laporan Keuangan RT</title>
<style>
  body {{ font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }}
  h1 {{ text-align: center; font-size: 16px; margin-bottom: 4px; }}
  p.sub {{ text-align: center; color: #555; margin-top: 0; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
  th, td {{ border: 1px solid #ccc; padding: 6px 8px; }}
  th {{ background: #f0f0f0; }}
  .nominal {{ text-align: right; font-family: monospace; }}
  .pemasukan {{ color: #16a34a; }}
  .pengeluaran {{ color: #dc2626; }}
  .summary {{ margin-top: 16px; float: right; }}
  .summary td {{ border: none; padding: 2px 8px; }}
  .summary td:last-child {{ text-align: right; font-weight: bold; font-family: monospace; }}
</style>
</head>
<body>
<h1>Laporan Keuangan RT</h1>
<p class="sub">Periode: {periode or 'Semua'} &nbsp;|&nbsp; Dicetak: {date.today()}</p>
<table>
  <thead><tr><th>#</th><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th>Tipe</th><th class="nominal">Jumlah</th></tr></thead>
  <tbody>{rows}</tbody>
</table>
<table class="summary">
  <tr><td>Total Pemasukan</td><td>Rp {total_pemasukan:,.0f}</td></tr>
  <tr><td>Total Pengeluaran</td><td>Rp {total_pengeluaran:,.0f}</td></tr>
  <tr><td><strong>Saldo</strong></td><td><strong>Rp {saldo:,.0f}</strong></td></tr>
</table>
</body>
</html>"""

        pdf_file = io.BytesIO()
        HTML(string=html_content).write_pdf(pdf_file)
        pdf_file.seek(0)
        response = HttpResponse(pdf_file.read(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="laporan-keuangan.pdf"'
        return response


class IuranWargaViewSet(viewsets.GenericViewSet):
    """Upload bukti iuran (warga) + konfirmasi (bendahara/admin) + list."""

    queryset = IuranWarga.objects.select_related(
        "warga", "warga__user", "jenis", "confirmed_by"
    )
    filter_backends = [DjangoFilterBackend]
    filterset_class = IuranWargaFilter
    pagination_class = None  # Return semua item sekaligus untuk filter client-side

    def get_permissions(self):
        if self.action in ["upload", "saya", "retrieve"]:
            return [IsAuthenticated()]
        if self.action == "confirm":
            return [IsBendaharaOrAdmin()]
        return [IsBendaharaOrAdmin()]

    def list(self, request, *args, **kwargs):
        """List semua iuran — hanya yang punya izin konfirmasi_iuran."""
        from accounts.permissions import has_perm

        if not has_perm(request.user, "konfirmasi_iuran"):
            return Response(
                {"status": "error", "message": "Akses ditolak.", "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        serializer = IuranWargaListSerializer(page or qs, many=True, context={"request": request})
        if page is not None:
            paginator = self.paginator
            return Response({
                "status": "success",
                "data": serializer.data,
                "pagination": {
                    "page": paginator.page.number,
                    "limit": paginator.page_size,
                    "total": paginator.page.paginator.count,
                    "totalPages": paginator.page.paginator.num_pages,
                },
            })
        return Response({"status": "success", "data": serializer.data})

    @action(detail=False, methods=["post"], url_path="upload", parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """Warga upload bukti iuran — wargaId diambil otomatis dari user yang login."""
        profile = getattr(request.user, "profile", None)
        if not profile:
            return Response(
                {"status": "error", "message": "Profil warga tidak ditemukan. Pastikan akun sudah terdaftar sebagai warga.", "code": "WARGA_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Inject wargaId dari profil user yang login — frontend tidak perlu mengirim ini
        data = request.data.copy()
        data["wargaId"] = str(profile.id)

        serializer = IuranWargaUploadSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        instance = serializer.save()
        log_action(
            user=request.user,
            action="create",
            table_name="iuran_warga",
            record_id=instance.id,
            new_data={
                "warga_id": str(instance.warga_id),
                "jenis_id": str(instance.jenis_id) if instance.jenis_id else None,
                "bulan": instance.bulan,
                "tahun": instance.tahun,
                "jumlah": str(instance.jumlah),
                "status": instance.status,
            },
            request=request,
        )

        _BULAN = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                  "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
        from notifications.services import notify_users_with_roles  # noqa: PLC0415
        nama_warga = instance.warga.nama_lengkap if instance.warga else request.user.email
        jenis_nama = instance.jenis.nama if instance.jenis else "Iuran"
        notify_users_with_roles(
            roles=["ketua_rt", "bendahara"],
            judul="Upload Bukti Iuran",
            isi=f"{nama_warga} mengupload bukti {jenis_nama} {_BULAN[instance.bulan]} {instance.tahun}. Menunggu konfirmasi.",
            tipe="info",
            url="/keuangan/iuran",
        )
        return Response(
            {
                "status": "success",
                "data": {
                    "id": str(instance.id),
                    "jenis": JenisIuranSerializer(instance.jenis).data if instance.jenis else None,
                    "bulan": instance.bulan,
                    "tahun": instance.tahun,
                    "jumlah": str(instance.jumlah),
                    "status": instance.status,
                    "buktiUrl": None,
                },
                "message": "Bukti transfer berhasil diupload. Menunggu konfirmasi bendahara.",
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["put"], url_path="confirm")
    def confirm(self, request, pk=None):
        """Konfirmasi atau tolak iuran — hanya bendahara/admin."""
        instance = self.get_object()
        old_status = instance.status

        serializer = IuranKonfirmasiSerializer(
            instance, data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        log_action(
            user=request.user,
            action="confirm" if instance.status == "lunas" else "reject",
            table_name="iuran_warga",
            record_id=instance.id,
            old_data={"status": old_status},
            new_data={"status": instance.status, "keterangan": instance.keterangan},
            request=request,
        )
        # Notify warga tentang hasil konfirmasi
        warga_user = instance.warga.user if instance.warga else None
        if warga_user:
            from notifications.services import notify_user  # noqa: PLC0415
            _BULAN_N = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
            jenis_nama = instance.jenis.nama if instance.jenis else "Iuran"
            periode = f"{_BULAN_N[instance.bulan]} {instance.tahun}"
            if instance.status == IuranWarga.Status.LUNAS:
                notify_user(
                    user=warga_user,
                    judul=f"Iuran {jenis_nama} Dikonfirmasi ✓",
                    isi=f"Pembayaran {jenis_nama} periode {periode} sebesar Rp {int(instance.jumlah):,.0f} telah dikonfirmasi. Terima kasih!".replace(",", "."),
                    tipe="info",
                    url="/iuran/upload",
                )
            else:
                ket = f" Alasan: {instance.keterangan}" if instance.keterangan else ""
                notify_user(
                    user=warga_user,
                    judul=f"Iuran {jenis_nama} Ditolak",
                    isi=f"Pembayaran {jenis_nama} periode {periode} ditolak.{ket} Silakan upload ulang bukti transfer.",
                    tipe="penting",
                    url="/iuran/upload",
                )

        verb = "dikonfirmasi" if instance.status == "lunas" else "ditolak"
        return Response({"status": "success", "message": f"Iuran berhasil {verb}"})

    @action(detail=False, methods=["get"], url_path="saya")
    def saya(self, request):
        """Riwayat iuran milik warga yang login."""
        profile = getattr(request.user, "profile", None)
        if not profile:
            return Response(
                {"status": "error", "message": "Profil warga tidak ditemukan.", "code": "WARGA_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )
        tahun = request.query_params.get("tahun")
        qs = IuranWarga.objects.filter(warga=profile)
        if tahun:
            qs = qs.filter(tahun=tahun)
        serializer = WargaIuranSerializer(qs, many=True, context={"request": request})
        return Response({"status": "success", "data": serializer.data})

    @action(detail=False, methods=["get"], url_path="pending-count")
    def pending_count(self, request):
        """Jumlah iuran pending — untuk badge notifikasi bendahara/admin."""
        count = IuranWarga.objects.filter(status=IuranWarga.Status.PENDING).count()
        return Response({"status": "success", "data": {"count": count}})

    def retrieve(self, request, pk=None):
        """Detail satu iuran — cek object-level permission."""
        instance = self.get_object()
        permission = IsOwnerIuranOrBendahara()
        if not permission.has_object_permission(request, self, instance):
            return Response(
                {"status": "error", "message": "Akses ditolak.", "code": "PERMISSION_DENIED_OBJECT_LEVEL"},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = IuranWargaListSerializer(instance, context={"request": request})
        return Response({"status": "success", "data": serializer.data})


class PengaturanIuranView(APIView):
    """GET/PUT pengaturan iuran — GET oleh semua user login, PUT hanya bendahara/admin."""

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsBendaharaOrAdmin()]

    def get(self, request):
        obj = PengaturanIuran.get_instance()
        serializer = PengaturanIuranSerializer(obj)
        return Response({"status": "success", "data": serializer.data})

    def put(self, request):
        obj = PengaturanIuran.get_instance()
        serializer = PengaturanIuranSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(updated_by=request.user)
        log_action(
            user=request.user,
            action="update",
            table_name="pengaturan_iuran",
            record_id=uuid.UUID(int=1),
            new_data={
                "saldo_awal": str(instance.saldo_awal),
                "nominal_default": str(instance.nominal_default),
                "keterangan": instance.keterangan,
            },
            request=request,
        )
        return Response({
            "status": "success",
            "data": PengaturanIuranSerializer(instance).data,
            "message": "Pengaturan iuran berhasil disimpan.",
        })


class BukuKasView(APIView):
    """GET /keuangan/buku-kas/ — Buku kas gabungan (Transaksi + IuranWarga lunas).

    Dapat diakses semua user login untuk transparansi keuangan RT.
    """

    permission_classes = [IsAuthenticated]

    _BULAN = [
        '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ]

    def get(self, request):
        tahun = int(request.query_params.get('tahun', date.today().year))
        bulan_str = request.query_params.get('bulan', '')
        bulan = int(bulan_str) if bulan_str else None

        transaksi_base = Transaksi.objects.filter(status='confirmed')
        iuran_base = IuranWarga.objects.filter(status='lunas')

        # ── Hitung saldo awal (sebelum periode yang dipilih) ──────────
        if bulan:
            batas = date(tahun, bulan, 1)
            t_sebelum = transaksi_base.filter(tanggal__lt=batas)
            i_sebelum = iuran_base.filter(
                Q(tahun__lt=tahun) | Q(tahun=tahun, bulan__lt=bulan)
            )
        else:
            t_sebelum = transaksi_base.filter(tanggal__year__lt=tahun)
            i_sebelum = iuran_base.filter(tahun__lt=tahun)

        t_masuk_awal = t_sebelum.filter(tipe='pemasukan').aggregate(t=Sum('jumlah'))['t'] or 0
        t_keluar_awal = t_sebelum.filter(tipe='pengeluaran').aggregate(t=Sum('jumlah'))['t'] or 0
        i_masuk_awal = i_sebelum.aggregate(t=Sum('jumlah'))['t'] or 0
        # Tambah saldo_awal dari pengaturan (modal awal go-production)
        pengaturan_saldo = Decimal(PengaturanIuran.get_instance().saldo_awal)
        saldo_awal = pengaturan_saldo + Decimal(t_masuk_awal) + Decimal(i_masuk_awal) - Decimal(t_keluar_awal)

        # ── Ambil data periode ─────────────────────────────────────────
        t_periode = transaksi_base.filter(tanggal__year=tahun)
        i_periode = iuran_base.filter(tahun=tahun)
        if bulan:
            t_periode = t_periode.filter(tanggal__month=bulan)
            i_periode = i_periode.filter(bulan=bulan)

        t_periode = t_periode.select_related('kategori', 'created_by__profile')
        i_periode = i_periode.select_related('warga')

        # ── Gabungkan & urutkan ────────────────────────────────────────
        entries = []

        for t in t_periode:
            entries.append({
                'id': str(t.id),
                'tanggal': str(t.tanggal),
                'keterangan': t.keterangan or t.kategori.nama,
                'kategori': t.kategori.nama,
                'tipe': t.tipe,
                'jumlah': str(t.jumlah),
                'sumber': 'manual',
            })

        for i in i_periode:
            tgl = i.confirmed_at.date() if i.confirmed_at else date(i.tahun, i.bulan, 28)
            entries.append({
                'id': str(i.id),
                'tanggal': str(tgl),
                'keterangan': f'Iuran {self._BULAN[i.bulan]} {i.tahun} — {i.warga.nama_lengkap}',
                'kategori': 'Iuran Warga',
                'tipe': 'pemasukan',
                'jumlah': str(i.jumlah),
                'sumber': 'iuran',
            })

        entries.sort(key=lambda x: x['tanggal'])

        # ── Running saldo ──────────────────────────────────────────────
        saldo = saldo_awal
        total_masuk = Decimal(0)
        total_keluar = Decimal(0)
        for idx, e in enumerate(entries, 1):
            e['no'] = idx
            jml = Decimal(e['jumlah'])
            if e['tipe'] == 'pemasukan':
                saldo += jml
                total_masuk += jml
            else:
                saldo -= jml
                total_keluar += jml
            e['saldo'] = str(saldo)

        return Response({
            'status': 'success',
            'data': {
                'saldo_awal': str(saldo_awal),
                'entries': entries,
                'total_masuk': str(total_masuk),
                'total_keluar': str(total_keluar),
                'saldo_akhir': str(saldo_awal + total_masuk - total_keluar),
            },
        })


class DashboardKeuanganView(APIView):
    """Dashboard ringkasan keuangan RT — hanya bendahara/admin."""

    permission_classes = [IsBendaharaOrAdmin]

    def get(self, request):
        tahun = int(request.query_params.get("tahun", date.today().year))

        qs = Transaksi.objects.filter(status=Transaksi.Status.CONFIRMED)
        iuran_qs = IuranWarga.objects.filter(status=IuranWarga.Status.LUNAS)

        transaksi_pemasukan = float(qs.filter(tipe="pemasukan").aggregate(t=Sum("jumlah"))["t"] or 0)
        iuran_pemasukan = float(iuran_qs.aggregate(t=Sum("jumlah"))["t"] or 0)
        total_pengeluaran = float(qs.filter(tipe="pengeluaran").aggregate(t=Sum("jumlah"))["t"] or 0)
        total_pemasukan = transaksi_pemasukan + iuran_pemasukan
        saldo_awal = float(PengaturanIuran.get_instance().saldo_awal)
        saldo = saldo_awal + total_pemasukan - total_pengeluaran

        # Ringkasan bulanan untuk tahun yang diminta
        monthly_pemasukan = {
            item["bulan"]: item["total"]
            for item in qs.filter(tipe="pemasukan", tanggal__year=tahun)
            .annotate(bulan=TruncMonth("tanggal"))
            .values("bulan")
            .annotate(total=Sum("jumlah"))
        }
        monthly_pengeluaran = {
            item["bulan"]: item["total"]
            for item in qs.filter(tipe="pengeluaran", tanggal__year=tahun)
            .annotate(bulan=TruncMonth("tanggal"))
            .values("bulan")
            .annotate(total=Sum("jumlah"))
        }
        monthly_iuran = {
            item["bulan"]: item["total"]
            for item in iuran_qs.filter(tahun=tahun)
            .values("bulan")
            .annotate(total=Sum("jumlah"))
        }

        bulanan = []
        for m in range(1, 13):
            from datetime import date as dt
            key = dt(tahun, m, 1)
            bulanan.append({
                "bulan": m,
                "pemasukan": float(monthly_pemasukan.get(key, 0) or 0) + float(monthly_iuran.get(m, 0) or 0),
                "pengeluaran": float(monthly_pengeluaran.get(key, 0) or 0),
            })

        return Response({
            "status": "success",
            "data": {
                "saldo": saldo,
                "totalPemasukan": total_pemasukan,
                "totalPengeluaran": total_pengeluaran,
                "bulanan": bulanan,
            },
        })
