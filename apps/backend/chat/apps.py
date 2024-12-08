from django.apps import AppConfig
from django.conf import settings
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class ChatConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chat'

    def ready(self):
        """Initialize the chat agent when the app is ready."""
        from .providers import ChatAgentProvider
        from .tool_selections.product_search import create_product_search_agent

        logger.debug("Initializing chat agent...")
        api_key = getattr(settings, 'OPENAI_API_KEY', '')
        logger.debug(f"API key present: {bool(api_key)}")

        if api_key.startswith('sk-mock-'):
            logger.debug("Using mock agent")
            from .tests.mock_agent import MockAgent
            ChatAgentProvider.set_agent(MockAgent())
        else:
            if api_key:
                logger.debug("Creating LangChain agent")
                agent = create_product_search_agent(api_key)
                logger.debug("Setting agent in provider")
                ChatAgentProvider.set_agent(agent)
                logger.debug("Agent setup complete")
            else:
                import warnings
                logger.warning("OPENAI_API_KEY not set. Chat functionality will be limited.")
                warnings.warn("OPENAI_API_KEY not set. Chat functionality will be limited.")
