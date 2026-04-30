from __future__ import annotations

import json
from typing import Any

import httpx

from server.agents.tools._shared import ToolDef
from server.settings import get_settings


def tripadvisor_activities(params: dict[str, Any]) -> dict[str, Any]:
    """Fetch activity recommendations for a destination.

    Uses the Tripadvisor Content API when TRIPADVISOR_API_KEY is set,
    otherwise falls back to Firecrawl scraping the Tripadvisor search page.
    """
    settings = get_settings()
    destination: str = params.get("destination", "")
    limit: int = int(params.get("limit", 10))

    if not destination:
        return {"error": "destination is required", "activities": []}

    if settings.tripadvisor_api_key:
        return _fetch_tripadvisor_api(destination, limit, settings.tripadvisor_api_key)

    if settings.firecrawl_api_key:
        return _fetch_firecrawl_fallback(destination, limit, settings.firecrawl_api_key)

    return {
        "error": "Neither TRIPADVISOR_API_KEY nor FIRECRAWL_API_KEY is configured",
        "activities": [],
    }


def _fetch_tripadvisor_api(destination: str, limit: int, api_key: str) -> dict[str, Any]:
    url = "https://api.content.tripadvisor.com/api/v1/location/search"
    try:
        resp = httpx.get(
            url,
            params={
                "searchQuery": destination,
                "key": api_key,
                "language": "en",
                "category": "attractions",
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        raw = data.get("data") or []
        activities = [
            {
                "name": item.get("name"),
                "location_id": item.get("location_id"),
                "category": (item.get("category") or {}).get("name"),
                "address": (item.get("address_obj") or {}).get("address_string"),
                "rating": item.get("rating"),
                "url": f"https://www.tripadvisor.com{item.get('web_url', '')}",
            }
            for item in raw[:limit]
        ]
        return {"activities": activities, "source": "tripadvisor_api"}
    except httpx.HTTPStatusError as exc:
        return {"error": f"Tripadvisor API {exc.response.status_code}", "activities": []}
    except Exception as exc:
        return {"error": str(exc), "activities": []}


def _fetch_firecrawl_fallback(destination: str, limit: int, api_key: str) -> dict[str, Any]:
    url = "https://api.firecrawl.dev/v1/scrape"
    target = f"https://www.tripadvisor.com/Search?q={destination}+attractions"
    try:
        resp = httpx.post(
            url,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"url": target, "formats": ["markdown"]},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        markdown = (data.get("data") or {}).get("markdown") or ""
        return {
            "activities": [{"name": "See scraped content", "description": markdown[:3000]}],
            "source": "firecrawl_fallback",
            "raw_markdown": markdown[:3000],
        }
    except Exception as exc:
        return {"error": str(exc), "activities": []}


TOOLS: dict[str, ToolDef] = {
    "tripadvisor_activities": ToolDef(
        name="tripadvisor_activities",
        description=(
            "Fetch top activity and attraction recommendations for a travel destination. "
            "Uses Tripadvisor API with Firecrawl fallback."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "destination": {
                    "type": "string",
                    "description": "City or region name, e.g. 'Tokyo' or 'Bali, Indonesia'",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of activities to return (default 10)",
                    "default": 10,
                },
            },
            "required": ["destination"],
        },
        handler=tripadvisor_activities,
    ),
}
