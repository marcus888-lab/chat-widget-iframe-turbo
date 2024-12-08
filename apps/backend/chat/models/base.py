from typing import List, Dict, Any, Optional

class ChatDependencies:
    """Dependencies for chat operations"""
    def __init__(self, session_id: str = None, history: List[Dict[str, Any]] = None):
        self.session_id = session_id
        self.history = history or []
