app_name = "forum"

from django.urls import path

from .views import (
    CommentDetailView,
    CommentListCreateView,
    ThreadDetailView,
    ThreadListCreateView,
    ThreadModerationView,
    ThreadVoteView,
)

urlpatterns = [
    # Thread CRUD
    path("forum/", ThreadListCreateView.as_view(), name="thread-list-create"),
    # Komentar — path literal harus SEBELUM <uuid:pk>
    path("forum/comments/<uuid:pk>/", CommentDetailView.as_view(), name="comment-detail"),
    # Thread detail
    path("forum/<uuid:pk>/", ThreadDetailView.as_view(), name="thread-detail"),
    # Sub-resources thread
    path("forum/<uuid:pk>/comments/", CommentListCreateView.as_view(), name="comment-list-create"),
    path("forum/<uuid:pk>/pin/", ThreadModerationView.as_view(), {"action": "pin"}, name="thread-pin"),
    path("forum/<uuid:pk>/lock/", ThreadModerationView.as_view(), {"action": "lock"}, name="thread-lock"),
    path("forum/<uuid:pk>/vote/", ThreadVoteView.as_view(), name="thread-vote"),
]
