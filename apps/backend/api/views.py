from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate

from .serializers import (
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileSerializer
)
from .models import UserProfile

User = get_user_model()

class UserRegistrationView(CreateAPIView):
    """
    View to handle user registration
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create user
        user = serializer.save()

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        response_data = {
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }

        return Response(response_data, status=status.HTTP_201_CREATED)

class UserLoginView(TokenObtainPairView):
    """
    View to handle user login
    """
    serializer_class = CustomTokenObtainPairSerializer

class UserProfileView(APIView):
    """
    View to get and update user profile
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Retrieve current user's profile
        """
        profile = request.user.profile
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        """
        Update current user's profile
        """
        profile = request.user.profile
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    """
    View to handle user logout and blacklist refresh token
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)
