"""Operator search — used by Matchmaker, Negotiator, Itinerary, and Scout."""

from __future__ import annotations

import time
from typing import Any

import httpx

from backend.agents.mock_data import OPERATORS
from server.settings import get_settings

from ._shared import ToolDef

_TIER_RANK = {"$": 1, "$$": 2, "$$$": 3}


def _search_operators(input: dict[str, Any]) -> list[dict[str, Any]]:
    """Search operators by region, style, and price tier.

    Sorted by rating descending, then response speed ascending — best first.
    """
    region = str(input.get("region") or "").lower()
    style = input.get("style")
    max_tier = input.get("max_tier")
    matches = []
    for operator in OPERATORS:
        if region and region not in operator["country"].lower() and region not in operator["region"].lower():
            continue
        if style and style not in operator.get("specialties", []):
            continue
        if max_tier and _TIER_RANK[operator["priceTier"]] > _TIER_RANK.get(max_tier, 99):
            continue
        matches.append(operator)
    matches.sort(key=lambda op: (-op["rating"], op["responseHours"]))
    return [
        {
            "id": op["id"],
            "company": op["company"],
            "contact": op["contactName"],
            "country": op["country"],
            "region": op["region"],
            "specialties": op["specialties"],
            "rating": op["rating"],
            "replyTimeHours": op["responseHours"],
            "priceTier": op["priceTier"],
            "whatsapp": op["whatsapp"],
            "email": op.get("email", ""),
            "website": op.get("website", ""),
        }
        for op in matches
    ]


def _web_search_operators(input: dict[str, Any]) -> dict[str, Any]:
    """Search the web for local operators not yet in the database.

    Uses SerpAPI when SERPAPI_KEY is configured, otherwise returns a mock
    result so the agent can still demonstrate the workflow.
    """
    location: str = input.get("location", "")
    specialty: str = input.get("specialty", "")
    settings = get_settings()

    style_clause = f" {specialty}" if specialty else ""
    # Bias toward operator homepages, but listicles will still appear — that's
    # fine because Scout can scrape them with firecrawl_scrape.
    query = f"{location}{style_clause} tour operator official site -\"top 10\" -\"best of\""

    if settings.serpapi_key:
        try:
            resp = httpx.get(
                "https://serpapi.com/search",
                params={
                    "q": query,
                    "api_key": settings.serpapi_key,
                    "num": 10,
                    "engine": "google",
                },
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            results = [
                {
                    "title": r.get("title"),
                    "snippet": r.get("snippet"),
                    "link": r.get("link"),
                }
                for r in (data.get("organic_results") or [])[:10]
            ]
            return {
                "location": location,
                "query": query,
                "results": results,
                "note": (
                    "If results look like listicles ('Top 10', 'Best of', tripadvisor/lonelyplanet/etc), "
                    "use firecrawl_scrape on the top 1-2 to extract the named operator companies, "
                    "then scrape each operator's homepage to gather contact details before calling add_operator."
                ),
            }
        except Exception as exc:
            return {"location": location, "error": str(exc), "results": []}

    # Mock fallback — no SerpAPI key configured
    return {
        "location": location,
        "note": "SERPAPI_KEY not set — showing mock results. Add the key to .env.local for live web search.",
        "results": [
            {
                "title": f"[mock] Summit{style_clause.strip().title() or 'Trek'} Expeditions — {location}",
                "snippet": f"Award-winning local operator in {location} specialising in{style_clause} adventures. Est. 2008. +15 years experience.",
                "link": "https://example.com/mock-operator-1",
            },
            {
                "title": f"[mock] {location} Wild Routes",
                "snippet": f"Small-group{style_clause} tours with local guides. High 4.9 ★ TripAdvisor rating. Responsive team.",
                "link": "https://example.com/mock-operator-2",
            },
        ],
    }


def _add_operator(input: dict[str, Any]) -> dict[str, Any]:
    """Add a newly discovered operator to the in-memory database."""
    new_id = f"op_web_{int(time.time() * 1000)}"
    new_op: dict[str, Any] = {
        "id": new_id,
        "company": input.get("company", ""),
        "contactName": input.get("contactName", ""),
        "email": input.get("email", ""),
        "whatsapp": input.get("whatsapp", ""),
        "country": input.get("country", ""),
        "region": input.get("region", ""),
        "specialties": input.get("specialties", []),
        "rating": float(input.get("rating", 0)),
        "responseHours": int(input.get("responseHours", 24)),
        "priceTier": input.get("priceTier", "$$"),
        "website": input.get("website", ""),
        "notes": input.get("notes", ""),
    }
    OPERATORS.append(new_op)
    return {
        "added": True,
        "id": new_id,
        "company": new_op["company"],
        "operator": {
            "id": new_id,
            "company": new_op["company"],
            "contact": new_op.get("contactName", ""),
            "contactName": new_op.get("contactName", ""),
            "email": new_op.get("email", ""),
            "whatsapp": new_op.get("whatsapp", ""),
            "country": new_op.get("country", ""),
            "region": new_op.get("region", ""),
            "specialties": new_op.get("specialties", []),
            "rating": new_op.get("rating", 0),
            "replyTimeHours": new_op.get("responseHours", 24),
            "priceTier": new_op.get("priceTier", "$$"),
            "website": new_op.get("website", ""),
            "notes": new_op.get("notes", ""),
        },
        "note": "Operator saved. They now appear in the Operators list at /people/operators.",
    }


TOOLS: dict[str, ToolDef] = {
    "search_operators": ToolDef(
        name="search_operators",
        description="Search local operators by region/country and trip style.",
        input_schema={
            "type": "object",
            "properties": {
                "region": {"type": "string"},
                "style": {"type": "string"},
                "max_tier": {"type": "string", "enum": ["$", "$$", "$$$"]},
            },
        },
        handler=_search_operators,
    ),
    "web_search_operators": ToolDef(
        name="web_search_operators",
        description=(
            "Search the web for local tour operators in a destination not yet in the Noma database. "
            "Returns raw search results. Call add_operator to save promising ones."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "Country, region, or city (e.g. Patagonia, Bali, Marrakech)"},
                "specialty": {"type": "string", "description": "Trip style: hiking, beach, safari, cultural, wellness, culinary, expedition"},
            },
            "required": ["location"],
        },
        handler=_web_search_operators,
    ),
    "add_operator": ToolDef(
        name="add_operator",
        description="Add a newly discovered operator to the Noma database after confirming with the admin.",
        input_schema={
            "type": "object",
            "properties": {
                "company": {"type": "string"},
                "contactName": {"type": "string"},
                "email": {"type": "string"},
                "whatsapp": {"type": "string"},
                "country": {"type": "string"},
                "region": {"type": "string"},
                "specialties": {"type": "array", "items": {"type": "string"}},
                "rating": {"type": "number"},
                "responseHours": {"type": "number"},
                "priceTier": {"type": "string", "enum": ["$", "$$", "$$$"]},
                "website": {"type": "string", "description": "Operator's official homepage URL (extracted from scraped content)"},
                "notes": {"type": "string"},
            },
            "required": ["company", "contactName", "country", "region"],
        },
        handler=_add_operator,
    ),
}
