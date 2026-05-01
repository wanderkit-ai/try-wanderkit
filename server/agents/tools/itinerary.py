"""Itinerary tools — generate, persist, and enrich day-by-day trip plans."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from backend.agents.mock_data import TRIPS, find_by_id

from ._shared import ToolDef


# ── Hotel catalog (mock) ──────────────────────────────────────────────────────
# ai_score balances rating, amenity richness, and value. Nudged by destination
# length so rankings vary deterministically per route.

_HOTEL_CATALOG: list[dict[str, Any]] = [
    {
        "id": "ht_001",
        "name": "Riad Palais Sebban",
        "category": "Riad / Boutique",
        "stars": 4,
        "rating": 4.8,
        "base_price_usd": 145,
        "amenities": ["Rooftop pool", "Hammam", "Breakfast included", "Free WiFi", "Courtyard garden"],
        "ai_score_base": 95,
        "ai_reason": "Immersive character property, top-rated, breakfast included — exceptional value for this quality tier.",
        "style_tags": ["cultural", "culinary", "authentic"],
    },
    {
        "id": "ht_002",
        "name": "Four Seasons Resort",
        "category": "Luxury Resort",
        "stars": 5,
        "rating": 4.9,
        "base_price_usd": 420,
        "amenities": ["Multiple pools", "Spa", "5 restaurants", "24h concierge", "Airport transfer"],
        "ai_score_base": 90,
        "ai_reason": "Best-in-class service and facilities. Worth the premium if comfort is the priority.",
        "style_tags": ["luxury", "wellness"],
    },
    {
        "id": "ht_003",
        "name": "Boutique Garden Hotel",
        "category": "Boutique Hotel",
        "stars": 4,
        "rating": 4.6,
        "base_price_usd": 175,
        "amenities": ["Garden pool", "Restaurant", "Free WiFi", "Spa access", "Gym"],
        "ai_score_base": 86,
        "ai_reason": "Strong mid-range option with on-site pool and restaurant — easy evenings without leaving.",
        "style_tags": ["comfort", "modern"],
    },
    {
        "id": "ht_004",
        "name": "Dar Artisans Guesthouse",
        "category": "Guesthouse",
        "stars": 3,
        "rating": 4.7,
        "base_price_usd": 85,
        "amenities": ["Rooftop terrace", "Home-cooked breakfast", "Free WiFi", "Guided walks"],
        "ai_score_base": 84,
        "ai_reason": "Budget-friendly with outstanding reviews. Owner-run — best local knowledge and personal touch.",
        "style_tags": ["budget", "authentic", "cultural"],
    },
    {
        "id": "ht_005",
        "name": "The Grand Heritage Hotel",
        "category": "Heritage Hotel",
        "stars": 5,
        "rating": 4.5,
        "base_price_usd": 290,
        "amenities": ["Pool", "3 restaurants", "Hammam spa", "Business centre", "Valet"],
        "ai_score_base": 82,
        "ai_reason": "Grand historic property with modern comforts. Reasonable 5-star pricing.",
        "style_tags": ["luxury", "cultural", "historic"],
    },
]


def _search_hotels(input: dict[str, Any]) -> dict[str, Any]:
    """Return a scored, ranked list of hotel options for a destination.

    Mock: prices are nudged by destination string length so different
    destinations produce different rankings, but the same destination is
    deterministic across calls.
    """
    destination = (input.get("destination") or "").strip()
    nights = max(1, int(input.get("nights") or 7))
    guests = max(1, int(input.get("guests") or 1))
    check_in = input.get("check_in") or ""
    check_out = input.get("check_out") or ""
    max_per_night = input.get("max_price_per_night")

    nudge = (len(destination) * 11) % 40

    options = []
    for h in _HOTEL_CATALOG:
        price = h["base_price_usd"] + nudge
        if max_per_night and price > max_per_night:
            continue
        score = max(0, h["ai_score_base"] - (nudge // 15))
        options.append(
            {
                "id": h["id"],
                "name": h["name"],
                "category": h["category"],
                "stars": h["stars"],
                "rating": h["rating"],
                "price_per_night_usd": price,
                "total_usd": price * nights,
                "total_nights": nights,
                "check_in": check_in,
                "check_out": check_out,
                "amenities": h["amenities"],
                "ai_score": score,
                "ai_reason": h["ai_reason"],
                "style_tags": h["style_tags"],
                "recommended": False,
            }
        )

    options.sort(key=lambda h: -h["ai_score"])
    if options:
        options[0]["recommended"] = True

    return {
        "destination": destination,
        "nights": nights,
        "guests": guests,
        "options": options[:5],
        "top_pick": options[0] if options else None,
        "note": "[mock] Real search would use Booking.com API. Prices are illustrative.",
    }


_REQUIRED_DAY_FIELDS = ("day", "date", "location", "activities", "transit", "lodging")
_OPTIONAL_DAY_FIELDS = (
    "weather_note",
    "morning",
    "afternoon",
    "evening",
    "featured_activity",
)


def _validate_days(raw: Any) -> list[dict[str, Any]]:
    """Coerce and validate an ItineraryDay array submitted by the agent.

    Drops unknown keys and enforces the required shape. Raises ValueError on
    structural errors so the runner returns a tool error to the LLM instead of
    silently swallowing bad data.
    """
    if not isinstance(raw, list) or not raw:
        raise ValueError("itinerary must be a non-empty array of ItineraryDay")
    cleaned: list[dict[str, Any]] = []
    for idx, entry in enumerate(raw):
        if not isinstance(entry, dict):
            raise ValueError(f"itinerary[{idx}] must be an object")
        missing = [f for f in _REQUIRED_DAY_FIELDS if f not in entry]
        if missing:
            raise ValueError(f"itinerary[{idx}] missing required fields: {missing}")
        activities = entry["activities"]
        if not isinstance(activities, list) or not all(isinstance(a, str) for a in activities):
            raise ValueError(f"itinerary[{idx}].activities must be an array of strings")
        day_obj: dict[str, Any] = {f: entry[f] for f in _REQUIRED_DAY_FIELDS}
        for f in _OPTIONAL_DAY_FIELDS:
            if f in entry and entry[f] is not None:
                day_obj[f] = entry[f]
        cleaned.append(day_obj)
    return cleaned


_DAY_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "day": {"type": "number", "description": "1-indexed day number."},
        "date": {"type": "string", "description": "ISO date YYYY-MM-DD."},
        "location": {"type": "string", "description": "Where the day is anchored."},
        "activities": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Ordered activities for the day.",
        },
        "transit": {"type": "string", "description": "How travelers move between places."},
        "lodging": {"type": "string", "description": "Where they sleep that night."},
        "weather_note": {"type": "string", "description": "Optional weather caveat."},
        "morning": {"type": "string", "description": "Optional morning narrative."},
        "afternoon": {"type": "string", "description": "Optional afternoon narrative."},
        "evening": {"type": "string", "description": "Optional evening narrative."},
        "featured_activity": {
            "type": "string",
            "description": "Optional headline activity for the day.",
        },
    },
    "required": ["day", "date", "location", "activities", "transit", "lodging"],
}


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
    """Generate a day-by-day itinerary from direct input or a stored trip brief.

    Accepts trip parameters directly (destination, start_date, end_date, style,
    must_haves) so it works for new trips that have no stored record. When a
    trip_id is provided and found, its fields fill in any missing values.
    """
    trip_id = input.get("trip_id")
    trip = find_by_id(TRIPS, trip_id) if trip_id else None

    # Resolve dates — prefer explicit input, fall back to stored trip
    days = int(input.get("days") or 0)
    if days <= 0:
        start_str = input.get("start_date") or (trip or {}).get("startDate")
        end_str = input.get("end_date") or (trip or {}).get("endDate")
        if start_str and end_str:
            try:
                days = max(1, (date.fromisoformat(end_str) - date.fromisoformat(start_str)).days + 1)
            except ValueError:
                days = 7
        else:
            days = 7

    base_location = (
        input.get("destination")
        or (trip or {}).get("region")
        or (trip or {}).get("destination")
        or "Destination"
    )
    styles = input.get("style") or (trip or {}).get("style") or []
    must_haves = input.get("must_haves") or (trip or {}).get("mustHaves") or []
    activities = _activity_pool(styles)

    start_date_str = input.get("start_date") or (trip or {}).get("startDate")
    try:
        start_date = date.fromisoformat(start_date_str) if start_date_str else date.today()
    except ValueError:
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

    # Persist onto the trip record when one exists.
    if trip is not None:
        trip["itinerary"] = itinerary

    return {
        "tripId": trip_id,
        "destination": base_location,
        "totalDays": days,
        "itinerary": itinerary,
    }


def _preview_itinerary(input: dict[str, Any]) -> dict[str, Any]:
    """Return a structured itinerary for live UI preview without persisting it.

    Passes through flight/hotel/cost fields so the frontend can render a rich
    results panel with specific recommendations.
    """
    days = _validate_days(input.get("itinerary"))
    return {
        "tripId": input.get("trip_id"),
        "destination": input.get("destination"),
        "origin": input.get("origin"),
        "totalDays": input.get("totalDays") or len(days),
        "itinerary": days,
        # Recommendation fields — present only when agent ran search tools
        "outbound_flight": input.get("outbound_flight"),
        "return_flight": input.get("return_flight"),
        "hotel": input.get("hotel"),
        "cost_breakdown": input.get("cost_breakdown"),
        "ai_summary": input.get("ai_summary"),
        "preview": True,
    }


def _save_itinerary(input: dict[str, Any]) -> dict[str, Any]:
    """Persist the agent-authored itinerary onto the matching trip record."""
    trip_id = input.get("trip_id")
    days = _validate_days(input.get("itinerary"))
    trip = find_by_id(TRIPS, trip_id) if trip_id else None
    if trip is not None:
        trip["itinerary"] = days
    return {
        "tripId": trip_id,
        "destination": input.get("destination") or (trip or {}).get("destination"),
        "totalDays": input.get("totalDays") or len(days),
        "itinerary": days,
        "saved": trip is not None,
    }


_AUTHORED_INPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "trip_id": {
            "type": "string",
            "description": "Optional stored trip ID. When provided save_itinerary persists onto it.",
        },
        "destination": {"type": "string", "description": "Destination city or region."},
        "origin": {"type": "string", "description": "Origin / departure city."},
        "totalDays": {"type": "number", "description": "Total day count (defaults to itinerary length)."},
        "itinerary": {
            "type": "array",
            "items": _DAY_SCHEMA,
            "description": "The full ordered ItineraryDay array authored by the agent.",
        },
        "outbound_flight": {
            "type": "object",
            "description": (
                "Recommended outbound flight picked from search_flights results. "
                "Include: airline, flight_number, departure_time, arrival_time, "
                "duration_hours, per_pax_usd, layovers, ai_reason."
            ),
        },
        "return_flight": {
            "type": "object",
            "description": "Recommended return flight (same shape as outbound_flight).",
        },
        "hotel": {
            "type": "object",
            "description": (
                "Recommended hotel picked from search_hotels results. "
                "Include: name, stars, rating, price_per_night_usd, total_usd, "
                "amenities, ai_reason."
            ),
        },
        "cost_breakdown": {
            "type": "object",
            "description": "Estimated cost totals per category.",
            "properties": {
                "flights_usd": {"type": "number", "description": "Round-trip flight cost (total for all passengers)."},
                "hotel_usd": {"type": "number", "description": "Hotel total for all nights."},
                "activities_usd": {"type": "number", "description": "Estimated activities + experiences."},
                "meals_usd": {"type": "number", "description": "Estimated meals for the trip."},
                "total_usd": {"type": "number", "description": "Sum of all categories."},
            },
        },
        "ai_summary": {
            "type": "string",
            "description": (
                "2–3 sentence narrative summary of the trip plan. "
                "Name the recommended flight and hotel, give the headline reason for each, "
                "and note anything unusual (weather risk, permits, altitude, visas)."
            ),
        },
    },
    "required": ["itinerary"],
}


TOOLS: dict[str, ToolDef] = {
    "search_hotels": ToolDef(
        name="search_hotels",
        description=(
            "Search and rank hotel options for a destination. Returns scored options with "
            "pricing, amenities, and AI reasoning so you can pick and recommend the best fit."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "destination": {"type": "string", "description": "City or region name."},
                "check_in": {"type": "string", "description": "ISO date, e.g. 2026-10-15."},
                "check_out": {"type": "string", "description": "ISO date, e.g. 2026-10-22."},
                "nights": {"type": "number", "description": "Number of nights (derived from dates if omitted)."},
                "guests": {"type": "number", "description": "Number of guests."},
                "max_price_per_night": {"type": "number", "description": "USD ceiling per night per room."},
            },
            "required": ["destination"],
        },
        handler=_search_hotels,
    ),
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
                "trip_id": {
                    "type": "string",
                    "description": "Optional stored trip ID. When provided its fields fill any missing values.",
                },
                "destination": {"type": "string", "description": "Destination city or region."},
                "start_date": {"type": "string", "description": "ISO date, e.g. 2026-06-10."},
                "end_date": {"type": "string", "description": "ISO date, e.g. 2026-06-17."},
                "style": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Trip styles e.g. ['hiking', 'cultural'].",
                },
                "must_haves": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Activities that must appear in the plan.",
                },
                "days": {
                    "type": "number",
                    "description": "Override day count. If omitted, derived from start_date/end_date.",
                },
                "focus": {
                    "type": "string",
                    "description": "Optional emphasis e.g. 'food', 'photography', 'relaxed pace'.",
                },
            },
            "required": [],
        },
        handler=_build_itinerary,
    ),
    "preview_itinerary": ToolDef(
        name="preview_itinerary",
        description=(
            "Stream a draft itinerary into the live UI side panel without persisting it. "
            "Call this whenever you have a working day-by-day plan to show the user, and "
            "re-call after every refinement. The result is for display only; use "
            "save_itinerary once the admin approves."
        ),
        input_schema=_AUTHORED_INPUT_SCHEMA,
        handler=_preview_itinerary,
    ),
    "save_itinerary": ToolDef(
        name="save_itinerary",
        description=(
            "Persist the approved itinerary onto the matching trip record. "
            "Only call this after the admin explicitly approves a draft."
        ),
        input_schema={
            **_AUTHORED_INPUT_SCHEMA,
            "required": ["itinerary"],
        },
        handler=_save_itinerary,
    ),
}
