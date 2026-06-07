from django.http import JsonResponse


def healthz(request):
    """Health check endpoint — lihat docs/06-API-CONTRACT.md §1.9.1.

    Tidak melakukan query database; hanya menandakan proses Django sudah up.
    Dipakai oleh smoke test CI/CD (12-CICD.md) & monitoring uptime (13-MONITORING.md).
    """
    return JsonResponse({"status": "ok"})
