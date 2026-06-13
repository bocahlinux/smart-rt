"""Filter untuk WargaProfile — lihat docs/06-API-CONTRACT.md §3.1."""

import django_filters

from .models import WargaProfile


class WargaFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search", label="Cari nama / NIK")
    blok = django_filters.CharFilter(field_name="blok", lookup_expr="iexact")
    status = django_filters.ChoiceFilter(
        field_name="status", choices=WargaProfile.Status.choices
    )
    jenis_kelamin = django_filters.ChoiceFilter(
        field_name="jenis_kelamin", choices=WargaProfile.JenisKelamin.choices
    )

    class Meta:
        model = WargaProfile
        fields = ["blok", "status", "jenis_kelamin"]

    def filter_search(self, queryset, name, value):  # noqa: ARG002
        return queryset.filter(nama_lengkap__icontains=value) | queryset.filter(
            nik__icontains=value
        )
