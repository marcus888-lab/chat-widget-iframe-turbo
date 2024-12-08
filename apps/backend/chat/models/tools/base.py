from typing import Any, Dict, Optional, Callable, Union, TypeVar
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

T = TypeVar('T')

class ToolCall(BaseModel):
    """Base model for tool execution results"""
    tool_name: str
    args: Dict[str, Any]
    result: Any = None

def create_tool(
    fn: Callable[..., Any],
    name: Optional[str] = None,
    description: Optional[str] = None,
    retries: int = 1,
) -> Dict[str, Any]:
    """Create a pydantic-ai tool from a function

    Args:
        fn: The function to wrap as a tool
        name: Tool name for function calling
        description: Tool description for function calling
        retries: Number of retries if tool execution fails

    Returns:
        Tool configuration dictionary
    """
    import inspect
    sig = inspect.signature(fn)

    # Extract parameter info from function annotations
    parameters = {}
    required_params = []

    for param_name, param in sig.parameters.items():
        if param_name == 'ctx':  # Skip context parameter
            continue

        param_type = param.annotation
        param_info = {
            "type": "string"  # Default to string
        }

        # Map Python types to JSON Schema types
        if param_type == int:
            param_info["type"] = "integer"
        elif param_type == float:
            param_info["type"] = "number"
        elif param_type == bool:
            param_info["type"] = "boolean"
        elif param_type == list:
            param_info["type"] = "array"
            param_info["items"] = {"type": "string"}

        # Handle optional parameters
        if param.default == inspect.Parameter.empty:
            required_params.append(param_name)
        else:
            param_info["default"] = param.default

        # Add docstring description if available
        if fn.__doc__:
            import re
            param_pattern = rf":param {param_name}:\s*([^\n]+)"
            match = re.search(param_pattern, fn.__doc__)
            if match:
                param_info["description"] = match.group(1).strip()

        parameters[param_name] = param_info

    # Create OpenAI function schema
    function_schema = {
        "name": name or fn.__name__,
        "description": description or fn.__doc__ or "",
        "parameters": {
            "type": "object",
            "properties": parameters,
            "required": required_params
        }
    }

    return {
        "fn": fn,
        "retries": retries,
        "function_call": function_schema  # Add function calling schema
    }
