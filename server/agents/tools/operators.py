"""Operator search — used by Matchmaker, Negotiator, and Itinerary."""

from __future__ import annotations

from typing import Any

from backend.agents.mock_data import OPERATORS

from ._shared import ToolDef

_TIER_RANK = {"$": 1, "$$": 2, "$$$": 3}


def _search_operators(input: dict[str, Any]) -> list[dict[str, Any]]:
    """Search operators by region, style, and price tier.

    Sorted by rating descending, then response speed ascending — best first.
    """
    region = str(input.get("region") or "").lower()
    style = input.get("style")
    max_tier = input.get("max_tier")
    matches = []
    for operator in OPERATORS:
        if region and region not in operator["country"].lower() and region not in operator["region"].lower():
            continue
        if style and style not in operator.get("specialties", []):
            continue
        if max_tier and _TIER_RANK[operator["priceTier"]] > _TIER_RANK.get(max_tier, 99):
            continue
        matches.append(operator)
    matches.sort(key=lambda op: (-op["rating"], op["responseHours"]))
    return [
        {
            "id": op["id"],
            "company": op["company"],
            "contact": op["contactName"],
            "country": op["country"],
            "region": op["region"],
            "specialties": op["specialties"],
            "rating": op["rating"],
            "replyTimeHours": op["responseHours"],
            "priceTier": op["priceTier"],
            "whatsapp": op["whatsapp"],
        }
        for op in matches
    ]


TOOLS: dict[str, ToolDef] = {
    "search_operators": ToolDef(
        name="search_operators",
        description="Search local operators by region/country and trip style.",
        input_schema={
            "type": "object",
            "properties": {
                "region": {"type": "string"},
                "style": {"type": "string"},
                "max_tier": {"type": "string", "enum": ["$", "$$", "$$$"]},
            },
        },
        handler=_search_operators,
    ),
}
