import pytest
from django.db import connection

@pytest.fixture(autouse=True)
def setup_test_environment(db):
    """Set up test environment for each test"""
    pass

@pytest.fixture
def mock_agent():
    """Provide a mock agent for testing"""
    from .mock_agent import MockAgent
    agent = MockAgent()
    return agent
