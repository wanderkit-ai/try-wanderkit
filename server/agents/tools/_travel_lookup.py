from __future__ import annotations

from typing import Any

import httpx


DESTINATIONS: dict[str, dict[str, Any]] = {
    "annapurna": {"airport": "KTM", "city": "KTM", "lat": 28.3949, "lng": 84.1240, "label": "Annapurna, Nepal"},
    "nepal": {"airport": "KTM", "city": "KTM", "lat": 28.3949, "lng": 84.1240, "label": "Nepal"},
    "kathmandu": {"airport": "KTM", "city": "KTM", "lat": 27.7172, "lng": 85.3240, "label": "Kathmandu, Nepal"},
    "maasai": {"airport": "NBO", "city": "NBO", "lat": -1.4061, "lng": 35.0084, "label": "Maasai Mara, Kenya"},
    "kenya": {"airport": "NBO", "city": "NBO", "lat": -1.2921, "lng": 36.8219, "label": "Kenya"},
    "marrakech": {"airport": "RAK", "city": "RAK", "lat": 31.6295, "lng": -7.9811, "label": "Marrakech, Morocco"},
    "morocco": {"airport": "RAK", "city": "RAK", "lat": 31.7917, "lng": -7.0926, "label": "Morocco"},
    "patagonia": {"airport": "PUQ", "city": "PUQ", "lat": -50.9423, "lng": -73.4068, "label": "Patagonia"},
    "torres del paine": {"airport": "PUQ", "city": "PUQ", "lat": -50.9423, "lng": -73.4068, "label": "Torres del Paine, Chile"},
    "nosara": {"airport": "LIR", "city": "LIR", "lat": 9.9804, "lng": -85.6525, "label": "Nosara, Costa Rica"},
    "costa rica": {"airport": "LIR", "city": "LIR", "lat": 9.7489, "lng": -83.7534, "label": "Costa Rica"},
    "bali": {"airport": "DPS", "city": "DPS", "lat": -8.3405, "lng": 115.0920, "label": "Bali, Indonesia"},
    "tokyo": {"airport": "HND", "city": "TYO", "lat": 35.6762, "lng": 139.6503, "label": "Tokyo, Japan"},
}

ORIGINS = {
    "new york": "JFK",
    "nyc": "JFK",
    "brooklyn": "JFK",
    "toronto": "YYZ",
    "london": "LHR",
    "stockholm": "ARN",
    "lagos": "LOS",
    "osaka": "KIX",
}


def _geocode(name: str) -> dict[str, Any]:
    """Resolve a destination name to coordinates via Open-Meteo geocoding (no API key)."""
    try:
        with httpx.Client(timeout=10) as client:
            r = client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": name, "count": 1, "language": "en", "format": "json"},
            )
        results = r.json().get("results") or []
        if results:
            r0 = results[0]
            label = r0.get("name", name)
            country = r0.get("country", "")
            if country:
                label = f"{label}, {country}"
            return {
                "airport": None,
                "city": r0.get("name", name),
                "lat": r0["latitude"],
                "lng": r0["longitude"],
                "label": label,
            }
    except Exception:
        pass
    return {"airport": None, "city": name, "lat": None, "lng": None, "label": name}


def lookup_destination(value: str | None) -> dict[str, Any]:
    text = (value or "").strip()
    lowered = text.lower()
    for key, item in DESTINATIONS.items():
        if key in lowered:
            return item
    if len(text) == 3 and text.isalpha():
        code = text.upper()
        return {"airport": code, "city": code, "lat": None, "lng": None, "label": code}
    return _geocode(text)


def lookup_origin(value: str | None) -> str:
    text = (value or "").strip()
    if len(text) == 3 and text.isalpha():
        return text.upper()
    return ORIGINS.get(text.lower(), "JFK")

