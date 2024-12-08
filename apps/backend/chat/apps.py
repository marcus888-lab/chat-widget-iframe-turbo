from django.apps import AppConfig
from django.conf import settings
import sys


class ChatConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "chat"

    def ready(self):
        """
        Initialize the chat app and configure the agent.
        This method is called by Django when the app is ready.
        """
        from .models import ChatAgentProvider

        if 'test' in sys.argv:
            # For tests, use the mock agent
            from .tests.mock_agent import MockAgent
            agent = MockAgent()
            ChatAgentProvider.set_agent(agent)
        else:
            # For production, initialize with API key from settings
            api_key = getattr(settings, 'OPENAI_API_KEY', None)
            if api_key and not api_key.startswith('sk-mock-'):
                from pydantic_ai import Agent
                from .models import ChatResponse, ChatDependencies
                agent = Agent(
                    model="openai:gpt-4-turbo-preview",
                    deps_type=ChatDependencies,
                    result_type=ChatResponse,
                    system_prompt=(
                        "You are a helpful AI assistant. Provide clear, concise, "
                        "and accurate responses while maintaining context of the conversation."
                    )
                )
                ChatAgentProvider.set_agent(agent)
            else:
                # Use mock agent for development or when using mock key
                print("Using mock chat agent for development")
                from .tests.mock_agent import MockAgent
                agent = MockAgent()
                ChatAgentProvider.set_agent(agent)
