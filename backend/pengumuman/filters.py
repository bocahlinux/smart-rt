import django_filters

from .models import Pengumuman


class PengumumanFilter(django_filters.FilterSet):
    kategori = django_filters.CharFilter(field_name="kategori", lookup_expr="exact")
    is_published = django_filters.BooleanFilter(field_name="is_published")
    dari = django_filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    sampai = django_filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = Pengumuman
        fields = ["kategori", "is_published", "dari", "sampai"]
