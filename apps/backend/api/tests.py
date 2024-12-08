from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class AuthenticationTests(TestCase):
    def setUp(self):
        """
        Set up test environment before each test
        """
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.profile_url = '/api/auth/profile/'
        self.logout_url = '/api/auth/logout/'
        self.token_refresh_url = '/api/auth/token/refresh/'

        # Test user data
        self.user_data = {
            'email': 'testuser@example.com',
            'password': 'TestPassword123!',
            'password2': 'TestPassword123!',
            'first_name': 'Test',
            'last_name': 'User'
        }

    def test_user_registration(self):
        """
        Test user registration endpoint
        """
        response = self.client.post(self.register_url, self.user_data)

        # Check response status
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check user was created
        user = User.objects.filter(email=self.user_data['email']).first()
        self.assertIsNotNone(user)

        # Check profile was created
        self.assertTrue(hasattr(user, 'profile'))

        # Check response contains tokens
        response_data = response.json()
        self.assertIn('access', response_data)
        self.assertIn('refresh', response_data)

    def test_user_login(self):
        """
        Test user login endpoint
        """
        # First, register a user
        self.client.post(self.register_url, self.user_data)

        # Then attempt login
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data)

        # Check response status
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check tokens are returned
        response_data = response.json()
        self.assertIn('access', response_data)
        self.assertIn('refresh', response_data)
        self.assertIn('user', response_data)

    def test_user_profile(self):
        """
        Test user profile retrieval and update
        """
        # Register and login user
        register_response = self.client.post(self.register_url, self.user_data)
        register_data = register_response.json()
        access_token = register_data['access']

        # Set token in client
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        # Retrieve profile
        get_response = self.client.get(self.profile_url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)

        # Update profile
        update_data = {
            'bio': 'Test bio',
            'phone_number': '1234567890'
        }
        update_response = self.client.patch(self.profile_url, update_data)

        # Check update response
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        update_data = update_response.json()
        self.assertEqual(update_data['bio'], 'Test bio')
        self.assertEqual(update_data['phone_number'], '1234567890')

    def test_token_refresh(self):
        """
        Test token refresh endpoint
        """
        # Register a user to get initial tokens
        register_response = self.client.post(self.register_url, self.user_data)
        register_data = register_response.json()
        refresh_token = register_data['refresh']

        # Attempt to refresh token
        refresh_response = self.client.post(self.token_refresh_url, {'refresh': refresh_token})

        # Check response
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        refresh_data = refresh_response.json()
        self.assertIn('access', refresh_data)

    def test_logout(self):
        """
        Test logout endpoint
        """
        # Register a user to get tokens
        register_response = self.client.post(self.register_url, self.user_data)
        register_data = register_response.json()
        refresh_token = register_data['refresh']
        access_token = register_data['access']

        # Set authorization
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        # Attempt logout
        logout_response = self.client.post(self.logout_url, {'refresh_token': refresh_token})

        # Check response
        self.assertEqual(logout_response.status_code, status.HTTP_205_RESET_CONTENT)

    def test_invalid_registration(self):
        """
        Test registration with invalid data
        """
        # Mismatched passwords
        invalid_data = self.user_data.copy()
        invalid_data['password2'] = 'DifferentPassword123!'

        response = self.client.post(self.register_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_email_registration(self):
        """
        Test registration with an existing email
        """
        # First registration
        self.client.post(self.register_url, self.user_data)

        # Second registration with same email
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
