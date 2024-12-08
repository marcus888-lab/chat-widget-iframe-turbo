from typing import Optional
from ..models import ChatResponse, ChatDependencies, ToolResult

class MockAgent:
    """Mock agent for testing and development"""
    async def achat(self, message: str, history: list = None, ctx: Optional[ChatDependencies] = None) -> ChatResponse:
        """Mock chat response with tool results based on message content"""
        tool_results = []
        response_text = f"Mock response to: {message}"

        # Handle code-related queries
        if any(word in message.lower() for word in ["code", "function", "programming"]):
            tool_results.append(ToolResult(
                tool="code",
                result={
                    "code": """function greet(name) {
    return `Hello, ${name}!`;
}

// Example usage
console.log(greet('World'));""",
                    "language": "javascript"
                }
            ))
            response_text = "Here's a simple JavaScript greeting function:"

        # Handle search-related queries
        if any(word in message.lower() for word in ["search", "find", "look up"]):
            tool_results.append(ToolResult(
                tool="search",
                result={
                    "query": message,
                    "results": [
                        {
                            "title": "Mock Search Result 1",
                            "description": "This is the first mock search result that matches your query.",
                            "url": "https://example.com/result1"
                        },
                        {
                            "title": "Mock Search Result 2",
                            "description": "This is the second mock search result with different information.",
                            "url": "https://example.com/result2"
                        }
                    ]
                }
            ))
            response_text = "Here are some search results I found:"

        # Handle table-related queries
        if any(word in message.lower() for word in ["table", "data", "list"]):
            tool_results.append(ToolResult(
                tool="table",
                result={
                    "caption": "Sample Data Table",
                    "columns": [
                        {"key": "id", "title": "ID"},
                        {"key": "name", "title": "Name"},
                        {"key": "role", "title": "Role"}
                    ],
                    "rows": [
                        {"id": 1, "name": "John Doe", "role": "Developer"},
                        {"id": 2, "name": "Jane Smith", "role": "Designer"},
                        {"id": 3, "name": "Bob Johnson", "role": "Manager"}
                    ]
                }
            ))
            response_text = "Here's a table with the requested information:"

        # Create the response
        response = ChatResponse(
            message=response_text,
            context_used=bool(tool_results),  # True if any tools were used
            confidence=1.0
        )

        # Add tool results if any were generated
        if tool_results:
            response.toolResults = tool_results

        return response
