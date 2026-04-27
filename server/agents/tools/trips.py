"""Trip data tools — fetch briefs, list quotes, save new briefs."""

from __future__ import annotations

import time
from typing import Any

from backend.agents.mock_data import OPERATORS, QUOTES, TRIPS, find_by_id

from ._shared import ToolDef


def _get_trip(input: dict[str, Any]) -> dict[str, Any]:
    """Fetch a single trip brief by id. Returns {error} if not found."""
    trip = find_by_id(TRIPS, input.get("trip_id"))
    return trip if trip else {"error": "Trip not found"}


def _list_trip_quotes(input: dict[str, Any]) -> list[dict[str, Any]]:
    """List operator quotes attached to a trip, joined with operator names."""
    trip_id = input.get("trip_id")
    out = []
    for quote in QUOTES:
        if quote.get("tripId") != trip_id:
            continue
        operator = find_by_id(OPERATORS, quote.get("operatorId"))
        out.append(
            {
                "id": quote["id"],
                "operator": operator.get("company") if operator else None,
                "operatorId": operator.get("id") if operator else None,
                "status": quote["status"],
                "perPersonUsd": quote["perPersonCents"] / 100,
                "totalUsd": quote["totalCents"] / 100,
                "includes": quote["includes"],
                "excludes": quote["excludes"],
            }
        )
    return out


def _draft_brief(input: dict[str, Any]) -> dict[str, Any]:
    """Save a structured trip brief produced by the Concierge.

    Returns a mock brief_id that downstream agents (Matchmaker, Itinerary)
    can use to reference the saved brief.
    """
    return {
        "saved": True,
        "brief_id": f"brief_{int(time.time() * 1000)}",
        **input,
        "note": "[mock] Brief stored. Matchmaker can now take over.",
    }


TOOLS: dict[str, ToolDef] = {
    "get_trip": ToolDef(
        name="get_trip",
        description="Fetch a trip brief by id.",
        input_schema={
            "type": "object",
            "properties": {"trip_id": {"type": "string"}},
            "required": ["trip_id"],
        },
        handler=_get_trip,
    ),
    "list_trip_quotes": ToolDef(
        name="list_trip_quotes",
        description="List quotes for a trip.",
        input_schema={
            "type": "object",
            "properties": {"trip_id": {"type": "string"}},
            "required": ["trip_id"],
        },
        handler=_list_trip_quotes,
    ),
    "draft_brief": ToolDef(
        name="draft_brief",
        description="Save a structured trip brief from intake.",
        input_schema={
            "type": "object",
            "properties": {
                "customer_id": {"type": "string"},
                "destination": {"type": "string"},
                "style": {"type": "array", "items": {"type": "string"}},
                "season": {"type": "string", "enum": ["spring", "summer", "fall", "winter"]},
                "budget_per_person": {"type": "number"},
                "group_size": {"type": "number"},
                "must_haves": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["customer_id", "destination", "style", "budget_per_person"],
        },
        handler=_draft_brief,
    ),
}
