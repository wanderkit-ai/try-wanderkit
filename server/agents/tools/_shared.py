"""Shared types and helpers for tool modules.

Every domain file under `tools/` defines plain Python handler functions plus a
`TOOLS` dict mapping tool name -> ToolDef. The package-level `tools/__init__.py`
merges all of those dicts into `ALL_TOOLS`.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

ToolHandler = Callable[[dict[str, Any]], Any]


@dataclass(frozen=True)
class ToolDef:
    """One tool the LLM can call.

    `input_schema` is a JSON Schema dict that Anthropic expects in tool defs.
    `handler` is a plain Python function that receives the parsed input dict
    and returns a JSON-serializable result.
    """

    name: str
    description: str
    input_schema: dict[str, Any]
    handler: ToolHandler


def tools_for(names: list[str], registry: dict[str, ToolDef]) -> list[ToolDef]:
    """Slice the global tool registry down to one agent's allow-list."""
    return [registry[name] for name in names]


def to_anthropic_tools(defs: list[ToolDef]) -> list[dict[str, Any]]:
    """Convert ToolDef objects into the shape Anthropic's API expects."""
    return [
        {
            "name": tool.name,
            "description": tool.description,
            "input_schema": tool.input_schema,
        }
        for tool in defs
    ]
