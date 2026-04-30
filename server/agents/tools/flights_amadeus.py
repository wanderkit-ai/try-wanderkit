from __future__ import annotations

import time
from typing import Any

import httpx

from server.settings import get_settings

from ._shared import ToolDef
from ._travel_lookup import lookup_destination, lookup_origin


# Kept for hotels_amadeus.py which still uses the Amadeus hotel API.
AMADEUS_BASE_URL = "https://test.api.amadeus.com"
_TOKEN_CACHE: dict[str, Any] = {}


def _amadeus_token() -> str:
    settings = get_settings()
    if not settings.amadeus_client_id or not settings.amadeus_client_secret:
        raise RuntimeError("AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET are required")

    now = time.time()
    if _TOKEN_CACHE.get("access_token") and _TOKEN_CACHE.get("expires_at", 0) > now:
        return str(_TOKEN_CACHE["access_token"])

    with httpx.Client(timeout=20) as client:
        response = client.post(
            f"{AMADEUS_BASE_URL}/v1/security/oauth2/token",
            data={
                "grant_type": "client_credentials",
                "client_id": settings.amadeus_client_id,
                "client_secret": settings.amadeus_client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    response.raise_for_status()
    data = response.json()
    token = data["access_token"]
    _TOKEN_CACHE.update(
        {
            "access_token": token,
            "expires_at": now + int(data.get("expires_in", 1700)) - 60,
        }
    )
    return str(token)


SERPAPI_BASE_URL = "https://serpapi.com/search"


def _parse_serpapi_flight(flight: dict[str, Any], currency: str) -> dict[str, Any]:
    legs = flight.get("flights") or []
    first_leg = legs[0] if legs else {}
    last_leg = legs[-1] if legs else {}
    airlines = list({leg.get("airline") for leg in legs if leg.get("airline")})
    total_duration = flight.get("total_duration")
    stops = max(0, len(legs) - 1)
    return {
        "price": {"total": flight.get("price"), "currency": currency},
        "airlines": airlines,
        "duration": f"PT{total_duration}M" if total_duration else None,
        "stops": stops,
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


def amadeus_search_flights(input: dict[str, Any]) -> dict[str, Any]:
    """Search flights via SerpAPI Google Flights."""
    try:
        settings = get_settings()
        if not settings.serpapi_key:
            return {"error": "SERPAPI_KEY is not configured — get a free key at serpapi.com"}

        destination_info = lookup_destination(input.get("destination") or input.get("destinationLocationCode"))
        origin = lookup_origin(input.get("origin") or input.get("originLocationCode"))
        destination = (input.get("destination_airport") or destination_info["airport"]).upper()

        departure_date = input.get("departure_date") or input.get("depart_date")
        if not departure_date:
            return {"error": "departure_date is required"}

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

        with httpx.Client(timeout=30) as client:
            response = client.get(SERPAPI_BASE_URL, params=params)
        if response.status_code >= 400:
            return {"error": "SerpAPI flight search failed", "status": response.status_code, "details": response.text}

        payload = response.json()
        if "error" in payload:
            return {"error": payload["error"]}

        max_results = int(input.get("max_results") or input.get("max") or 5)
        raw = (payload.get("best_flights") or []) + (payload.get("other_flights") or [])
        offers = [_parse_serpapi_flight(f, currency) for f in raw[:max_results]]
        return {
            "origin": origin,
            "destination": destination,
            "departure_date": departure_date,
            "return_date": return_date,
            "offers": offers,
            "count": len(offers),
            "source": "google_flights",
        }
    except Exception as exc:
        return {"error": str(exc) or "Flight search failed"}


TOOLS: dict[str, ToolDef] = {
    "amadeus_search_flights": ToolDef(
        name="amadeus_search_flights",
        description="Search live Google Flights data for a route and date via SerpAPI.",
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
        handler=amadeus_search_flights,
    )
}

