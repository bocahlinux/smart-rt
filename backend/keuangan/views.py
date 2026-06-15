"""Views keuangan RT — transaksi, kategori, iuran warga, dashboard, laporan PDF."""

import io
from datetime import date

from django.db.models import Sum
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
from .models import IuranWarga, KategoriTransaksi, Transaksi
from .permissions import IsBendaharaOrAdmin, IsOwnerIuranOrBendahara
from .serializers import (
    DashboardKeuanganSerializer,
    IuranKonfirmasiSerializer,
    IuranWargaListSerializer,
    IuranWargaUploadSerializer,
    KategoriTransaksiSerializer,
    TransaksiCreateSerializer,
    TransaksiListSerializer,
    WargaIuranSerializer,
)


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
            record_id="laporan",
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
        "warga", "warga__user", "confirmed_by"
    )
    filter_backends = [DjangoFilterBackend]
    filterset_class = IuranWargaFilter

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
        """Warga upload bukti iuran — hanya untuk iuran miliknya sendiri."""
        profile = getattr(request.user, "profile", None)
        if not profile:
            return Response(
                {"status": "error", "message": "Profil warga tidak ditemukan.", "code": "WARGA_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Object-level: warga hanya bisa upload iuran untuk dirinya sendiri
        if request.user.role == "warga":
            requested_warga_id = request.data.get("wargaId") or request.data.get("warga_id")
            if requested_warga_id and str(requested_warga_id) != str(profile.id):
                return Response(
                    {"status": "error", "message": "Anda hanya bisa upload iuran untuk diri sendiri.", "code": "PERMISSION_DENIED_OBJECT_LEVEL"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = IuranWargaUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        instance = serializer.save()
        log_action(
            user=request.user,
            action="create",
            table_name="iuran_warga",
            record_id=instance.id,
            new_data={
                "warga_id": str(instance.warga_id),
                "bulan": instance.bulan,
                "tahun": instance.tahun,
                "jumlah": str(instance.jumlah),
                "status": instance.status,
            },
            request=request,
        )
        return Response(
            {
                "status": "success",
                "data": {
                    "id": str(instance.id),
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


class DashboardKeuanganView(APIView):
    """Dashboard ringkasan keuangan RT — hanya bendahara/admin."""

    permission_classes = [IsBendaharaOrAdmin]

    def get(self, request):
        tahun = int(request.query_params.get("tahun", date.today().year))

        qs = Transaksi.objects.filter(status=Transaksi.Status.CONFIRMED)

        total_pemasukan = qs.filter(tipe="pemasukan").aggregate(t=Sum("jumlah"))["t"] or 0
        total_pengeluaran = qs.filter(tipe="pengeluaran").aggregate(t=Sum("jumlah"))["t"] or 0
        saldo = total_pemasukan - total_pengeluaran

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

        bulanan = []
        for m in range(1, 13):
            from datetime import date as dt
            key = dt(tahun, m, 1)
            bulanan.append({
                "bulan": m,
                "pemasukan": float(monthly_pemasukan.get(key, 0) or 0),
                "pengeluaran": float(monthly_pengeluaran.get(key, 0) or 0),
            })

        return Response({
            "status": "success",
            "data": {
                "saldo": float(saldo),
                "totalPemasukan": float(total_pemasukan),
                "totalPengeluaran": float(total_pengeluaran),
                "bulanan": bulanan,
            },
        })
