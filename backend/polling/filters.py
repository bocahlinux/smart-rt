import django_filters
from django.utils import timezone

from .models import Poll


class PollFilter(django_filters.FilterSet):
    """Filter polling berdasarkan status aktif/expired.
    Sesuai API contract §9.1: ?status=aktif|expired
    """

    status = django_filters.CharFilter(method="filter_by_status")

    class Meta:
        model = Poll
        fields = ["status"]

    def filter_by_status(self, queryset, name, value):
        now = timezone.now()
        if value == "aktif":
            return queryset.filter(deadline__gt=now)
        elif value == "expired":
            return queryset.filter(deadline__lte=now)
        return queryset
