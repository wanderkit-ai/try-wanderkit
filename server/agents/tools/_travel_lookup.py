from __future__ import annotations

from typing import Any


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


def lookup_destination(value: str | None) -> dict[str, Any]:
    text = (value or "").strip()
    lowered = text.lower()
    for key, item in DESTINATIONS.items():
        if key in lowered:
            return item
    if len(text) == 3 and text.isalpha():
        code = text.upper()
        return {"airport": code, "city": code, "lat": None, "lng": None, "label": code}
    return {"airport": "KTM", "city": "KTM", "lat": 27.7172, "lng": 85.3240, "label": text or "Kathmandu, Nepal"}


def lookup_origin(value: str | None) -> str:
    text = (value or "").strip()
    if len(text) == 3 and text.isalpha():
        return text.upper()
    return ORIGINS.get(text.lower(), "JFK")

