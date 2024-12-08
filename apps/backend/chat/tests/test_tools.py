import pytest
from unittest.mock import AsyncMock, MagicMock
from ..tests.mock_agent import MockAgent
from ..providers import ChatAgentProvider

@pytest.mark.asyncio
async def test_product_search_tool_usage():
    """Test that the agent uses the product search tool appropriately"""
    # Set up mock agent
    agent = MockAgent()
    ChatAgentProvider.set_agent(agent)

    # Test basic product query
    response = await agent.run("Show me some office chairs")
    assert response.tool_results is not None
    assert len(response.tool_results) > 0
    assert response.tool_results[0].tool_name == "product_search"
    assert "chair" in response.tool_results[0].args["query"].lower()

    # Test query with price constraint
    response = await agent.run("Find furniture under $300")
    assert response.tool_results is not None
    assert len(response.tool_results) > 0
    assert response.tool_results[0].tool_name == "product_search"
    assert response.tool_results[0].args.get("max_price") == 300

    # Test query with category
    response = await agent.run("What desks do you have in the Furniture category?")
    assert response.tool_results is not None
    assert len(response.tool_results) > 0
    assert response.tool_results[0].tool_name == "product_search"
    assert "desk" in response.tool_results[0].args["query"].lower()
    assert response.tool_results[0].args.get("category", "").lower() == "furniture"

    # Test query with price range
    response = await agent.run("Show me office chairs between $150 and $400")
    assert response.tool_results is not None
    assert len(response.tool_results) > 0
    assert response.tool_results[0].tool_name == "product_search"
    assert "chair" in response.tool_results[0].args["query"].lower()
    assert response.tool_results[0].args.get("min_price") == 150
    assert response.tool_results[0].args.get("max_price") == 400

@pytest.mark.asyncio
async def test_system_prompt_handling():
    """Test that system prompts are handled correctly"""
    # Set up mock agent
    agent = MockAgent()
    ChatAgentProvider.set_agent(agent)

    # Mock WebSocket communicator
    communicator = MagicMock()
    communicator.connect = AsyncMock(return_value=(True, None))
    communicator.receive_json_from = AsyncMock()
    communicator.send_json_to = AsyncMock()
    communicator.disconnect = AsyncMock()

    # Test initial system prompt
    initial_prompt = "[SYSTEM PROMPT] You are a helpful product search assistant. Welcome users and explain available features."
    await communicator.send_json_to({
        "message": initial_prompt
    })

    # Test product search prompt
    await communicator.send_json_to({
        "message": "[SYSTEM PROMPT] When users ask about products, use the product_search tool DIRECTLY without any introductory messages."
    })

    # Send a product query
    await communicator.send_json_to({
        "message": "Show me office chairs"
    })

    # Test result interaction prompt
    await communicator.send_json_to({
        "message": "[SYSTEM PROMPT] Help users interact with product search results. Guide them through options and features."
    })

    # Send a follow-up query
    await communicator.send_json_to({
        "message": "Tell me more about the first chair"
    })

    # Verify the agent's behavior changed appropriately
    response = await agent.run("Show me office chairs")
    assert response.tool_results is not None
    assert len(response.tool_results) > 0
    assert response.tool_results[0].tool_name == "product_search"
    assert "Let me search" not in response.message
    assert "I'll look" not in response.message
