from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
import uuid

class ChatSession(models.Model):
    """Model for managing chat sessions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_id = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if not self.session_id or not self.session_id.strip():
            raise ValidationError('Session ID cannot be empty')
        if ChatSession.objects.filter(session_id=self.session_id).exclude(id=self.id).exists():
            raise ValidationError('Session ID must be unique')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @classmethod
    def cleanup_old_sessions(cls):
        """Delete inactive sessions older than 7 days"""
        cutoff_date = timezone.now() - timezone.timedelta(days=7)
        with transaction.atomic():
            old_sessions = cls.objects.filter(
                is_active=False,
                created_at__lt=cutoff_date
            )
            old_sessions._raw_delete(old_sessions.db)

    def __str__(self):
        return f"Chat Session {self.session_id}"

    class Meta:
        ordering = ['-created_at']


class Message(models.Model):
    """Model for storing chat messages"""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(null=True, blank=True)  # For storing tool results and other metadata

    def clean(self):
        if not self.content or not self.content.strip():
            raise ValidationError('Message content cannot be empty')
        if self.role not in [choice[0] for choice in self.ROLE_CHOICES]:
            raise ValidationError(f'Invalid role. Must be one of: {", ".join([choice[0] for choice in self.ROLE_CHOICES])}')
        if len(self.content) > 10000:
            raise ValidationError('Message content too long (max 10000 characters)')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.role} message in session {self.session.session_id}"

    class Meta:
        ordering = ['created_at']


class ToolExecution(models.Model):
    """Model for storing tool execution results"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='tool_executions'
    )
    tool_name = models.CharField(max_length=100)
    input_data = models.JSONField()
    output_data = models.JSONField()
    error = models.TextField(null=True, blank=True)
    execution_time = models.FloatField()  # in milliseconds
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tool_name} execution for message {self.message.id}"

    class Meta:
        ordering = ['created_at']
