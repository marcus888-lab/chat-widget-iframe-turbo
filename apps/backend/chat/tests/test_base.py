from django.test import TestCase
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from django.test import TransactionTestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from ..models import ChatSession, Message, ChatResponse, ChatDependencies, ChatAgentProvider
from .mock_agent import MockAgent
import pytest
import uuid


class ChatTestCase(TestCase):
    """Base test case for non-async chat tests"""
    def setUp(self):
        super().setUp()
        # Set up mock agent
        self.mock_agent = MockAgent()
        ChatAgentProvider.set_agent(self.mock_agent)

    def tearDown(self):
        super().tearDown()
        # Clean up mock agent
        ChatAgentProvider.set_agent(None)


@pytest.mark.asyncio
class AsyncChatTestCase(TransactionTestCase):
    """Base test case for async chat tests"""
    def setUp(self):
        super().setUp()
        # Set up mock agent
        self.mock_agent = MockAgent()
        ChatAgentProvider.set_agent(self.mock_agent)

    def tearDown(self):
        super().tearDown()
        # Clean up mock agent
        ChatAgentProvider.set_agent(None)

    async def receive_from_communicator(self, communicator, timeout=5):
        """Helper method to receive messages with longer timeout"""
        try:
            return await communicator.receive_json_from(timeout=timeout)
        except Exception as e:
            self.fail(f"Failed to receive message: {str(e)}")

    @database_sync_to_async
    def create_session(self):
        """Helper method to create a chat session"""
        return ChatSession.objects.create(session_id=str(uuid.uuid4()))

    @database_sync_to_async
    def create_message(self, session, role, content):
        """Helper method to create a message"""
        return Message.objects.create(
            session=session,
            role=role,
            content=content
        )
