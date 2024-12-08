import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .models import ChatSession, Message, ChatAgentProvider, ChatDependencies


class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.session_id = None
        self.last_message_time = None
        self.rate_limit_count = 0
        self.RATE_LIMIT_WINDOW = 60  # seconds
        self.RATE_LIMIT_MAX = 30  # messages per window
        self.MAX_MESSAGE_LENGTH = 10000

    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']

        try:
            # Get or create session
            session = await self.get_or_create_session()
            if not session.is_active:
                await self.close(code=4000)
                return

            await self.accept()
            self.last_message_time = timezone.now()
        except ValidationError as e:
            await self.close(code=4001)
            return
        except Exception as e:
            await self.close(code=4002)
            return

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        try:
            # Rate limiting check
            current_time = timezone.now()
            if self.last_message_time:
                time_diff = (current_time - self.last_message_time).total_seconds()
                if time_diff > self.RATE_LIMIT_WINDOW:
                    self.rate_limit_count = 0
                elif self.rate_limit_count >= self.RATE_LIMIT_MAX:
                    await self.send_error("Rate limit exceeded")
                    return

            self.last_message_time = current_time
            self.rate_limit_count += 1

            # Process message
            text_data_json = json.loads(text_data)
            message = text_data_json.get('message')

            # Validate message
            if not message or not message.strip():
                await self.send_error("Empty message")
                return

            if len(message) > self.MAX_MESSAGE_LENGTH:
                await self.send_error("Message too long")
                return

            # Save user message
            saved_message = await self.save_message('user', message)
            await self.send_message_response(saved_message)

            # Get AI response
            try:
                session = await self.get_or_create_session()
                if not session:
                    await self.send_error("Session not found")
                    return

                ai_response = await self.get_ai_response(message)
                if ai_response:
                    # Save AI response
                    saved_ai_message = await self.save_message('assistant', ai_response.message)

                    # Include tool results in metadata if present
                    metadata = {
                        'context_used': ai_response.context_used,
                        'confidence': ai_response.confidence
                    }
                    if ai_response.toolResults:
                        # Convert ToolResult objects to dictionaries
                        metadata['toolResults'] = [
                            {
                                'tool': tool.tool,
                                'result': tool.result
                            }
                            for tool in ai_response.toolResults
                        ]

                    await self.send_message_response(saved_ai_message, metadata)
                else:
                    await self.send_error("Failed to get AI response")
            except TimeoutError:
                await self.send_error("AI response timed out")
            except Exception as e:
                await self.send_error(str(e))

        except json.JSONDecodeError:
            await self.send_error("Invalid message format")
        except Exception as e:
            await self.send_error(str(e))

    @sync_to_async
    def get_or_create_session(self):
        """Get or create chat session"""
        session, _ = ChatSession.objects.get_or_create(
            session_id=self.session_id,
            defaults={'is_active': True}
        )
        return session

    @sync_to_async
    def save_message(self, role, content):
        """Save message to database"""
        session = ChatSession.objects.get(session_id=self.session_id)
        message = Message.objects.create(
            session=session,
            role=role,
            content=content
        )
        return message

    @sync_to_async
    def get_message_history(self):
        """Get message history for the session"""
        try:
            session = ChatSession.objects.get(session_id=self.session_id)
            messages = Message.objects.filter(session=session).order_by('created_at')
            return [
                {'role': msg.role, 'content': msg.content}
                for msg in messages
            ]
        except ObjectDoesNotExist:
            return []

    async def get_ai_response(self, message):
        """Get AI response using the chat agent"""
        chat_agent = ChatAgentProvider.get_agent()
        if not chat_agent:
            return None

        history = await self.get_message_history()
        deps = ChatDependencies(session_id=self.session_id, history=history)
        return await chat_agent.achat(message, history=history, ctx=deps)

    async def send_message_response(self, message, metadata=None):
        """Send message response to websocket"""
        response = {
            'type': 'message',
            'role': message.role,
            'message': message.content,
            'timestamp': message.created_at.isoformat()
        }
        if metadata:
            response.update(metadata)

        await self.send(text_data=json.dumps(response))

    async def send_error(self, error_message):
        """Send error message to websocket"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': error_message
        }))
