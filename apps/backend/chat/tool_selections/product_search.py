from typing import Optional, List
from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_functions_agent
from langchain.tools import Tool
from langchain.agents import AgentExecutor
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema.messages import SystemMessage, HumanMessage, AIMessage
from products.services import ProductSearchService
import logging
import json

logger = logging.getLogger(__name__)

def create_product_search_agent(api_key: str):
    """Create a LangChain agent for product search"""

    def product_search(query: str) -> str:
        """Search for products in the catalog.

        Args:
            query: The search query (e.g., "blue shirts", "office chairs")
        """
        logger.debug(f"Product search called with: query={query}")

        # Initialize service and perform search
        service = ProductSearchService()
        results = service.search(
            query=query,
            limit=10,
            include_signed_urls=True
        )

        return json.dumps(results)

    # Create LangChain chat model with minimal configuration
    llm = ChatOpenAI(
        api_key=api_key,
        model="gpt-4",
        temperature=0.1
    )

    # Create the product search tool
    product_search_tool = Tool(
        name="product_search",
        func=product_search,
        description="""Search for products in the catalog. Use this tool for ANY product-related query.
        The tool accepts a query parameter for searching products."""
    )

    # Create and return the agent using the new method
    tools = [product_search_tool]

    # Create a prompt template that includes system message and chat history
    prompt = ChatPromptTemplate.from_messages([
        MessagesPlaceholder(variable_name="chat_history"),
        HumanMessage(content="{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    # Create the agent with the OpenAI Functions agent type
    agent = create_openai_functions_agent(
        llm=llm,
        tools=tools,
        prompt=prompt
    )

    # Create the agent executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True,
        return_intermediate_steps=True
    )

    return agent_executor
