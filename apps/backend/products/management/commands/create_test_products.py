import uuid
import requests
import logging
from io import BytesIO
from django.core.management.base import BaseCommand
from django.conf import settings
from minio import Minio
from PIL import Image
from products.models import Product
from products.services import ProductSearchService

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Creates test products with embeddings and Unsplash images'

    def handle(self, *args, **options):
        # Initialize services
        service = ProductSearchService()
        minio_client = Minio(
            "localhost:9000",
            access_key=settings.MINIO_ROOT_USER,
            secret_key=settings.MINIO_ROOT_PASSWORD,
            secure=settings.MINIO_USE_SSL
        )

        # Ensure bucket exists
        if not minio_client.bucket_exists(settings.MINIO_BUCKET_NAME):
            minio_client.make_bucket(settings.MINIO_BUCKET_NAME)
            self.stdout.write(self.style.SUCCESS(f'Created bucket: {settings.MINIO_BUCKET_NAME}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Bucket exists: {settings.MINIO_BUCKET_NAME}'))

        test_products = [
            {
                'name': 'Modern Office Chair',
                'description': 'Ergonomic office chair with lumbar support and adjustable height. Perfect for long work sessions.',
                'category': 'Furniture',
                'price': 199.99,
                'unsplash_url': 'https://images.unsplash.com/photo-1505797149-43b0069ec26b'  # Office chair
            },
            {
                'name': 'Standing Desk',
                'description': 'Electric adjustable height standing desk with memory settings. Smooth and quiet operation.',
                'category': 'Furniture',
                'price': 399.99,
                'unsplash_url': 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c'  # Standing desk
            },
            {
                'name': 'Mechanical Keyboard',
                'description': 'RGB mechanical keyboard with Cherry MX switches. Perfect for typing and gaming.',
                'category': 'Electronics',
                'price': 149.99,
                'unsplash_url': 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef'  # Mechanical keyboard
            }
        ]

        for product_data in test_products:
            try:
                # Download image from Unsplash
                response = requests.get(product_data['unsplash_url'])
                response.raise_for_status()
                image = Image.open(BytesIO(response.content))
                image_data = BytesIO(response.content)

                # Generate unique filename
                product_id = str(uuid.uuid4())
                filename = f"{product_id}.jpg"
                object_name = f"products/{filename}"

                # Upload to MinIO
                minio_client.put_object(
                    settings.MINIO_BUCKET_NAME,
                    object_name,
                    image_data,
                    length=len(response.content),
                    content_type='image/jpeg'
                )

                self.stdout.write(self.style.SUCCESS(f'Uploaded image: {object_name}'))

                # Get embeddings for product name and description
                text = f"{product_data['name']} {product_data['description']}"
                embedding = service._get_text_embedding(text)

                # Get image embedding
                image_embedding = service._get_image_embedding(image)

                # Average text and image embeddings
                embedding = [(t + i) / 2 for t, i in zip(embedding, image_embedding)]

                # Create product with initial signed URL
                product = Product.objects.create(
                    id=product_id,
                    name=product_data['name'],
                    description=product_data['description'],
                    category=product_data['category'],
                    price=product_data['price'],
                    image_key=object_name,
                    signed_url='',  # Will be updated by refresh_signed_url
                    embedding=embedding
                )

                # Generate initial signed URL
                signed_url = product.refresh_signed_url()
                if signed_url:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Created product: {product.name} with signed URL: {signed_url}'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Created product: {product.name} but failed to generate signed URL'
                        )
                    )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error creating product {product_data["name"]}: {str(e)}'
                    )
                )
