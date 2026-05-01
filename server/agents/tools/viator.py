"""Viator activities and tours via the Viator Partner API.

Requires VIATOR_API_KEY. Apply at: https://www.viator.com/info/api
Sandbox key for testing: available after partner application approval.
"""

from __future__ import annotations

from typing import Any

import httpx

from server.settings import get_settings

from ._shared import ToolDef

_BASE = "https://api.viator.com/partner"


def _headers(api_key: str) -> dict[str, str]:
    return {
        "exp-api-key": api_key,
        "Content-Type": "application/json;version=2.0",
        "Accept": "application/json;version=2.0",
        "Accept-Language": "en-US",
    }


def _parse_product(p: dict[str, Any]) -> dict[str, Any]:
    reviews = p.get("reviews") or {}
    pricing = (p.get("pricing") or {}).get("summary") or {}
    images = p.get("images") or []
    first_image_variants = (images[0] if images else {}).get("variants") or []
    image_url = first_image_variants[0].get("url") if first_image_variants else None
    duration = p.get("duration") or {}
    return {
        "product_code": p.get("productCode"),
        "name": p.get("title"),
        "description": (p.get("description") or "")[:400],
        "rating": reviews.get("combinedAverageRating"),
        "review_count": reviews.get("totalReviews"),
        "price_from_usd": pricing.get("fromPrice"),
        "duration_minutes": duration.get("fixedDurationInMinutes"),
        "image_url": image_url,
        "booking_url": p.get("productUrl"),
        "source": "viator.com",
    }


def viator_search_activities(input: dict[str, Any]) -> dict[str, Any]:
    """Search Viator for tours and activities at a destination."""
    try:
        settings = get_settings()
        if not settings.viator_api_key:
            return {"error": "VIATOR_API_KEY is not configured — apply at viator.com/info/api"}

        destination = (input.get("destination") or "").strip()
        if not destination:
            return {"error": "destination is required"}

        limit = min(int(input.get("limit") or 10), 20)
        hdrs = _headers(settings.viator_api_key)

        body: dict[str, Any] = {
            "text": destination,
            "searchTypes": [
                {
                    "searchType": "PRODUCTS",
                    "pagination": {"start": 1, "count": limit},
                }
            ],
            "currency": "USD",
            "sorting": {"sort": "TRAVELER_RATING", "order": "DESCENDING"},
        }

        with httpx.Client(timeout=20) as client:
            r = client.post(
                f"{_BASE}/search/freetext",
                json=body,
                headers=hdrs,
            )

        if r.status_code >= 400:
            return {
                "error": "Viator search failed",
                "status": r.status_code,
                "details": r.text[:300],
            }

        data = r.json()
        products_raw = (data.get("products") or {}).get("results") or []
        activities = [_parse_product(p) for p in products_raw]

        return {
            "destination": destination,
            "activities": activities,
            "count": len(activities),
            "source": "viator.com",
        }
    except Exception as exc:
        return {"error": str(exc) or "Viator activity search failed"}


TOOLS: dict[str, ToolDef] = {
    "viator_search_activities": ToolDef(
        name="viator_search_activities",
        description=(
            "Search Viator for real tours, activities, and experiences at a destination. "
            "Returns top results with ratings, prices, and booking links. "
            "Requires VIATOR_API_KEY (apply at viator.com/info/api)."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "destination": {"type": "string", "description": "City or region name, e.g. 'Marrakech' or 'Bali'."},
                "limit": {"type": "integer", "minimum": 1, "maximum": 20, "default": 10},
            },
            "required": ["destination"],
        },
        handler=viator_search_activities,
    )
}
