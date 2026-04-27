"""Flight search and booking. Mock-only — would use Duffel in production."""

from __future__ import annotations

from typing import Any

from ._shared import ToolDef


# Realistic-feeling mock catalog of flight options. The handler ranks slices
# of this list by destination match + max_price filter; layovers and prices
# are deterministic so repeated calls return stable rankings.
_AIRLINE_OPTIONS = [
    {"airline": "LATAM", "layovers": 1, "base_price_usd": 1240, "duration_hours": 14},
    {"airline": "Avianca", "layovers": 1, "base_price_usd": 1180, "duration_hours": 16},
    {"airline": "JetBlue", "layovers": 0, "base_price_usd": 1480, "duration_hours": 9},
    {"airline": "United", "layovers": 1, "base_price_usd": 1340, "duration_hours": 12},
    {"airline": "Air France", "layovers": 1, "base_price_usd": 1390, "duration_hours": 13},
    {"airline": "Turkish Airlines", "layovers": 1, "base_price_usd": 1095, "duration_hours": 18},
]


def _search_flights(input: dict[str, Any]) -> dict[str, Any]:
    """Return a price-ranked list of flight options for a route.

    Mock: prices are nudged by destination string length so different
    destinations produce different orderings, but the same destination is
    deterministic across calls.
    """
    origin = (input.get("origin") or "").upper()
    destination = (input.get("destination") or "").upper()
    max_price = input.get("max_price")
    passengers = int(input.get("passengers") or 1)

    if not origin or not destination:
        return {"error": "origin and destination are required"}

    nudge = (len(destination) * 7) % 90  # Stable per-destination price nudge
    options = []
    for opt in _AIRLINE_OPTIONS:
        per_pax = opt["base_price_usd"] + nudge
        if max_price and per_pax > max_price:
            continue
        options.append(
            {
                "airline": opt["airline"],
                "layovers": opt["layovers"],
                "durationHours": opt["duration_hours"],
                "perPaxUsd": per_pax,
                "totalUsd": per_pax * passengers,
            }
        )
    options.sort(key=lambda o: (o["perPaxUsd"], o["layovers"]))

    return {
        "origin": origin,
        "destination": destination,
        "passengers": passengers,
        "departDate": input.get("depart_date"),
        "returnDate": input.get("return_date"),
        "options": options[:5],
        "note": "[mock] Real search would use Duffel. Prices are illustrative.",
    }


def _book_flight(input: dict[str, Any]) -> dict[str, Any]:
    """Hold flights for a customer. Stripe is disabled — bookings are held only."""
    return {
        "held": True,
        "quote": {"airline": "LATAM", "total_usd": 1240, "layovers": 1},
        **input,
        "note": "[mock] Real bookings would use Duffel.",
    }


TOOLS: dict[str, ToolDef] = {
    "search_flights": ToolDef(
        name="search_flights",
        description="Search and rank flight options between an origin and destination.",
        input_schema={
            "type": "object",
            "properties": {
                "origin": {"type": "string", "description": "IATA code or city, e.g. 'JFK'."},
                "destination": {"type": "string"},
                "depart_date": {"type": "string"},
                "return_date": {"type": "string"},
                "passengers": {"type": "number"},
                "max_price": {"type": "number", "description": "USD ceiling per passenger."},
            },
            "required": ["origin", "destination", "depart_date", "passengers"],
        },
        handler=_search_flights,
    ),
    "book_flight": ToolDef(
        name="book_flight",
        description="Search and hold flights for a customer.",
        input_schema={
            "type": "object",
            "properties": {
                "origin": {"type": "string"},
                "destination": {"type": "string"},
                "depart_date": {"type": "string"},
                "return_date": {"type": "string"},
                "passengers": {"type": "number"},
            },
            "required": ["origin", "destination", "depart_date", "passengers"],
        },
        handler=_book_flight,
    ),
}
