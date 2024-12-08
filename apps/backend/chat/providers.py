from typing import Optional
from langchain.agents import AgentExecutor

class ChatAgentProvider:
    """Provider for managing the chat agent instance."""
    _instance: Optional[AgentExecutor] = None

    @classmethod
    def get_agent(cls) -> Optional[AgentExecutor]:
        """Get the current agent instance"""
        return cls._instance

    @classmethod
    def set_agent(cls, agent: Optional[AgentExecutor]):
        """Set the agent instance"""
        cls._instance = agent

# The agent instance will be set by the app config
chat_agent = None
