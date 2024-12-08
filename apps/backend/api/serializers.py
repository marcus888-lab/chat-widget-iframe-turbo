from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from .models import UserProfile

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer to include additional user information
    """
    def validate(self, attrs):
        data = super().validate(attrs)

        # Add additional user data to the token response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        }

        return data

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'password2')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False}
        }

    def validate_email(self, value):
        """
        Check that the email is unique
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )

        # Create associated user profile
        UserProfile.objects.create(user=user)

        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile information
    """
    class Meta:
        model = User
        fields = ['first_name', 'last_name']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False}
        }

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile
    """
    user = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'bio', 'avatar', 'phone_number', 'location']
        read_only_fields = ['id']

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
        }

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile details
    """
    class Meta:
        model = UserProfile
        fields = ['bio', 'avatar', 'phone_number', 'location']
        extra_kwargs = {
            'bio': {'required': False},
            'avatar': {'required': False},
            'phone_number': {'required': False},
            'location': {'required': False}
        }
