from typing import List, Optional
from pydantic import BaseModel
from ..tools.base import ToolCall

class ChatResponse(BaseModel):
    """Base model for chat responses"""
    message: str
    context_used: bool = False
    confidence: float = 1.0
    tool_results: Optional[List[ToolCall]] = None

    class Config:
        populate_by_name = True
