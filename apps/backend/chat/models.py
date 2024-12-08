from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field, validator
from dataclasses import dataclass
from pydantic_ai import Agent
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
        # Check for existing sessions with same ID
        if ChatSession.objects.filter(session_id=self.session_id).exclude(id=self.id).exists():
            raise ValidationError('Session ID must be unique')

    def save(self, *args, **kwargs):
        self.full_clean()  # This will call clean() and model field validation
        super().save(*args, **kwargs)

    @classmethod
    def cleanup_old_sessions(cls):
        """Delete inactive sessions older than 7 days"""
        cutoff_date = timezone.now() - timezone.timedelta(days=7)
        with transaction.atomic():
            # First, get the IDs of sessions to delete
            old_sessions = cls.objects.filter(
                is_active=False,
                created_at__lt=cutoff_date
            )
            # Then delete them
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

    def clean(self):
        if not self.content or not self.content.strip():
            raise ValidationError('Message content cannot be empty')
        if self.role not in [choice[0] for choice in self.ROLE_CHOICES]:
            raise ValidationError(f'Invalid role. Must be one of: {", ".join([choice[0] for choice in self.ROLE_CHOICES])}')
        if len(self.content) > 10000:  # Add reasonable content length limit
            raise ValidationError('Message content too long (max 10000 characters)')

    def save(self, *args, **kwargs):
        self.full_clean()  # This will call clean() and model field validation
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.role} message in session {self.session.session_id}"

    class Meta:
        ordering = ['created_at']


class ToolResult(BaseModel):
    """Pydantic model for tool results"""
    tool: str
    result: Dict[str, Any]


class ChatResponse(BaseModel):
    """Pydantic model for structured AI responses"""
    message: str = Field(..., min_length=1, max_length=10000)
    context_used: bool = Field(default=False)
    confidence: float = Field(ge=0.0, le=1.0)
    toolResults: Optional[List[ToolResult]] = None

    @validator('message')
    def message_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()


@dataclass
class ChatDependencies:
    """Dependencies for chat functionality"""
    session_id: str
    history: List[Dict[str, Any]]

    def __post_init__(self):
        """Validate dependencies"""
        if not self.session_id or not self.session_id.strip():
            raise ValueError("Session ID cannot be empty")
        if len(self.session_id) > 100:
            raise ValueError("Session ID too long (max 100 characters)")

        if not isinstance(self.history, list):
            raise ValueError("History must be a list")

        valid_roles = {'user', 'assistant', 'system'}
        for msg in self.history:
            if not isinstance(msg, dict):
                raise ValueError("Each history item must be a dictionary")
            if 'role' not in msg:
                raise ValueError("Missing 'role' in history item")
            if 'content' not in msg:
                raise ValueError("Missing 'content' in history item")
            if msg['role'] not in valid_roles:
                raise ValueError(f"Invalid role in history. Must be one of: {', '.join(valid_roles)}")
            if not msg['content'] or not str(msg['content']).strip():
                raise ValueError("Message content cannot be empty")
            if len(str(msg['content'])) > 10000:
                raise ValueError("Message content too long (max 10000 characters)")


# Initialize the chat agent with dependency injection support
class ChatAgentProvider:
    _instance = None

    @classmethod
    def get_agent(cls) -> Optional[Agent]:
        return cls._instance

    @classmethod
    def set_agent(cls, agent: Optional[Agent]):
        cls._instance = agent


# The agent instance will be set by the app config
chat_agent = None
