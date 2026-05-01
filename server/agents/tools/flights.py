"""Flight search and booking. Mock-only — would use Duffel in production."""

from __future__ import annotations

from typing import Any

from ._shared import ToolDef


# Richer mock catalog with flight numbers, times, and AI scoring.
# ai_score balances nonstop preference, price, and reasonable duration.
_AIRLINE_OPTIONS = [
    {
        "airline": "JetBlue", "code": "B6", "flight_suffix": "421",
        "layovers": 0, "base_price_usd": 1480, "duration_hours": 9,
        "depart_time": "07:00", "arrive_time": "16:15",
        "ai_score_base": 92,
        "ai_reason": "Only nonstop option — saves 4–6 hours vs any layover. Best choice if you value arrival energy.",
    },
    {
        "airline": "Air France", "code": "AF", "flight_suffix": "038",
        "layovers": 1, "base_price_usd": 1390, "duration_hours": 13,
        "depart_time": "14:25", "arrive_time": "08:10+1",
        "ai_score_base": 86,
        "ai_reason": "Well-regarded carrier, comfortable CDG layover, arrives at a good hour for check-in.",
    },
    {
        "airline": "United", "code": "UA", "flight_suffix": "872",
        "layovers": 1, "base_price_usd": 1340, "duration_hours": 12,
        "depart_time": "11:40", "arrive_time": "23:55",
        "ai_score_base": 83,
        "ai_reason": "Mid-range price, morning departure, efficient EWR layover. Solid all-around.",
    },
    {
        "airline": "LATAM", "code": "LA", "flight_suffix": "505",
        "layovers": 1, "base_price_usd": 1240, "duration_hours": 14,
        "depart_time": "09:30", "arrive_time": "23:45+1",
        "ai_score_base": 79,
        "ai_reason": "Good value — 15% cheaper than the nonstop. Slightly longer journey but reasonable timing.",
    },
    {
        "airline": "Avianca", "code": "AV", "flight_suffix": "246",
        "layovers": 1, "base_price_usd": 1180, "duration_hours": 16,
        "depart_time": "22:15", "arrive_time": "14:30+1",
        "ai_score_base": 75,
        "ai_reason": "Cheapest option. Late-night departure and 16-hour journey — best for strict budget travellers.",
    },
    {
        "airline": "Turkish Airlines", "code": "TK", "flight_suffix": "033",
        "layovers": 1, "base_price_usd": 1095, "duration_hours": 18,
        "depart_time": "02:00", "arrive_time": "20:15+1",
        "ai_score_base": 70,
        "ai_reason": "Lowest price but overnight departure and 18-hour journey is exhausting. Last resort.",
    },
]


def _search_flights(input: dict[str, Any]) -> dict[str, Any]:
    """Return a scored, ranked list of flight options for a route.

    Mock: prices and scores are nudged by destination string length so
    different destinations produce different orderings, but the same
    destination is deterministic across calls.
    """
    origin = (input.get("origin") or "").strip()
    destination = (input.get("destination") or "").strip()
    max_price = input.get("max_price")
    passengers = int(input.get("passengers") or 1)

    if not origin or not destination:
        return {"error": "origin and destination are required"}

    nudge = (len(destination) * 7) % 90
    options = []
    for i, opt in enumerate(_AIRLINE_OPTIONS):
        per_pax = opt["base_price_usd"] + nudge
        if max_price and per_pax > max_price:
            continue
        score = max(0, opt["ai_score_base"] - (nudge // 20))
        options.append(
            {
                "airline": opt["airline"],
                "flight_number": f"{opt['code']} {int(opt['flight_suffix']) + (nudge % 50)}",
                "layovers": opt["layovers"],
                "duration_hours": opt["duration_hours"],
                "departure_time": opt["depart_time"],
                "arrival_time": opt["arrive_time"],
                "per_pax_usd": per_pax,
                "total_usd": per_pax * passengers,
                "ai_score": score,
                "ai_reason": opt["ai_reason"],
                "recommended": False,
            }
        )

    options.sort(key=lambda o: -o["ai_score"])
    if options:
        options[0]["recommended"] = True

    return {
        "origin": origin,
        "destination": destination,
        "passengers": passengers,
        "depart_date": input.get("depart_date"),
        "return_date": input.get("return_date"),
        "options": options[:5],
        "top_pick": options[0] if options else None,
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
