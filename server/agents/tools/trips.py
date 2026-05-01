"""Trip data tools — fetch briefs, list quotes, save new briefs."""

from __future__ import annotations

import time
from typing import Any

from backend.agents.mock_data import OPERATORS, QUOTES, TRIPS, find_by_id

from ._shared import ToolDef


def _list_trips(input: dict[str, Any]) -> list[dict[str, Any]]:
    """List all trips, optionally filtered by status or destination keyword."""
    status = input.get("status")
    destination = (input.get("destination") or "").lower()
    out = []
    for t in TRIPS:
        if status and t.get("status") != status:
            continue
        if destination and destination not in t.get("destination", "").lower() and destination not in t.get("title", "").lower():
            continue
        budget = t.get("budgetPerPerson", 0)
        out.append({
            "id": t["id"],
            "title": t["title"],
            "destination": t["destination"],
            "status": t["status"],
            "startDate": t["startDate"],
            "endDate": t["endDate"],
            "groupSize": t["groupSize"],
            "style": t["style"],
            "budgetPerPerson": f"${budget // 100}/pp/day" if budget else "unset",
            "hasItinerary": bool(t.get("itinerary")),
        })
    return out


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
    "list_trips": ToolDef(
        name="list_trips",
        description="List all trips in the system. Use to find a trip by name or destination when no trip_id is provided.",
        input_schema={
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "Filter by status (brief, sourcing, quoting, approved, booked, completed, cancelled)"},
                "destination": {"type": "string", "description": "Filter by destination keyword"},
            },
        },
        handler=_list_trips,
    ),
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
