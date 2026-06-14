import django_filters

from .models import Kegiatan


class KegiatanFilter(django_filters.FilterSet):
    """Filter kegiatan berdasarkan rentang tanggal.
    Sesuai API contract §8.1: ?dari=YYYY-MM-DD&sampai=YYYY-MM-DD
    """

    dari = django_filters.DateTimeFilter(field_name="tanggal", lookup_expr="gte")
    sampai = django_filters.DateTimeFilter(field_name="tanggal", lookup_expr="lte")

    class Meta:
        model = Kegiatan
        fields = ["dari", "sampai"]
