"""Global agent registry — assembled from per-agent files in definitions/.

Adding a new agent:
1. Create `definitions/<name>.py` exporting `AGENT: AgentConfig`.
2. Import it here and add it to AGENT_LIST in pipeline order.

The order in AGENT_LIST controls how agents render in the UI sidebar.
"""

from __future__ import annotations

from .base import AgentConfig
from .definitions import (
    booker,
    compliance,
    concierge,
    itinerary,
    matchmaker,
    negotiator,
    payments,
    scout,
    social,
    telegram_bot,
)

# Listed in the order a customer flows through the platform.
AGENT_LIST: list[AgentConfig] = [
    concierge.AGENT,
    itinerary.AGENT,
    scout.AGENT,
    matchmaker.AGENT,
    negotiator.AGENT,
    booker.AGENT,
    compliance.AGENT,
    payments.AGENT,
    social.AGENT,
    telegram_bot.AGENT,
]

AGENTS: dict[str, AgentConfig] = {agent.name: agent for agent in AGENT_LIST}


def get_agent(name: str) -> AgentConfig | None:
    return AGENTS.get(name)
