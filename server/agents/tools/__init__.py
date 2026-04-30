"""Tool registry — assembles ALL_TOOLS from every domain module.

Adding a new tool: create the handler + ToolDef in the relevant domain file
(or a new file under tools/), export a `TOOLS` dict from that module, and
add it to the merge list below. No other wiring is needed — the runner
resolves tools by name against ALL_TOOLS.
"""

from __future__ import annotations

from ._shared import ToolDef, ToolHandler, to_anthropic_tools, to_openai_tools
from ._shared import tools_for as _tools_for
from . import (
    activities,
    compliance,
    crm,
    documents,
    email_resend,
    flights,
    flights_amadeus,
    gsheets,
    hotels_amadeus,
    intelligence,
    itinerary,
    lodging,
    messaging,
    operators,
    payments,
    scrape_firecrawl,
    slack,
    social,
    telegram,
    trips,
    weather_openmeteo,
)

# Order matters only for the agent-startup log — tools resolve by name.
_DOMAIN_MODULES = (
    crm,
    trips,
    operators,
    messaging,
    itinerary,
    flights,
    flights_amadeus,
    lodging,
    hotels_amadeus,
    weather_openmeteo,
    email_resend,
    telegram,
    intelligence,
    compliance,
    documents,
    payments,
    social,
    activities,
    slack,
    scrape_firecrawl,
    gsheets,
)


def _merge() -> dict[str, ToolDef]:
    out: dict[str, ToolDef] = {}
    for module in _DOMAIN_MODULES:
        for name, tool_def in module.TOOLS.items():
            if name in out:
                raise RuntimeError(f"Duplicate tool name across modules: {name}")
            out[name] = tool_def
    return out


ALL_TOOLS: dict[str, ToolDef] = _merge()


def tools_for(names: list[str]) -> list[ToolDef]:
    """Resolve a list of tool names against the global registry."""
    return _tools_for(names, ALL_TOOLS)


__all__ = [
    "ALL_TOOLS",
    "ToolDef",
    "ToolHandler",
    "tools_for",
    "to_anthropic_tools",
    "to_openai_tools",
]
