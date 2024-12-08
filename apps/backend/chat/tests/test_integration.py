import pytest
import asyncio
from channels.testing import WebsocketCommunicator
from django.test import TestCase
from channels.routing import URLRouter
from django.urls import re_path
from django.utils import timezone
from datetime import timedelta
from ..consumers import ChatConsumer
from ..models import ChatSession, Message, ChatResponse, ChatAgentProvider
from .test_base import AsyncChatTestCase
from unittest.mock import AsyncMock, patch
import uuid


@pytest.mark.asyncio
class ChatIntegrationTests(AsyncChatTestCase):
    async def receive_from_communicator(self, communicator, timeout=5):
        """Helper method to receive messages with longer timeout"""
        try:
            return await communicator.receive_json_from(timeout=timeout)
        except asyncio.TimeoutError:
            self.fail("Timed out waiting for response")

    @patch('chat.models.ChatAgentProvider.get_agent')
    async def test_complete_chat_flow(self, mock_get_agent):
        """Test complete chat flow with pydantic-ai integration"""
        mock_agent = AsyncMock()
        mock_agent.achat.return_value = ChatResponse(
            message="AI response",
            context_used=True,
            confidence=0.95
        )
        mock_get_agent.return_value = mock_agent

        # Create session
        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))

        # Set up WebSocket
        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session.session_id}/"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Test conversation flow
        test_message = "What is the capital of France?"
        await communicator.send_json_to({
            "message": test_message
        })

        # Verify user message
        response = await self.receive_from_communicator(communicator)
        self.assertEqual(response["type"], "message")
        self.assertEqual(response["role"], "user")
        self.assertEqual(response["message"], test_message)

        # Verify AI response
        response = await self.receive_from_communicator(communicator)
        self.assertEqual(response["type"], "message")
        self.assertEqual(response["role"], "assistant")
        self.assertEqual(response["message"], "AI response")
        self.assertTrue(response["context_used"])
        self.assertEqual(response["confidence"], 0.95)

        await communicator.disconnect()

    @patch('chat.models.ChatAgentProvider.get_agent')
    async def test_contextual_conversation(self, mock_get_agent):
        """Test that conversation maintains context"""
        mock_agent = AsyncMock()
        mock_agent.achat.return_value = ChatResponse(
            message="AI response",
            context_used=True,
            confidence=0.95
        )
        mock_get_agent.return_value = mock_agent

        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))

        # Create conversation history
        Message.objects.create(
            session=session,
            role="user",
            content="My name is John"
        )
        Message.objects.create(
            session=session,
            role="assistant",
            content="Hello John, nice to meet you!"
        )

        # Set up WebSocket
        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session.session_id}/"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Test contextual response
        await communicator.send_json_to({
            "message": "What's my name?"
        })

        # Skip user message echo
        await self.receive_from_communicator(communicator)

        # Verify contextual AI response
        response = await self.receive_from_communicator(communicator)
        self.assertEqual(response["type"], "message")
        self.assertEqual(response["role"], "assistant")
        self.assertEqual(response["message"], "AI response")
        self.assertTrue(response["context_used"])

        await communicator.disconnect()

    @patch('chat.models.ChatAgentProvider.get_agent')
    async def test_error_recovery(self, mock_get_agent):
        """Test system recovery from errors"""
        mock_agent = AsyncMock()
        mock_agent.achat.return_value = None  # Simulate AI failure
        mock_get_agent.return_value = mock_agent

        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application=application,
            path="/ws/chat/nonexistent-session/"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Test system handles missing session gracefully
        await communicator.send_json_to({
            "message": "Hello"
        })

        # Should still get user message echo
        response = await self.receive_from_communicator(communicator)
        self.assertEqual(response["type"], "message")
        self.assertEqual(response["role"], "user")

        # Should get error response for missing session
        response = await self.receive_from_communicator(communicator)
        self.assertEqual(response["type"], "error")
        self.assertEqual(response["error"], "Failed to get AI response")

        await communicator.disconnect()

    @patch('chat.models.ChatAgentProvider.get_agent')
    async def test_long_conversation(self, mock_get_agent):
        """Test handling of longer conversations with context management"""
        mock_agent = AsyncMock()
        mock_agent.achat.return_value = ChatResponse(
            message="AI response",
            context_used=True,
            confidence=0.95
        )
        mock_get_agent.return_value = mock_agent

        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))

        # Create longer conversation history
        for i in range(15):  # Create more than our context window
            Message.objects.create(
                session=session,
                role="user" if i % 2 == 0 else "assistant",
                content=f"Message {i}"
            )

        # Set up WebSocket
        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session.session_id}/"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Test response with truncated context
        await communicator.send_json_to({
            "message": "What was the first message?"
        })

        # Skip user message echo
        await self.receive_from_communicator(communicator)

        # Verify AI handles limited context appropriately
        response = await self.receive_from_communicator(communicator)
        self.assertEqual(response["type"], "message")
        self.assertEqual(response["role"], "assistant")
        self.assertEqual(response["message"], "AI response")
        self.assertTrue(response["context_used"])

        await communicator.disconnect()

    async def test_rate_limiting(self):
        """Test rate limiting functionality"""
        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))

        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session.session_id}/"
        )
        await communicator.connect()

        # Send messages rapidly
        for i in range(35):  # More than rate limit
            await communicator.send_json_to({
                "message": f"Rapid message {i}"
            })
            await asyncio.sleep(0.1)  # Small delay to ensure messages are processed

        # Should receive rate limit error
        responses = []
        try:
            while True:
                response = await self.receive_from_communicator(communicator)
                responses.append(response)
        except Exception:
            pass

        # Verify rate limit error was received
        rate_limit_responses = [r for r in responses if r.get("type") == "error" and r.get("error") == "Rate limit exceeded"]
        self.assertTrue(len(rate_limit_responses) > 0)

        await communicator.disconnect()

    @patch('chat.models.ChatAgentProvider.get_agent')
    async def test_concurrent_sessions(self, mock_get_agent):
        """Test handling of concurrent chat sessions"""
        mock_agent = AsyncMock()
        mock_agent.achat.return_value = ChatResponse(
            message="AI response",
            context_used=True,
            confidence=0.95
        )
        mock_get_agent.return_value = mock_agent

        # Create two sessions
        session1 = ChatSession.objects.create(session_id=str(uuid.uuid4()))
        session2 = ChatSession.objects.create(session_id=str(uuid.uuid4()))

        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        # Connect to both sessions
        communicator1 = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session1.session_id}/"
        )
        communicator2 = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session2.session_id}/"
        )

        await communicator1.connect()
        await communicator2.connect()

        # Send messages to both sessions
        await communicator1.send_json_to({"message": "Message to session 1"})
        await communicator2.send_json_to({"message": "Message to session 2"})

        # Verify messages don't cross sessions
        response1 = await self.receive_from_communicator(communicator1)
        response2 = await self.receive_from_communicator(communicator2)

        self.assertEqual(response1["type"], "message")
        self.assertEqual(response1["message"], "Message to session 1")
        self.assertEqual(response2["type"], "message")
        self.assertEqual(response2["message"], "Message to session 2")

        # Verify AI responses are session-specific
        ai_response1 = await self.receive_from_communicator(communicator1)
        ai_response2 = await self.receive_from_communicator(communicator2)

        self.assertEqual(ai_response1["type"], "message")
        self.assertEqual(ai_response2["type"], "message")
        self.assertEqual(ai_response1["message"], "AI response")
        self.assertEqual(ai_response2["message"], "AI response")

        await communicator1.disconnect()
        await communicator2.disconnect()

    async def test_message_validation(self):
        """Test message validation and sanitization"""
        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))

        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session.session_id}/"
        )
        await communicator.connect()

        # Test empty message
        await communicator.send_json_to({"message": ""})
        response = await self.receive_from_communicator(communicator)
        self.assertEqual(response["type"], "error")
        self.assertEqual(response["error"], "Empty message")

        # Test oversized message
        long_message = "x" * 10001  # Longer than max length
        await communicator.send_json_to({"message": long_message})
        response = await self.receive_from_communicator(communicator)
        self.assertEqual(response["type"], "error")
        self.assertEqual(response["error"], "Message too long")

        await communicator.disconnect()

    @patch('chat.models.ChatAgentProvider.get_agent')
    async def test_ai_timeout_handling(self, mock_get_agent):
        """Test handling of AI response timeouts"""
        mock_agent = AsyncMock()
        mock_agent.achat.side_effect = TimeoutError("AI response timed out")
        mock_get_agent.return_value = mock_agent

        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))

        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session.session_id}/"
        )
        await communicator.connect()

        # Send message that triggers slow AI response
        await communicator.send_json_to({"message": "trigger_slow_response"})

        # Should receive user message echo
        await self.receive_from_communicator(communicator)

        # Should receive timeout error
        response = await self.receive_from_communicator(communicator)
        self.assertEqual(response["type"], "error")
        self.assertEqual(response["error"], "AI response timed out")

        await communicator.disconnect()
