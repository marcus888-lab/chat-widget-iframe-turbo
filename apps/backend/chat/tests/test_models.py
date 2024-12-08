from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from ..models import ChatSession, Message, ChatResponse, ChatDependencies
from .test_base import ChatTestCase
import uuid


class ChatSessionModelTests(ChatTestCase):
    def test_chat_session_creation(self):
        """Test ChatSession model creation and string representation"""
        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))
        self.assertEqual(str(session), f"Chat Session {session.session_id}")
        self.assertTrue(session.is_active)
        self.assertIsNotNone(session.created_at)
        self.assertIsNotNone(session.updated_at)

    def test_chat_session_unique_id(self):
        """Test that session_id must be unique"""
        session_id = str(uuid.uuid4())
        ChatSession.objects.create(session_id=session_id)
        with self.assertRaises(ValidationError):
            ChatSession.objects.create(session_id=session_id)

    def test_session_deactivation(self):
        """Test session deactivation"""
        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))
        session.is_active = False
        session.save()

        # Verify session state
        refreshed_session = ChatSession.objects.get(id=session.id)
        self.assertFalse(refreshed_session.is_active)

    def test_session_update_timestamp(self):
        """Test that updated_at is changed when session is modified"""
        session = ChatSession.objects.create(session_id=str(uuid.uuid4()))
        original_updated_at = session.updated_at

        # Wait a moment to ensure timestamp difference
        session.is_active = False
        session.save()

        self.assertGreater(session.updated_at, original_updated_at)

    def test_session_cleanup(self):
        """Test cleanup of old inactive sessions"""
        # Create old inactive session
        old_date = timezone.now() - timedelta(days=8)
        old_session = ChatSession.objects.create(
            session_id=str(uuid.uuid4()),
            is_active=False
        )
        # Manually update created_at to bypass auto_now_add
        ChatSession.objects.filter(id=old_session.id).update(created_at=old_date)

        # Create recent inactive session
        recent_session = ChatSession.objects.create(
            session_id=str(uuid.uuid4()),
            is_active=False
        )

        # Create active session
        active_session = ChatSession.objects.create(
            session_id=str(uuid.uuid4())
        )

        # Cleanup sessions older than 7 days and inactive
        ChatSession.cleanup_old_sessions()

        # Verify only old inactive session was deleted
        self.assertFalse(ChatSession.objects.filter(id=old_session.id).exists())
        self.assertTrue(ChatSession.objects.filter(id=recent_session.id).exists())
        self.assertTrue(ChatSession.objects.filter(id=active_session.id).exists())


class MessageModelTests(ChatTestCase):
    def setUp(self):
        super().setUp()
        self.session = ChatSession.objects.create(session_id=str(uuid.uuid4()))

    def test_message_creation(self):
        """Test Message model creation and string representation"""
        message = Message.objects.create(
            session=self.session,
            role="user",
            content="Test message"
        )
        self.assertEqual(
            str(message),
            f"user message in session {self.session.session_id}"
        )
        self.assertEqual(message.content, "Test message")
        self.assertIsNotNone(message.created_at)

    def test_message_ordering(self):
        """Test that messages are ordered by created_at"""
        msg1 = Message.objects.create(
            session=self.session,
            role="user",
            content="First message"
        )
        msg2 = Message.objects.create(
            session=self.session,
            role="assistant",
            content="Second message"
        )
        messages = Message.objects.filter(session=self.session)
        self.assertEqual(messages[0], msg1)
        self.assertEqual(messages[1], msg2)

    def test_message_role_validation(self):
        """Test message role validation"""
        # Valid roles
        Message.objects.create(
            session=self.session,
            role="user",
            content="User message"
        )
        Message.objects.create(
            session=self.session,
            role="assistant",
            content="Assistant message"
        )
        Message.objects.create(
            session=self.session,
            role="system",
            content="System message"
        )

        # Invalid role
        with self.assertRaises(ValidationError):
            Message.objects.create(
                session=self.session,
                role="invalid",  # shortened to fit within 10 chars
                content="Invalid message"
            )

    def test_message_content_validation(self):
        """Test message content validation"""
        # Empty content
        with self.assertRaises(ValidationError):
            Message.objects.create(
                session=self.session,
                role="user",
                content=""
            )

        # None content
        with self.assertRaises(ValidationError):
            Message.objects.create(
                session=self.session,
                role="user",
                content=None
            )

    def test_message_session_cascade(self):
        """Test message deletion on session deletion"""
        Message.objects.create(
            session=self.session,
            role="user",
            content="Test message"
        )

        # Delete session
        self.session.delete()

        # Verify message was also deleted
        self.assertEqual(Message.objects.count(), 0)

    def test_message_history_retrieval(self):
        """Test retrieval of message history"""
        # Create multiple messages
        messages = [
            Message.objects.create(
                session=self.session,
                role="user",
                content=f"User message {i}"
            ) for i in range(3)
        ]
        messages.extend([
            Message.objects.create(
                session=self.session,
                role="assistant",
                content=f"Assistant message {i}"
            ) for i in range(3)
        ])

        # Test retrieval order
        history = Message.objects.filter(session=self.session).order_by('created_at')
        self.assertEqual(len(history), 6)
        self.assertEqual(history[0].content, "User message 0")
        self.assertEqual(history[3].content, "Assistant message 0")

        # Test role filtering
        user_messages = Message.objects.filter(session=self.session, role="user")
        self.assertEqual(len(user_messages), 3)
        assistant_messages = Message.objects.filter(session=self.session, role="assistant")
        self.assertEqual(len(assistant_messages), 3)


class PydanticModelTests(ChatTestCase):
    def test_chat_response_validation(self):
        """Test ChatResponse Pydantic model validation"""
        # Valid response
        response = ChatResponse(
            message="Test response",
            context_used=True,
            confidence=0.95
        )
        self.assertEqual(response.message, "Test response")
        self.assertTrue(response.context_used)
        self.assertEqual(response.confidence, 0.95)

        # Invalid confidence (should be between 0 and 1)
        with self.assertRaises(Exception):
            ChatResponse(
                message="Test response",
                context_used=True,
                confidence=1.5
            )

        # Empty message
        with self.assertRaises(Exception):
            ChatResponse(
                message="",
                context_used=True,
                confidence=0.5
            )

        # None message
        with self.assertRaises(Exception):
            ChatResponse(
                message=None,
                context_used=True,
                confidence=0.5
            )

        # Invalid confidence type
        with self.assertRaises(Exception):
            ChatResponse(
                message="Test response",
                context_used=True,
                confidence="high"
            )

    def test_chat_dependencies(self):
        """Test ChatDependencies dataclass"""
        # Test with valid history
        history = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"}
        ]
        deps = ChatDependencies(
            session_id="test-session",
            history=history
        )
        self.assertEqual(deps.session_id, "test-session")
        self.assertEqual(len(deps.history), 2)
        self.assertEqual(deps.history[0]["role"], "user")
        self.assertEqual(deps.history[1]["role"], "assistant")

        # Test with empty history
        deps_empty = ChatDependencies(
            session_id="test-session",
            history=[]
        )
        self.assertEqual(len(deps_empty.history), 0)

        # Test with invalid history format
        with self.assertRaises(ValueError):
            ChatDependencies(
                session_id="test-session",
                history=[{"invalid": "format"}]
            )

        # Test with empty session_id
        with self.assertRaises(ValueError):
            ChatDependencies(
                session_id="",
                history=history
            )
