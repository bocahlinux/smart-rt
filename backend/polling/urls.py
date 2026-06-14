from django.urls import path

from .views import PollDetailView, PollListCreateView, PollVoteView

app_name = "polling"

urlpatterns = [
    path("", PollListCreateView.as_view(), name="poll-list"),
    # path literal /vote/ SEBELUM <uuid:pk>/ untuk menghindari konflik routing
    path("<uuid:pk>/vote/", PollVoteView.as_view(), name="poll-vote"),
    path("<uuid:pk>/", PollDetailView.as_view(), name="poll-detail"),
]
