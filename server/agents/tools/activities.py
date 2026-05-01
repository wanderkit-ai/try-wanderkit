from __future__ import annotations

import re
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
        result = _fetch_tripadvisor_api(destination, limit, settings.tripadvisor_api_key)
        if not result.get("error"):
            return result

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


def _parse_activities_from_markdown(markdown: str, limit: int) -> list[dict[str, Any]]:
    """Extract structured activities from TripAdvisor search result markdown."""
    activities: list[dict[str, Any]] = []
    # Match markdown links that point to TripAdvisor attraction/review pages
    pattern = re.compile(
        r'\[([^\]]+)\]\((https://www\.tripadvisor\.com/Attraction_Review[^\)]+)\)'
    )
    # Rating pattern: "4.9" appearing near "of 5 bubbles"
    rating_pattern = re.compile(r'(\d+\.\d+)\s*\n*\s*\d+\.\d+ of 5 bubbles')
    # Reviews pattern: "(545 reviews)"
    reviews_pattern = re.compile(r'\((\d[\d,]*) reviews?\)')

    seen: set[str] = set()
    # Walk through matches and grab ratings/reviews from surrounding context
    for m in pattern.finditer(markdown):
        name = m.group(1).strip()
        url = m.group(2).strip()
        if name in seen or len(name) < 3:
            continue
        seen.add(name)

        # Look in the 300 chars after the link for rating and reviews
        context = markdown[m.end(): m.end() + 300]
        rating_m = rating_pattern.search(context)
        reviews_m = reviews_pattern.search(context)

        activities.append({
            "name": name,
            "url": url,
            "rating": float(rating_m.group(1)) if rating_m else None,
            "reviews": int(reviews_m.group(1).replace(",", "")) if reviews_m else None,
            "source": "tripadvisor",
        })
        if len(activities) >= limit:
            break

    return activities


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
        activities = _parse_activities_from_markdown(markdown, limit)
        if not activities:
            # Parser found nothing — surface minimal info so agent can still proceed
            return {
                "activities": [],
                "source": "firecrawl_fallback",
                "note": "Could not parse activities from scraped page. No TRIPADVISOR_API_KEY set.",
            }
        return {"activities": activities, "source": "firecrawl_fallback"}
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
