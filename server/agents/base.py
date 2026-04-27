"""Shared types for agent definitions.

Lives outside registry.py so individual agent files in definitions/ can import
AgentConfig without creating a circular import on the registry.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AgentConfig:
    """One agent's identity, instructions, and tool allow-list.

    Each agent file in `definitions/` constructs one of these. The runner reads
    `system_prompt` and `tools` to drive the Anthropic tool-use loop; the UI
    reads everything else via `public()`.
    """

    name: str
    display_name: str
    emoji: str
    description: str
    system_prompt: str
    tools: list[str]
    starters: list[str]

    def public(self) -> dict:
        """Shape returned to the frontend by the /api/agents endpoint."""
        return {
            "name": self.name,
            "displayName": self.display_name,
            "emoji": self.emoji,
            "description": self.description,
            "starters": self.starters,
            "toolCount": len(self.tools),
        }
