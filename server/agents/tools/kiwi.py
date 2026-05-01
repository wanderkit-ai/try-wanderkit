"""Kiwi / Tequila flight search (api.tequila.kiwi.com).

Good alternative to Skyscanner — specialises in cheap multi-leg routing.
Requires KIWI_API_KEY. Free key: https://tequila.kiwi.com/portal/login (sign up, then My API keys)
"""

from __future__ import annotations

from typing import Any

import httpx

from server.settings import get_settings

from ._shared import ToolDef
from ._travel_lookup import lookup_destination, lookup_origin

_BASE = "https://api.tequila.kiwi.com"


def _fmt_date(iso_date: str) -> str:
    """Convert YYYY-MM-DD → DD/MM/YYYY (Tequila format)."""
    parts = iso_date.split("-")
    if len(parts) == 3:
        return f"{parts[2]}/{parts[1]}/{parts[0]}"
    return iso_date


def _parse_flight(f: dict[str, Any]) -> dict[str, Any]:
    route = f.get("route") or []
    airlines = list({seg.get("airline", "") for seg in route if seg.get("airline")})
    return {
        "airline": airlines[0] if airlines else "Unknown",
        "airlines": airlines,
        "price_usd": f.get("price"),
        "duration_hours": round((f.get("duration") or {}).get("total", 0) / 3600, 1),
        "stops": max(0, len(route) - 1),
        "departure": f.get("local_departure"),
        "arrival": f.get("local_arrival"),
        "origin_code": f.get("flyFrom"),
        "destination_code": f.get("flyTo"),
        "booking_link": f.get("deep_link"),
        "source": "kiwi.com",
    }


def kiwi_search_flights(input: dict[str, Any]) -> dict[str, Any]:
    """Search Kiwi/Tequila for cheap flight options on a route."""
    try:
        settings = get_settings()
        if not settings.kiwi_api_key:
            return {"error": "KIWI_API_KEY is not configured — get a free key at tequila.kiwi.com"}

        origin_q = (input.get("origin") or "").strip()
        dest_q = (input.get("destination") or "").strip()
        depart_date = input.get("depart_date") or input.get("departure_date")
        return_date = input.get("return_date")
        adults = int(input.get("adults") or input.get("passengers") or 1)

        if not origin_q or not dest_q or not depart_date:
            return {"error": "origin, destination, and depart_date are required"}

        origin_code = lookup_origin(origin_q)
        dest_info = lookup_destination(dest_q)
        dest_code = dest_info.get("airport") or dest_info.get("city") or dest_q.upper()

        params: dict[str, Any] = {
            "fly_from": origin_code,
            "fly_to": dest_code,
            "date_from": _fmt_date(depart_date),
            "date_to": _fmt_date(depart_date),
            "adults": adults,
            "curr": "USD",
            "sort": "quality",
            "limit": int(input.get("max_results") or 5),
            "vehicle_type": "aircraft",
        }
        if return_date:
            params["return_from"] = _fmt_date(return_date)
            params["return_to"] = _fmt_date(return_date)

        with httpx.Client(timeout=20) as client:
            r = client.get(
                f"{_BASE}/v2/search",
                params=params,
                headers={"apikey": settings.kiwi_api_key},
            )

        if r.status_code >= 400:
            return {"error": "Kiwi/Tequila search failed", "status": r.status_code, "details": r.text[:300]}

        data = r.json()
        offers = [_parse_flight(f) for f in (data.get("data") or [])]

        return {
            "origin": origin_q,
            "destination": dest_info.get("label", dest_q),
            "depart_date": depart_date,
            "return_date": return_date,
            "adults": adults,
            "offers": offers,
            "count": len(offers),
            "source": "kiwi.com",
        }
    except Exception as exc:
        return {"error": str(exc) or "Kiwi flight search failed"}


TOOLS: dict[str, ToolDef] = {
    "kiwi_search_flights": ToolDef(
        name="kiwi_search_flights",
        description=(
            "Search Kiwi.com (Tequila API) for cheap flight options — "
            "specialises in multi-stop and alternative routing for budget travellers. "
            "Requires KIWI_API_KEY (free from tequila.kiwi.com)."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "origin": {"type": "string", "description": "Origin city or IATA code."},
                "destination": {"type": "string", "description": "Destination city or IATA code."},
                "depart_date": {"type": "string", "description": "YYYY-MM-DD departure date."},
                "return_date": {"type": "string", "description": "YYYY-MM-DD return date (omit for one-way)."},
                "adults": {"type": "integer", "minimum": 1, "default": 1},
                "max_results": {"type": "integer", "minimum": 1, "maximum": 10, "default": 5},
            },
            "required": ["origin", "destination", "depart_date"],
        },
        handler=kiwi_search_flights,
    )
}
