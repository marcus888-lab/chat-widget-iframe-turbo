from django.core.management.base import BaseCommand
from django.conf import settings
from minio import Minio

class Command(BaseCommand):
    help = 'Setup MinIO bucket and permissions'

    def handle(self, *args, **options):
        # Initialize MinIO client
        client = Minio(
            f"{settings.MINIO_HOST}:{settings.MINIO_PORT}",
            access_key=settings.MINIO_ROOT_USER,
            secret_key=settings.MINIO_ROOT_PASSWORD,
            secure=settings.MINIO_USE_SSL
        )

        # Create bucket if it doesn't exist
        if not client.bucket_exists(settings.MINIO_BUCKET_NAME):
            client.make_bucket(settings.MINIO_BUCKET_NAME)
            self.stdout.write(
                self.style.SUCCESS(f'Created bucket: {settings.MINIO_BUCKET_NAME}')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Bucket already exists: {settings.MINIO_BUCKET_NAME}')
            )

        # Set bucket policy to allow public read
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{settings.MINIO_BUCKET_NAME}/*"]
                }
            ]
        }

        client.set_bucket_policy(settings.MINIO_BUCKET_NAME, policy)
        self.stdout.write(
            self.style.SUCCESS('Set bucket policy to allow public read')
        )
