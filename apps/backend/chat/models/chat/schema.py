"""
This file contains all Pydantic models (schemas) for the chat application.
Separating these from Django models to avoid circular imports.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, validator
from dataclasses import dataclass
from datetime import datetime
import uuid

# Base Models
class TimestampedModel(BaseModel):
    """Base model with timestamp fields."""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

class ChatModel(TimestampedModel):
    """Base model for all chat-related models."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

# Tool Models
class ToolCall(BaseModel):
    """Model for tool calls from pydantic-ai"""
    tool_name: str
    args: Dict[str, Any]
    result: Any = None

class RunResult(BaseModel):
    """Model for pydantic-ai run results"""
    data: str
    tool_results: Optional[List[ToolCall]] = None

    class Config:
        populate_by_name = True

# Chat Models
class ChatResponse(BaseModel):
    """Model for structured AI responses"""
    message: str = Field(..., min_length=1, max_length=10000)
    context_used: bool = Field(default=False)
    confidence: float = Field(ge=0.0, le=1.0)
    tool_results: Optional[List[ToolCall]] = None

    @validator('message')
    def message_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()

    class Config:
        populate_by_name = True
        schema_extra = {
            "example": {
                "message": "Here are some products I found...",
                "context_used": True,
                "confidence": 0.95,
                "tool_results": [{
                    "tool_name": "product_search",
                    "args": {"query": "coffee table"},
                    "result": {
                        "data": [
                            {
                                "name": "Modern Coffee Table",
                                "price": 299.99,
                                "category": "Furniture",
                                "scores": {
                                    "hybrid": 0.89,
                                    "vector": 0.91,
                                    "text": 0.85
                                }
                            }
                        ]
                    }
                }]
            }
        }

@dataclass
class ChatDependencies:
    """Dependencies for chat functionality"""
    session_id: str
    history: List[Dict[str, Any]]
    api_keys: Optional[Dict[str, str]] = None

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

        if self.api_keys is not None and not isinstance(self.api_keys, dict):
            raise ValueError("api_keys must be a dictionary")
