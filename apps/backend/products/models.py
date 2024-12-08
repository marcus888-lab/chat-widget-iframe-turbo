import uuid
import logging
from datetime import timedelta
from django.db import models
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
from pgvector.django import VectorField
from django.conf import settings
from minio import Minio
from urllib.parse import urlparse
import os

logger = logging.getLogger(__name__)

class Product(models.Model):
    """Product model with vector search support"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    # Image fields
    signed_url = models.CharField(max_length=1024)  # Presigned URL for frontend display
    image_key = models.CharField(max_length=255)   # MinIO storage key

    # Search fields
    search_vector = SearchVectorField(null=True)  # For text search
    embedding = VectorField(dimensions=768)  # For nomic embeddings

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'products'
        indexes = [
            GinIndex(fields=['search_vector']),  # For faster text search
            models.Index(fields=['category']),  # For category filtering
        ]

    def __str__(self):
        return self.name

    def refresh_signed_url(self):
        """Refresh the presigned URL for the product image"""
        try:
            client = Minio(
                "localhost:9000",
                access_key=settings.MINIO_ROOT_USER,
                secret_key=settings.MINIO_ROOT_PASSWORD,
                secure=settings.MINIO_USE_SSL
            )

            logger.info(f"MinIO client initialized with bucket: {settings.MINIO_BUCKET_NAME}")
            logger.info(f"Generating signed URL for object: {self.image_key}")

            # Generate presigned URL valid for 12 hours
            url = client.presigned_get_object(
                settings.MINIO_BUCKET_NAME,
                self.image_key,
                expires=timedelta(hours=12)  # Use timedelta instead of seconds
            )

            logger.info(f"Generated signed URL: {url}")

            self.signed_url = url
            self.save(update_fields=['signed_url'])
            return url
        except Exception as e:
            logger.error(f"Error generating signed URL: {str(e)}")
            return None
