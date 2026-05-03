"""Google Flights search via SerpAPI.

Requires SERPAPI_KEY. Free tier: 100 searches/month.
Get a key at: https://serpapi.com
"""

from __future__ import annotations

from typing import Any

import httpx

from server.settings import get_settings

from ._shared import ToolDef
from ._travel_lookup import lookup_destination, lookup_origin

SERPAPI_BASE_URL = "https://serpapi.com/search"


def _parse_flight(flight: dict[str, Any], currency: str) -> dict[str, Any]:
    legs = flight.get("flights") or []
    first_leg = legs[0] if legs else {}
    last_leg = legs[-1] if legs else {}
    airlines = list({leg.get("airline") for leg in legs if leg.get("airline")})
    total_duration = flight.get("total_duration")
    return {
        "price": {"total": flight.get("price"), "currency": currency},
        "airlines": airlines,
        "duration_minutes": total_duration,
        "duration_hours": round(total_duration / 60, 1) if total_duration else None,
        "stops": max(0, len(legs) - 1),
        "departure": {
            "iataCode": first_leg.get("departure_airport", {}).get("id"),
            "at": first_leg.get("departure_airport", {}).get("time"),
        },
        "arrival": {
            "iataCode": last_leg.get("arrival_airport", {}).get("id"),
            "at": last_leg.get("arrival_airport", {}).get("time"),
        },
        "carbon_emissions_kg": (flight.get("carbon_emissions") or {}).get("this_flight"),
        "booking_token": flight.get("booking_token"),
        "source": "google_flights",
    }


def google_search_flights(input: dict[str, Any]) -> dict[str, Any]:
    """Search flights via SerpAPI Google Flights, with automatic mock fallback."""
    try:
        settings = get_settings()
        if not settings.serpapi_key:
            return {"search_unavailable": True, "reason": "SERPAPI_KEY not configured"}

        destination_info = lookup_destination(input.get("destination") or input.get("destinationLocationCode"))
        origin = lookup_origin(input.get("origin") or input.get("originLocationCode"))
        destination = (
            input.get("destination_airport")
            or destination_info.get("airport")
            or destination_info.get("city")
            or (input.get("destination") or "").strip()
        ).upper()

        departure_date = input.get("departure_date") or input.get("depart_date")
        if not departure_date:
            return {"search_unavailable": True, "reason": "departure_date missing"}

        currency = input.get("currency") or "USD"
        return_date = input.get("return_date")

        params: dict[str, Any] = {
            "engine": "google_flights",
            "departure_id": origin,
            "arrival_id": destination,
            "outbound_date": departure_date,
            "currency": currency,
            "hl": "en",
            "adults": int(input.get("adults") or input.get("passengers") or 1),
            "type": "1" if return_date else "2",  # 1 = round trip, 2 = one way
            "api_key": settings.serpapi_key,
        }
        if return_date:
            params["return_date"] = return_date
        if input.get("max_price"):
            params["max_price"] = int(input["max_price"])

        with httpx.Client(timeout=15) as client:
            response = client.get(SERPAPI_BASE_URL, params=params)

        if response.status_code >= 400:
            return {"search_unavailable": True, "reason": f"SerpAPI returned {response.status_code}"}

        payload = response.json()
        if "error" in payload:
            return {"search_unavailable": True, "reason": payload["error"]}

        max_results = int(input.get("max_results") or input.get("max") or 5)
        raw = (payload.get("best_flights") or []) + (payload.get("other_flights") or [])
        if not raw:
            return {"search_unavailable": True, "reason": "No flights returned by SerpAPI"}

        offers = [_parse_flight(f, currency) for f in raw[:max_results]]
        return {
            "origin": origin,
            "destination": destination,
            "departure_date": departure_date,
            "return_date": return_date,
            "offers": offers,
            "count": len(offers),
            "source": "google_flights",
        }
    except (httpx.TimeoutException, httpx.ReadTimeout, httpx.ConnectTimeout):
        return {"search_unavailable": True, "reason": "SerpAPI timed out"}
    except Exception as exc:
        return {"search_unavailable": True, "reason": str(exc) or "Flight search failed"}


TOOLS: dict[str, ToolDef] = {
    "google_search_flights": ToolDef(
        name="google_search_flights",
        description="Search live Google Flights data for a route and date via SerpAPI. Requires SERPAPI_KEY.",
        input_schema={
            "type": "object",
            "properties": {
                "origin": {"type": "string", "description": "Origin city or IATA code."},
                "destination": {"type": "string", "description": "Destination name or IATA code."},
                "departure_date": {"type": "string", "description": "YYYY-MM-DD departure date."},
                "return_date": {"type": "string", "description": "YYYY-MM-DD return date (omit for one-way)."},
                "adults": {"type": "integer", "minimum": 1},
                "currency": {"type": "string", "default": "USD"},
                "max_results": {"type": "integer", "minimum": 1, "maximum": 20},
                "max_price": {"type": "integer", "description": "Maximum price per person in chosen currency."},
            },
            "required": ["origin", "destination", "departure_date"],
        },
        handler=google_search_flights,
    )
}
