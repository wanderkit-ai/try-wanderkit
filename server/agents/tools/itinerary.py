"""Itinerary tools — generate and persist day-by-day trip plans."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from backend.agents.mock_data import TRIPS, find_by_id

from ._shared import ToolDef


# Style → activity bank. Used to compose realistic-looking itineraries from a
# trip brief without an LLM call inside the tool. Agents can then refine the
# plan in their text response.
_ACTIVITY_BANK: dict[str, list[str]] = {
    "hiking": ["Acclimatisation hike", "Ridge traverse", "Summit attempt", "Photography walk"],
    "cultural": ["Old town walking tour", "Museum visit", "Local family dinner", "Artisan workshop"],
    "culinary": ["Cooking class", "Market tour with chef", "Wine/spirit tasting", "Street food crawl"],
    "expedition": ["High-camp move", "Glacier traverse", "Technical climb", "Rest + recovery day"],
    "safari": ["Sunrise game drive", "Bush walk with ranger", "Cultural visit (village)", "Sundowners on plains"],
    "beach": ["Surf coaching", "Beach yoga", "Snorkel reef trip", "Sunset paddle"],
    "wellness": ["Sound bath", "Morning meditation", "Spa half-day", "Nature reset hike"],
}


def _activity_pool(styles: list[str]) -> list[str]:
    """Flatten activities for all styles in the brief, preserving variety."""
    out: list[str] = []
    for style in styles:
        out.extend(_ACTIVITY_BANK.get(style, []))
    if not out:
        out = ["Free day", "Local exploration"]
    return out


def _build_itinerary(input: dict[str, Any]) -> dict[str, Any]:
    """Generate a day-by-day itinerary for a trip and persist it on the trip.

    Picks activities from a style-keyed bank, alternates with transit/buffer
    days, and writes the result into TRIPS in-memory so the trip detail page
    can render it on next load.
    """
    trip_id = input.get("trip_id")
    trip = find_by_id(TRIPS, trip_id)
    if not trip:
        return {"error": f"Trip {trip_id} not found"}

    days = int(input.get("days") or 0)
    if days <= 0:
        try:
            start = date.fromisoformat(trip["startDate"])
            end = date.fromisoformat(trip["endDate"])
            days = max(1, (end - start).days + 1)
        except (KeyError, ValueError):
            days = 7

    base_location = trip.get("region") or trip.get("destination") or "Destination"
    activities = _activity_pool(trip.get("style", []))
    must_haves = trip.get("mustHaves", [])

    try:
        start_date = date.fromisoformat(trip["startDate"])
    except (KeyError, ValueError):
        start_date = date.today()

    itinerary: list[dict[str, Any]] = []
    for i in range(days):
        day_date = (start_date + timedelta(days=i)).isoformat()
        is_buffer = i > 0 and i % 6 == 5

        if i == 0:
            day_plan = {
                "day": i + 1,
                "date": day_date,
                "location": base_location,
                "activities": ["Arrival + transfer to lodging", "Welcome dinner"],
                "transit": "Airport → lodging",
                "lodging": "Boutique hotel",
            }
        elif i == days - 1:
            day_plan = {
                "day": i + 1,
                "date": day_date,
                "location": base_location,
                "activities": ["Final breakfast", "Transfer to airport"],
                "transit": "Lodging → airport",
                "lodging": "Departure",
            }
        elif is_buffer:
            day_plan = {
                "day": i + 1,
                "date": day_date,
                "location": base_location,
                "activities": ["Buffer / rest day", "Optional spa or cafe time"],
                "transit": "None",
                "lodging": "Same as previous night",
            }
        else:
            picks = [activities[(i + j) % len(activities)] for j in range(2)]
            if must_haves and i == 1:
                picks[0] = must_haves[0]
            day_plan = {
                "day": i + 1,
                "date": day_date,
                "location": base_location,
                "activities": picks,
                "transit": "Within region",
                "lodging": "Continuing stay",
            }
        itinerary.append(day_plan)

    # Mutate the trip record so the trip detail page renders the result.
    trip["itinerary"] = itinerary

    return {
        "tripId": trip_id,
        "totalDays": days,
        "itinerary": itinerary,
        "note": "[mock] Itinerary saved on the trip. Agents can refine in chat.",
    }


TOOLS: dict[str, ToolDef] = {
    "build_itinerary": ToolDef(
        name="build_itinerary",
        description=(
            "Generate and save a day-by-day itinerary for a trip. "
            "Uses the trip's style and must-haves to compose activities. "
            "Returns the structured itinerary; also persists it on the trip."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "trip_id": {"type": "string"},
                "days": {
                    "type": "number",
                    "description": "Override day count. If omitted, uses startDate→endDate.",
                },
                "focus": {
                    "type": "string",
                    "description": "Optional emphasis e.g. 'food', 'photography', 'relaxed pace'.",
                },
            },
            "required": ["trip_id"],
        },
        handler=_build_itinerary,
    ),
}
