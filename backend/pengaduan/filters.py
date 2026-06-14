import django_filters

from .models import Pengaduan


class PengaduanFilter(django_filters.FilterSet):
    """Filter untuk endpoint list pengaduan — status dan kategori.
    Sesuai task 7.5 di 07-TASK-BREAKDOWN.md.
    """

    status = django_filters.ChoiceFilter(choices=Pengaduan.Status.choices)
    kategori = django_filters.ChoiceFilter(choices=Pengaduan.Kategori.choices)

    class Meta:
        model = Pengaduan
        fields = ["status", "kategori"]
