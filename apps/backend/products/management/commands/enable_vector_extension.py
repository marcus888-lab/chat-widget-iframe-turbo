from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Enables the pgvector extension in PostgreSQL'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            cursor.execute('CREATE EXTENSION IF NOT EXISTS vector;')
            self.stdout.write(self.style.SUCCESS('Successfully enabled vector extension'))
