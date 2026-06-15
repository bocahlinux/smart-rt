from django.urls import path

from . import views

app_name = "accounts"

# Routing — lihat docs/06-API-CONTRACT.md §2 (Auth Endpoints).
urlpatterns = [
    path("register", views.RegisterView.as_view(), name="register"),
    path("login", views.LoginView.as_view(), name="login"),
    path("token/refresh", views.TokenRefreshView.as_view(), name="token-refresh"),
    path("logout", views.LogoutView.as_view(), name="logout"),
    path("me", views.MeView.as_view(), name="me"),
    path("password", views.ChangePasswordView.as_view(), name="change-password"),
]

# User management — admin only
user_management_patterns = [
    path("users/", views.UserListView.as_view(), name="user-list"),
    path("users/<uuid:pk>/", views.UserDetailView.as_view(), name="user-detail"),
]
