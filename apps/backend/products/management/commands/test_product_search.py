from django.core.management.base import BaseCommand
from products.services import ProductSearchService

class Command(BaseCommand):
    help = 'Test product search functionality'

    def handle(self, *args, **options):
        service = ProductSearchService()

        # Test text search
        self.stdout.write(self.style.SUCCESS('\nTesting text search for "office furniture":'))
        results = service.search("office furniture")
        for product in results["data"]:
            self.stdout.write(
                f'- {product["name"]} (Score: {product["scores"]["hybrid"]:.2f})'
            )

        # Test category search
        self.stdout.write(self.style.SUCCESS('\nTesting category "Electronics":'))
        results = service.search("keyboard", category="Electronics")
        for product in results["data"]:
            self.stdout.write(
                f'- {product["name"]} (Score: {product["scores"]["hybrid"]:.2f})'
            )

        # Test price range
        self.stdout.write(self.style.SUCCESS('\nTesting price range 100-300:'))
        results = service.search("", min_price=100, max_price=300)
        for product in results["data"]:
            self.stdout.write(
                f'- {product["name"]} (Price: ${product["price"]:.2f})'
            )
