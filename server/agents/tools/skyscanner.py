"""Skyscanner flight search via RapidAPI (sky-scrapper.p.rapidapi.com).

Requires RAPIDAPI_KEY in environment. Free tier: 100 req/month.
Sign up at: https://rapidapi.com/apiheya/api/sky-scrapper
"""

from __future__ import annotations

from typing import Any

import httpx

from server.settings import get_settings

from ._shared import ToolDef

_SKYSCANNER_HOST = "sky-scrapper.p.rapidapi.com"
_BASE = f"https://{_SKYSCANNER_HOST}"


def _headers() -> dict[str, str]:
    settings = get_settings()
    if not settings.rapidapi_key:
        raise RuntimeError("RAPIDAPI_KEY is not configured — sign up at rapidapi.com")
    return {
        "X-RapidAPI-Key": settings.rapidapi_key,
        "X-RapidAPI-Host": _SKYSCANNER_HOST,
    }


def _resolve_sky_id(query: str, client: httpx.Client) -> tuple[str, str]:
    """Return (skyId, entityId) for a city/airport query, preferring airport entities."""
    r = client.get(
        f"{_BASE}/api/v1/flights/searchAirport",
        params={"query": query, "locale": "en-US"},
        headers=_headers(),
        timeout=15,
    )
    r.raise_for_status()
    results = r.json().get("data") or []
    if not results:
        raise ValueError(f"Skyscanner: no airport found for '{query}'")
    # Prefer AIRPORT entity type over CITY so skyId is a valid IATA code
    for item in results:
        nav = item.get("navigation") or {}
        fp = nav.get("relevantFlightParams") or {}
        if nav.get("entityType") == "AIRPORT":
            return str(fp.get("skyId", "")), str(fp.get("entityId", ""))
    # Fall back to first result (city)
    nav = results[0].get("navigation") or {}
    fp = nav.get("relevantFlightParams") or {}
    return str(fp.get("skyId", "")), str(fp.get("entityId", ""))


def _parse_itinerary(item: dict[str, Any]) -> dict[str, Any]:
    legs = item.get("legs") or []
    # price lives at item["price"]["raw"] in v1, pricingOptions in v2
    price_obj = item.get("price") or {}
    price_usd = price_obj.get("raw") or price_obj.get("amount")
    if price_usd is None:
        pricing_options = item.get("pricingOptions") or [{}]
        price_usd = (pricing_options[0].get("price") or {}).get("amount")
    first_leg = legs[0] if legs else {}
    segments = first_leg.get("segments") or []
    carriers = list({s.get("operatingCarrier", {}).get("name", "") for s in segments if s.get("operatingCarrier", {}).get("name")})
    return {
        "airline": carriers[0] if carriers else "Unknown",
        "airlines": carriers,
        "price_usd": price_usd,
        "price_formatted": price_obj.get("formatted"),
        "duration_minutes": first_leg.get("durationInMinutes"),
        "duration_hours": round((first_leg.get("durationInMinutes") or 0) / 60, 1),
        "stops": first_leg.get("stopCount", 0),
        "departure": first_leg.get("departure"),
        "arrival": first_leg.get("arrival"),
        "origin_code": (first_leg.get("origin") or {}).get("displayCode"),
        "destination_code": (first_leg.get("destination") or {}).get("displayCode"),
        "source": "skyscanner",
    }


def skyscanner_search_flights(input: dict[str, Any]) -> dict[str, Any]:
    """Search live Skyscanner flights for a route and date."""
    try:
        settings = get_settings()
        if not settings.rapidapi_key:
            return {"search_unavailable": True, "reason": "RAPIDAPI_KEY not configured"}

        origin_q = (input.get("origin") or "").strip()
        dest_q = (input.get("destination") or "").strip()
        depart_date = input.get("depart_date") or input.get("departure_date")
        return_date = input.get("return_date")
        adults = int(input.get("adults") or input.get("passengers") or 1)

        if not origin_q or not dest_q or not depart_date:
            return {"search_unavailable": True, "reason": "origin, destination, and depart_date are required"}

        with httpx.Client(timeout=15) as client:
            try:
                origin_sky, origin_entity = _resolve_sky_id(origin_q, client)
                dest_sky, dest_entity = _resolve_sky_id(dest_q, client)
            except ValueError as e:
                return {"search_unavailable": True, "reason": str(e)}

            params: dict[str, Any] = {
                "originSkyId": origin_sky,
                "destinationSkyId": dest_sky,
                "originEntityId": origin_entity,
                "destinationEntityId": dest_entity,
                "date": depart_date,
                "adults": adults,
                "currency": "USD",
                "locale": "en-US",
                "market": "en-US",
                "countryCode": "US",
                "cabinClass": input.get("cabin_class", "economy"),
            }
            if return_date:
                params["returnDate"] = return_date

            r = client.get(
                f"{_BASE}/api/v1/flights/searchFlights",
                params=params,
                headers=_headers(),
                timeout=15,
            )

        if r.status_code >= 400:
            return {"search_unavailable": True, "reason": f"Skyscanner returned {r.status_code}"}

        payload = r.json()
        if not payload.get("status") or "error" in payload:
            msg = payload.get("message") or payload.get("error") or "No results"
            return {"search_unavailable": True, "reason": msg}

        itineraries = (payload.get("data") or {}).get("itineraries") or []
        offers = [_parse_itinerary(i) for i in itineraries[: int(input.get("max_results") or 5)]]

        return {
            "origin": origin_q,
            "destination": dest_q,
            "depart_date": depart_date,
            "return_date": return_date,
            "adults": adults,
            "offers": offers,
            "count": len(offers),
            "source": "skyscanner",
        }
    except (httpx.TimeoutException, httpx.ReadTimeout, httpx.ConnectTimeout):
        return {"search_unavailable": True, "reason": "Skyscanner timed out"}
    except Exception as exc:
        return {"search_unavailable": True, "reason": str(exc) or "Skyscanner search failed"}


TOOLS: dict[str, ToolDef] = {
    "skyscanner_search_flights": ToolDef(
        name="skyscanner_search_flights",
        description=(
            "Search live Skyscanner flight data for a route and date. "
            "Returns ranked offers with prices, duration, and stops. "
            "Requires RAPIDAPI_KEY (rapidapi.com → sky-scrapper API)."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "origin": {"type": "string", "description": "Departure city, airport name, or IATA code."},
                "destination": {"type": "string", "description": "Destination city, airport name, or IATA code."},
                "depart_date": {"type": "string", "description": "YYYY-MM-DD departure date."},
                "return_date": {"type": "string", "description": "YYYY-MM-DD return date (omit for one-way)."},
                "adults": {"type": "integer", "minimum": 1, "default": 1},
                "cabin_class": {"type": "string", "enum": ["economy", "premium_economy", "business", "first"], "default": "economy"},
                "max_results": {"type": "integer", "minimum": 1, "maximum": 10, "default": 5},
            },
            "required": ["origin", "destination", "depart_date"],
        },
        handler=skyscanner_search_flights,
    )
}
