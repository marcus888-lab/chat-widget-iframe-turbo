from typing import List, Dict, Any, Optional, Union
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from .tool_selections import create_product_search_agent
import json
import logging
import os
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer for chat interactions"""

    async def connect(self):
        """Handle WebSocket connection"""
        session_id = self.scope["query_string"].decode().split("=")[1]
        if not session_id:
            await self.close(code=4001)
            return

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            await self.close(code=4001)
            return

        self.session_id = session_id
        self.agent = create_product_search_agent(api_key)
        self.message_history: List[Union[SystemMessage, HumanMessage, AIMessage]] = []
        self.last_system_prompt = None
        self.is_processing = False

        await self.accept()
        logger.info(f"WebSocket connected for session {session_id}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        logger.info(f"WebSocket disconnected for session {self.session_id} with code {close_code}")
        self.message_history = []
        self.last_system_prompt = None
        self.is_processing = False

    async def receive_json(self, content):
        """Handle incoming WebSocket messages"""
        try:
            if self.is_processing:
                logger.warning(f"Ignoring message while processing: {content}")
                return

            logger.debug(f"Received message: {content}")

            # Handle empty or invalid content
            if not content or not isinstance(content, dict):
                logger.warning(f"Invalid message content: {content}")
                await self.send_error("Invalid message format")
                return

            # If message field exists, treat it as a chat message
            if "message" in content:
                message = content["message"]

                # Handle system prompts by updating agent's system message
                if message.startswith("[SYSTEM PROMPT]"):
                    system_content = message.replace("[SYSTEM PROMPT]", "").strip()
                    # Skip if it's the same as the last system prompt
                    if system_content == self.last_system_prompt:
                        return
                    self.last_system_prompt = system_content
                    self.message_history = [SystemMessage(content=system_content)]
                    return

                # Echo back user message first
                await self.send_json({
                    "type": "message",
                    "role": "user",
                    "message": message,
                    "timestamp": datetime.now().isoformat()
                })

                # Then process the message
                self.is_processing = True
                try:
                    await self.handle_message(content)
                except asyncio.CancelledError:
                    logger.warning("Message processing was cancelled")
                    await self.send_error("Message processing was cancelled")
                finally:
                    self.is_processing = False
            else:
                logger.warning(f"Message content missing required 'message' field: {content}")
                await self.send_error("Message content required")

        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            await self.send_error(str(e))
            self.is_processing = False

    async def handle_message(self, content: Dict[str, Any]):
        """Handle chat messages"""
        try:
            # Add user message to history
            user_message = content["message"]
            self.message_history.append(HumanMessage(content=user_message))

            # Keep only the last 10 messages
            if len(self.message_history) > 10:
                # Always keep the system message if it exists
                if isinstance(self.message_history[0], SystemMessage):
                    self.message_history = [self.message_history[0]] + self.message_history[-9:]
                else:
                    self.message_history = self.message_history[-10:]

            # Run agent with direct product search
            try:
                result = await asyncio.wait_for(
                    self.agent.ainvoke({
                        "input": user_message,
                        "chat_history": self.message_history
                    }),
                    timeout=60.0  # 60 second timeout
                )
            except asyncio.TimeoutError:
                logger.error("Agent execution timed out")
                await self.send_json({
                    "type": "message",
                    "role": "assistant",
                    "message": "I apologize, but the search took too long. Please try again with a more specific query.",
                    "timestamp": datetime.now().isoformat(),
                    "metadata": {
                        "error": "timeout",
                        "tool_results": [{
                            "tool": "product_search",
                            "result": {
                                "data": [],
                                "metadata": {
                                    "search_type": "hybrid",
                                    "total_results": 0,
                                    "error": "timeout"
                                }
                            }
                        }]
                    }
                })
                return
            except asyncio.CancelledError:
                logger.warning("Agent execution was cancelled")
                await self.send_json({
                    "type": "message",
                    "role": "assistant",
                    "message": "The search was interrupted. Please try again.",
                    "timestamp": datetime.now().isoformat(),
                    "metadata": {
                        "error": "cancelled",
                        "tool_results": [{
                            "tool": "product_search",
                            "result": {
                                "data": [],
                                "metadata": {
                                    "search_type": "hybrid",
                                    "total_results": 0,
                                    "error": "cancelled"
                                }
                            }
                        }]
                    }
                })
                return

            # Extract agent response
            agent_response = result.get("output", "")
            tool_results = []

            # Parse tool results if any
            if "intermediate_steps" in result:
                for action, tool_output in result["intermediate_steps"]:
                    if isinstance(tool_output, str):
                        try:
                            # Parse the JSON string result
                            search_data = json.loads(tool_output)
                            tool_results.append({
                                "tool": "product_search",
                                "result": tool_output  # Keep raw JSON string for consistent parsing
                            })
                        except json.JSONDecodeError as e:
                            logger.error(f"Error parsing tool output: {str(e)}")
                            logger.debug(f"Raw tool output: {tool_output}")

            # Add agent response to history
            self.message_history.append(AIMessage(content=agent_response))

            # Send response
            await self.send_json({
                "type": "message",
                "role": "assistant",
                "message": agent_response,
                "timestamp": datetime.now().isoformat(),
                "metadata": {
                    "context_used": True,
                    "confidence": 1.0,
                    "tool_results": tool_results
                }
            })

        except Exception as e:
            logger.error(f"Error in chat: {str(e)}")
            await self.send_error(str(e))

    async def send_error(self, error: str):
        """Send error message to client"""
        await self.send_json({
            "type": "message",
            "role": "system",
            "message": f"Error: {error}",
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "error": "system_error",
                "tool_results": [{
                    "tool": "product_search",
                    "result": {
                        "data": [],
                        "metadata": {
                            "search_type": "hybrid",
                            "total_results": 0,
                            "error": "system_error"
                        }
                    }
                }]
            }
        })
