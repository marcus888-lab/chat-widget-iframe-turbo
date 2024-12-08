from django.test.runner import DiscoverRunner
from django.db import connection

class CustomTestRunner(DiscoverRunner):
    def setup_databases(self, **kwargs):
        """Set up test databases with required extensions"""
        # First, set up the databases as usual
        old_names = super().setup_databases(**kwargs)

        # Then create the vector extension
        with connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")

        return old_names
