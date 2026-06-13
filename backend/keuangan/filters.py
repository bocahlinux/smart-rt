import django_filters

from .models import IuranWarga, Transaksi


class TransaksiFilter(django_filters.FilterSet):
    dari = django_filters.DateFilter(field_name="tanggal", lookup_expr="gte")
    sampai = django_filters.DateFilter(field_name="tanggal", lookup_expr="lte")
    tipe = django_filters.ChoiceFilter(choices=Transaksi.Tipe.choices)
    status = django_filters.ChoiceFilter(choices=Transaksi.Status.choices)
    kategori = django_filters.UUIDFilter(field_name="kategori__id")

    class Meta:
        model = Transaksi
        fields = ["tipe", "status", "dari", "sampai", "kategori"]


class IuranWargaFilter(django_filters.FilterSet):
    tahun = django_filters.NumberFilter(field_name="tahun")
    bulan = django_filters.NumberFilter(field_name="bulan")
    status = django_filters.ChoiceFilter(choices=IuranWarga.Status.choices)
    warga = django_filters.UUIDFilter(field_name="warga__id")

    class Meta:
        model = IuranWarga
        fields = ["tahun", "bulan", "status", "warga"]
