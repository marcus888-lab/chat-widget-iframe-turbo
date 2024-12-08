import json
from channels.testing import WebsocketCommunicator
from django.test import TestCase
from channels.routing import URLRouter
from django.urls import re_path
from ..consumers import ChatConsumer
from ..models import ChatSession, Message, ChatResponse
import pytest
from unittest.mock import patch, AsyncMock
from .test_base import AsyncChatTestCase
import asyncio
import uuid


@pytest.mark.asyncio
class ChatConsumerTests(AsyncChatTestCase):
    async def receive_from_communicator(self, communicator, timeout=5):
        """Helper method to receive messages with longer timeout"""
        try:
            return await communicator.receive_json_from(timeout=timeout)
        except asyncio.TimeoutError:
            self.fail("Timed out waiting for response")

    async def test_websocket_connect(self):
        """Test WebSocket connection"""
        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))

        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session.session_id}/"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_message_echo(self):
        """Test that sent messages are echoed back"""
        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))

        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session.session_id}/"
        )
        await communicator.connect()

        # Send test message
        test_message = "Hello, World!"
        await communicator.send_json_to({
            "message": test_message
        })

        # Verify message echo
        response = await self.receive_from_communicator(communicator)
        self.assertEqual(response["type"], "message")
        self.assertEqual(response["role"], "user")
        self.assertEqual(response["message"], test_message)

        await communicator.disconnect()

    async def test_invalid_session(self):
        """Test connection with invalid session ID"""
        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application=application,
            path="/ws/chat/invalid-session/"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)  # Should connect even with invalid session

        await communicator.disconnect()

    @patch('chat.models.ChatAgentProvider.get_agent')
    async def test_ai_response(self, mock_get_agent):
        """Test AI response handling"""
        mock_agent = AsyncMock()
        mock_agent.achat.return_value = ChatResponse(
            message="AI response",
            context_used=True,
            confidence=0.95
        )
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

        # Send message
        await communicator.send_json_to({
            "message": "Hello AI"
        })

        # Verify user message
        response = await self.receive_from_communicator(communicator)
        self.assertEqual(response["type"], "message")
        self.assertEqual(response["role"], "user")
        self.assertEqual(response["message"], "Hello AI")

        # Verify AI response
        ai_response = await self.receive_from_communicator(communicator)
        self.assertEqual(ai_response["type"], "message")
        self.assertEqual(ai_response["role"], "assistant")
        self.assertEqual(ai_response["message"], "AI response")

        await communicator.disconnect()

    async def test_message_persistence(self):
        """Test that messages are persisted to database"""
        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))

        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session.session_id}/"
        )
        await communicator.connect()

        # Send message
        test_message = "Test persistence"
        await communicator.send_json_to({
            "message": test_message
        })

        # Wait for response
        await self.receive_from_communicator(communicator)

        # Verify message was saved
        messages = Message.objects.filter(session=session)
        self.assertEqual(messages.count(), 1)
        self.assertEqual(messages.first().content, test_message)

        await communicator.disconnect()

    async def test_error_handling(self):
        """Test error handling during message processing"""
        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))

        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session.session_id}/"
        )
        await communicator.connect()

        # Send invalid message format
        await communicator.send_json_to({
            "invalid": "format"
        })

        # Should receive error response
        response = await self.receive_from_communicator(communicator)
        self.assertEqual(response["type"], "error")
        self.assertEqual(response["error"], "Empty message")

        await communicator.disconnect()

    async def test_connection_state(self):
        """Test connection state management"""
        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))

        application = URLRouter([
            re_path(r"ws/chat/(?P<session_id>[^/]+)/$", ChatConsumer.as_asgi()),
        ])

        # Test multiple connections to same session
        communicator1 = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session.session_id}/"
        )
        communicator2 = WebsocketCommunicator(
            application=application,
            path=f"/ws/chat/{session.session_id}/"
        )

        # Both connections should work
        connected1, _ = await communicator1.connect()
        connected2, _ = await communicator2.connect()
        self.assertTrue(connected1)
        self.assertTrue(connected2)

        # Send message from first connection
        await communicator1.send_json_to({
            "message": "Hello from connection 1"
        })

        # Both connections should receive the message
        response1 = await self.receive_from_communicator(communicator1)
        self.assertEqual(response1["type"], "message")
        self.assertEqual(response1["message"], "Hello from connection 1")

        await communicator1.disconnect()
        await communicator2.disconnect()

    @patch('chat.models.ChatAgentProvider.get_agent')
    async def test_long_conversation(self, mock_get_agent):
        """Test handling of long conversations"""
        mock_agent = AsyncMock()
        mock_agent.achat.return_value = ChatResponse(
            message="AI response",
            context_used=True,
            confidence=0.95
        )
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

        # Send multiple messages
        for i in range(5):
            await communicator.send_json_to({
                "message": f"Message {i}"
            })
            # Receive user message echo
            response = await self.receive_from_communicator(communicator)
            self.assertEqual(response["type"], "message")
            self.assertEqual(response["message"], f"Message {i}")
            # Receive AI response
            ai_response = await self.receive_from_communicator(communicator)
            self.assertEqual(ai_response["type"], "message")
            self.assertEqual(ai_response["message"], "AI response")

        # Verify all messages were saved
        messages = Message.objects.filter(session=session)
        self.assertEqual(messages.count(), 10)  # 5 user messages + 5 AI responses

        await communicator.disconnect()
