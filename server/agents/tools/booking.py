"""Booking.com hotel search via RapidAPI (booking-com.p.rapidapi.com).

Requires RAPIDAPI_KEY in environment. Free tier: 100 req/month (shared with Skyscanner key).
Sign up at: https://rapidapi.com/DataCrawler/api/booking-com
"""

from __future__ import annotations

from typing import Any

import httpx

from server.settings import get_settings

from ._shared import ToolDef

_BOOKING_HOST = "booking-com.p.rapidapi.com"
_BASE = f"https://{_BOOKING_HOST}"


def _headers() -> dict[str, str]:
    settings = get_settings()
    if not settings.rapidapi_key:
        raise RuntimeError("RAPIDAPI_KEY is not configured — sign up at rapidapi.com")
    return {
        "X-RapidAPI-Key": settings.rapidapi_key,
        "X-RapidAPI-Host": _BOOKING_HOST,
    }


def _parse_hotel(h: dict[str, Any], check_in: str, check_out: str) -> dict[str, Any]:
    prop = h.get("property") or {}
    breakdown = h.get("priceBreakdown") or {}
    gross = breakdown.get("grossPrice") or {}
    return {
        "hotel_id": prop.get("id"),
        "name": prop.get("name"),
        "stars": prop.get("propertyClass"),
        "review_score": prop.get("reviewScore"),
        "review_count": prop.get("reviewCount"),
        "review_word": prop.get("reviewScoreWord"),
        "price_per_night_usd": gross.get("value"),
        "currency": gross.get("currency", "USD"),
        "check_in": check_in,
        "check_out": check_out,
        "latitude": prop.get("latitude"),
        "longitude": prop.get("longitude"),
        "country_code": prop.get("countryCode"),
        "source": "booking.com",
    }


def booking_search_hotels(input: dict[str, Any]) -> dict[str, Any]:
    """Search Booking.com hotels for a destination and stay period."""
    try:
        settings = get_settings()
        if not settings.rapidapi_key:
            return {"error": "RAPIDAPI_KEY is not configured — sign up at rapidapi.com"}

        destination = (input.get("destination") or "").strip()
        check_in = input.get("check_in") or input.get("checkin_date")
        check_out = input.get("check_out") or input.get("checkout_date")
        adults = int(input.get("adults") or input.get("guests") or 2)
        rooms = int(input.get("rooms") or 1)
        max_results = int(input.get("max_results") or 10)

        if not destination:
            return {"error": "destination is required"}
        if not check_in or not check_out:
            return {"error": "check_in and check_out are required"}

        hdrs = _headers()

        with httpx.Client(timeout=20) as client:
            # Step 1: resolve destination → dest_id
            dest_r = client.get(
                f"{_BASE}/api/v1/hotels/searchDestination",
                params={"query": destination},
                headers=hdrs,
            )
            if dest_r.status_code >= 400:
                return {"error": "Booking.com destination lookup failed", "status": dest_r.status_code, "details": dest_r.text[:200]}

            dest_data = dest_r.json().get("data") or []
            if not dest_data:
                return {"error": f"No Booking.com destination found for: '{destination}'"}

            best = dest_data[0]
            dest_id = best.get("dest_id") or best.get("id") or ""
            search_type = best.get("search_type") or "CITY"

            # Step 2: search hotels
            hotel_r = client.get(
                f"{_BASE}/api/v1/hotels/searchHotels",
                params={
                    "dest_id": dest_id,
                    "search_type": search_type,
                    "arrival_date": check_in,
                    "departure_date": check_out,
                    "adults": adults,
                    "room_qty": rooms,
                    "page_number": "1",
                    "languagecode": "en-us",
                    "currency_code": "USD",
                    "units": "metric",
                },
                headers=hdrs,
            )

        if hotel_r.status_code >= 400:
            return {"error": "Booking.com hotel search failed", "status": hotel_r.status_code, "details": hotel_r.text[:200]}

        raw = (hotel_r.json().get("data") or {}).get("hotels") or []
        hotels = [_parse_hotel(h, check_in, check_out) for h in raw[:max_results]]

        # Sort by review score descending
        hotels.sort(key=lambda h: h.get("review_score") or 0, reverse=True)

        return {
            "destination": destination,
            "check_in": check_in,
            "check_out": check_out,
            "adults": adults,
            "hotels": hotels,
            "count": len(hotels),
            "source": "booking.com",
        }
    except Exception as exc:
        return {"error": str(exc) or "Booking.com hotel search failed"}


TOOLS: dict[str, ToolDef] = {
    "booking_search_hotels": ToolDef(
        name="booking_search_hotels",
        description=(
            "Search real Booking.com hotel availability and prices for a destination and stay period. "
            "Returns hotels ranked by guest rating with per-night pricing. "
            "Requires RAPIDAPI_KEY (rapidapi.com → booking-com API)."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "destination": {"type": "string", "description": "City or region name, e.g. 'Marrakech' or 'Bali'."},
                "check_in": {"type": "string", "description": "Check-in date YYYY-MM-DD."},
                "check_out": {"type": "string", "description": "Check-out date YYYY-MM-DD."},
                "adults": {"type": "integer", "minimum": 1, "default": 2},
                "rooms": {"type": "integer", "minimum": 1, "default": 1},
                "max_results": {"type": "integer", "minimum": 1, "maximum": 20, "default": 10},
            },
            "required": ["destination", "check_in", "check_out"],
        },
        handler=booking_search_hotels,
    )
}
