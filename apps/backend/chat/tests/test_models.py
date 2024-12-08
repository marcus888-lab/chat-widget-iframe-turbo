from django.db import models
import uuid

class MockProduct(models.Model):
    id = models.UUIDField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    signed_url = models.CharField(max_length=1024)
    image_key = models.CharField(max_length=255)

    class Meta:
        app_label = 'chat'

class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_id = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'chat'

class Message(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(null=True, blank=True)

    class Meta:
        app_label = 'chat'

class ToolExecution(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='tool_executions')
    tool_name = models.CharField(max_length=100)
    input_data = models.JSONField()
    output_data = models.JSONField()
    error = models.TextField(null=True, blank=True)
    execution_time = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'chat'
