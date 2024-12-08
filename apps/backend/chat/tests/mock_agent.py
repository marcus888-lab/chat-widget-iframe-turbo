from typing import Optional, Dict, Any, List
from langchain.agents import AgentExecutor
from langchain.chat_models import ChatOpenAI
from langchain.schema import AgentAction, AgentFinish
import json

class MockAgent:
    """Mock agent for testing that simulates Langchain agent behavior"""

    def __init__(self):
        self.mock_products = [
            {
                "category": "Furniture",
                "name": "Modern Office Chair",
                "description": "Ergonomic office chair with lumbar support",
                "price": 199.99,
                "signed_url": "http://localhost:9000/chat-files/products/chair.jpg",
                "scores": {
                    "hybrid": 0.95
                }
            },
            {
                "category": "Furniture",
                "name": "Standing Desk",
                "description": "Adjustable height standing desk",
                "price": 399.99,
                "signed_url": "http://localhost:9000/chat-files/products/desk.jpg",
                "scores": {
                    "hybrid": 0.85
                }
            }
        ]

    async def arun(self, input: str, chat_history: Optional[List] = None) -> str:
        """Simulate agent run with product search results"""
        # Create mock search results
        search_results = {
            "data": self.mock_products,
            "metadata": {
                "search_type": "hybrid",
                "total_results": len(self.mock_products)
            }
        }

        # Create mock intermediate steps
        self.intermediate_steps = [
            (
                AgentAction(
                    tool="product_search",
                    tool_input={"query": input},
                    log="Searching for products..."
                ),
                json.dumps(search_results)
            )
        ]

        # Generate response summary
        summary = f"I found {len(self.mock_products)} products matching your search:\n\n"
        for product in self.mock_products:
            summary += f"• {product['name']} (${product['price']:.2f}): {product['description']}\n"

        return summary
