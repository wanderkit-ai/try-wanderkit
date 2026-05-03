"""Google Hotels search via SerpAPI.

Requires SERPAPI_KEY. Free tier: 100 searches/month.
Get a key at: https://serpapi.com
"""

from __future__ import annotations

from typing import Any

import httpx

from server.settings import get_settings

from ._shared import ToolDef

SERPAPI_BASE_URL = "https://serpapi.com/search"


def _parse_hotel(h: dict[str, Any]) -> dict[str, Any]:
    rate = h.get("rate_per_night") or {}
    total = h.get("total_rate") or {}
    return {
        "name": h.get("name"),
        "hotel_class": h.get("hotel_class"),
        "stars": h.get("overall_rating"),
        "review_count": h.get("reviews"),
        "description": (h.get("description") or "")[:300],
        "price_per_night": rate.get("lowest") or rate.get("extracted_lowest"),
        "total_price": total.get("lowest") or total.get("extracted_lowest"),
        "currency": "USD",
        "check_in_time": h.get("check_in_time"),
        "check_out_time": h.get("check_out_time"),
        "amenities": (h.get("amenities") or [])[:8],
        "thumbnail": h.get("thumbnail"),
        "link": h.get("link"),
        "source": "google_hotels",
    }


def google_search_hotels(input: dict[str, Any]) -> dict[str, Any]:
    """Search Google Hotels via SerpAPI, with automatic mock fallback."""
    try:
        settings = get_settings()
        if not settings.serpapi_key:
            return {"search_unavailable": True, "reason": "SERPAPI_KEY not configured"}

        destination = (input.get("destination") or "").strip()
        check_in = input.get("check_in") or input.get("checkin_date")
        check_out = input.get("check_out") or input.get("checkout_date")
        adults = min(int(input.get("adults") or input.get("guests") or 2), 6)
        max_results = int(input.get("max_results") or 10)

        if not destination:
            return {"search_unavailable": True, "reason": "destination missing"}
        if not check_in or not check_out:
            return {"search_unavailable": True, "reason": "check_in/check_out missing"}

        params: dict[str, Any] = {
            "engine": "google_hotels",
            "q": f"{destination} Hotels",
            "check_in_date": check_in,
            "check_out_date": check_out,
            "adults": adults,
            "currency": "USD",
            "hl": "en",
            "api_key": settings.serpapi_key,
        }

        with httpx.Client(timeout=15) as client:
            r = client.get(SERPAPI_BASE_URL, params=params)

        if r.status_code >= 400:
            return {"search_unavailable": True, "reason": f"SerpAPI returned {r.status_code}"}

        payload = r.json()
        if "error" in payload:
            return {"search_unavailable": True, "reason": payload["error"]}

        raw = payload.get("properties") or []
        if not raw:
            return {"search_unavailable": True, "reason": "No hotels returned by SerpAPI"}

        hotels = [_parse_hotel(h) for h in raw[:max_results]]
        return {
            "destination": destination,
            "check_in": check_in,
            "check_out": check_out,
            "adults": adults,
            "hotels": hotels,
            "count": len(hotels),
            "source": "google_hotels",
        }
    except (httpx.TimeoutException, httpx.ReadTimeout, httpx.ConnectTimeout):
        return {"search_unavailable": True, "reason": "SerpAPI timed out"}
    except Exception as exc:
        return {"search_unavailable": True, "reason": str(exc) or "Hotel search failed"}


TOOLS: dict[str, ToolDef] = {
    "google_search_hotels": ToolDef(
        name="google_search_hotels",
        description=(
            "Search Google Hotels for real hotel availability and prices for a destination and stay period. "
            "Returns hotels with ratings, prices, amenities, and booking links. "
            "Requires SERPAPI_KEY (serpapi.com)."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "destination": {"type": "string", "description": "City or region name, e.g. 'Marrakech' or 'Bali'."},
                "check_in": {"type": "string", "description": "Check-in date YYYY-MM-DD."},
                "check_out": {"type": "string", "description": "Check-out date YYYY-MM-DD."},
                "adults": {"type": "integer", "minimum": 1, "default": 2},
                "max_results": {"type": "integer", "minimum": 1, "maximum": 20, "default": 10},
            },
            "required": ["destination", "check_in", "check_out"],
        },
        handler=google_search_hotels,
    )
}
