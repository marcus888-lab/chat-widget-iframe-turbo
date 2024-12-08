from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'created_at')
    list_filter = ('category',)
    search_fields = ('name', 'description', 'category')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
