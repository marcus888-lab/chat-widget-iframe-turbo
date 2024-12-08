from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView
)

from .views import (
    UserRegistrationView,
    UserLoginView,
    UserProfileView,
    LogoutView
)

urlpatterns = [
    # Authentication Endpoints
    path('register/', UserRegistrationView.as_view(), name='auth-register'),
    path('login/', UserLoginView.as_view(), name='auth-login'),
    path('profile/', UserProfileView.as_view(), name='auth-profile'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='auth-token-verify'),
]
