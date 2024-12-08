"""
Test settings for the chat application.
"""
from config.settings import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'test_chatdb',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
        'TEST': {
            'NAME': 'test_chatdb',
            'SERIALIZE': False,
        },
        'OPTIONS': {
            'options': '-c search_path=public'
        }
    }
}

# Use custom test runner
TEST_RUNNER = 'chat.tests.test_runner.CustomTestRunner'

# Use in-memory channel layers for testing
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    }
}

# Disable password hashing to speed up tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable migrations for products app in tests
MIGRATION_MODULES = {
    'products': None,
}

# Remove products app from INSTALLED_APPS for testing
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'products']

# Ensure required apps are included
if 'chat' not in INSTALLED_APPS:
    INSTALLED_APPS.append('chat')

# Configure logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
