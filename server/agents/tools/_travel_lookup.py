from __future__ import annotations

from typing import Any

import httpx


DESTINATIONS: dict[str, dict[str, Any]] = {
    # Nepal
    "annapurna": {"airport": "KTM", "city": "KTM", "lat": 28.3949, "lng": 84.1240, "label": "Annapurna, Nepal"},
    "nepal": {"airport": "KTM", "city": "KTM", "lat": 28.3949, "lng": 84.1240, "label": "Nepal"},
    "kathmandu": {"airport": "KTM", "city": "KTM", "lat": 27.7172, "lng": 85.3240, "label": "Kathmandu, Nepal"},
    "pokhara": {"airport": "PKR", "city": "PKR", "lat": 28.2096, "lng": 83.9856, "label": "Pokhara, Nepal"},
    # Africa
    "maasai": {"airport": "NBO", "city": "NBO", "lat": -1.4061, "lng": 35.0084, "label": "Maasai Mara, Kenya"},
    "kenya": {"airport": "NBO", "city": "NBO", "lat": -1.2921, "lng": 36.8219, "label": "Kenya"},
    "nairobi": {"airport": "NBO", "city": "NBO", "lat": -1.2921, "lng": 36.8219, "label": "Nairobi, Kenya"},
    "cape town": {"airport": "CPT", "city": "CPT", "lat": -33.9249, "lng": 18.4241, "label": "Cape Town, South Africa"},
    "johannesburg": {"airport": "JNB", "city": "JNB", "lat": -26.2041, "lng": 28.0473, "label": "Johannesburg, South Africa"},
    "cairo": {"airport": "CAI", "city": "CAI", "lat": 30.0444, "lng": 31.2357, "label": "Cairo, Egypt"},
    # Morocco
    "marrakech": {"airport": "RAK", "city": "RAK", "lat": 31.6295, "lng": -7.9811, "label": "Marrakech, Morocco"},
    "morocco": {"airport": "CMN", "city": "CMN", "lat": 31.7917, "lng": -7.0926, "label": "Morocco"},
    "casablanca": {"airport": "CMN", "city": "CMN", "lat": 33.5731, "lng": -7.5898, "label": "Casablanca, Morocco"},
    # Europe
    "london": {"airport": "LHR", "city": "LON", "lat": 51.5074, "lng": -0.1278, "label": "London, UK"},
    "paris": {"airport": "CDG", "city": "PAR", "lat": 48.8566, "lng": 2.3522, "label": "Paris, France"},
    "rome": {"airport": "FCO", "city": "ROM", "lat": 41.9028, "lng": 12.4964, "label": "Rome, Italy"},
    "amsterdam": {"airport": "AMS", "city": "AMS", "lat": 52.3676, "lng": 4.9041, "label": "Amsterdam, Netherlands"},
    "barcelona": {"airport": "BCN", "city": "BCN", "lat": 41.3851, "lng": 2.1734, "label": "Barcelona, Spain"},
    "madrid": {"airport": "MAD", "city": "MAD", "lat": 40.4168, "lng": -3.7038, "label": "Madrid, Spain"},
    "lisbon": {"airport": "LIS", "city": "LIS", "lat": 38.7223, "lng": -9.1393, "label": "Lisbon, Portugal"},
    "berlin": {"airport": "BER", "city": "BER", "lat": 52.5200, "lng": 13.4050, "label": "Berlin, Germany"},
    "vienna": {"airport": "VIE", "city": "VIE", "lat": 48.2082, "lng": 16.3738, "label": "Vienna, Austria"},
    "zurich": {"airport": "ZRH", "city": "ZRH", "lat": 47.3769, "lng": 8.5417, "label": "Zurich, Switzerland"},
    "athens": {"airport": "ATH", "city": "ATH", "lat": 37.9838, "lng": 23.7275, "label": "Athens, Greece"},
    "istanbul": {"airport": "IST", "city": "IST", "lat": 41.0082, "lng": 28.9784, "label": "Istanbul, Turkey"},
    "prague": {"airport": "PRG", "city": "PRG", "lat": 50.0755, "lng": 14.4378, "label": "Prague, Czech Republic"},
    "budapest": {"airport": "BUD", "city": "BUD", "lat": 47.4979, "lng": 19.0402, "label": "Budapest, Hungary"},
    # Americas
    "patagonia": {"airport": "PUQ", "city": "PUQ", "lat": -50.9423, "lng": -73.4068, "label": "Patagonia"},
    "torres del paine": {"airport": "PUQ", "city": "PUQ", "lat": -50.9423, "lng": -73.4068, "label": "Torres del Paine, Chile"},
    "nosara": {"airport": "LIR", "city": "LIR", "lat": 9.9804, "lng": -85.6525, "label": "Nosara, Costa Rica"},
    "costa rica": {"airport": "SJO", "city": "SJO", "lat": 9.7489, "lng": -83.7534, "label": "Costa Rica"},
    "cancun": {"airport": "CUN", "city": "CUN", "lat": 21.1619, "lng": -86.8515, "label": "Cancún, Mexico"},
    "mexico city": {"airport": "MEX", "city": "MEX", "lat": 19.4326, "lng": -99.1332, "label": "Mexico City, Mexico"},
    "buenos aires": {"airport": "EZE", "city": "BUE", "lat": -34.6037, "lng": -58.3816, "label": "Buenos Aires, Argentina"},
    "rio de janeiro": {"airport": "GIG", "city": "RIO", "lat": -22.9068, "lng": -43.1729, "label": "Rio de Janeiro, Brazil"},
    "sao paulo": {"airport": "GRU", "city": "SAO", "lat": -23.5505, "lng": -46.6333, "label": "São Paulo, Brazil"},
    "miami": {"airport": "MIA", "city": "MIA", "lat": 25.7617, "lng": -80.1918, "label": "Miami, USA"},
    "los angeles": {"airport": "LAX", "city": "LAX", "lat": 34.0522, "lng": -118.2437, "label": "Los Angeles, USA"},
    "san francisco": {"airport": "SFO", "city": "SFO", "lat": 37.7749, "lng": -122.4194, "label": "San Francisco, USA"},
    "chicago": {"airport": "ORD", "city": "CHI", "lat": 41.8781, "lng": -87.6298, "label": "Chicago, USA"},
    "toronto": {"airport": "YYZ", "city": "YTO", "lat": 43.6532, "lng": -79.3832, "label": "Toronto, Canada"},
    "vancouver": {"airport": "YVR", "city": "YVR", "lat": 49.2827, "lng": -123.1207, "label": "Vancouver, Canada"},
    # Asia & Pacific
    "bali": {"airport": "DPS", "city": "DPS", "lat": -8.3405, "lng": 115.0920, "label": "Bali, Indonesia"},
    "tokyo": {"airport": "HND", "city": "TYO", "lat": 35.6762, "lng": 139.6503, "label": "Tokyo, Japan"},
    "osaka": {"airport": "KIX", "city": "OSA", "lat": 34.6937, "lng": 135.5023, "label": "Osaka, Japan"},
    "kyoto": {"airport": "KIX", "city": "OSA", "lat": 35.0116, "lng": 135.7681, "label": "Kyoto, Japan"},
    "bangkok": {"airport": "BKK", "city": "BKK", "lat": 13.7563, "lng": 100.5018, "label": "Bangkok, Thailand"},
    "phuket": {"airport": "HKT", "city": "HKT", "lat": 7.8804, "lng": 98.3923, "label": "Phuket, Thailand"},
    "singapore": {"airport": "SIN", "city": "SIN", "lat": 1.3521, "lng": 103.8198, "label": "Singapore"},
    "hong kong": {"airport": "HKG", "city": "HKG", "lat": 22.3193, "lng": 114.1694, "label": "Hong Kong"},
    "seoul": {"airport": "ICN", "city": "SEL", "lat": 37.5665, "lng": 126.9780, "label": "Seoul, South Korea"},
    "beijing": {"airport": "PEK", "city": "BJS", "lat": 39.9042, "lng": 116.4074, "label": "Beijing, China"},
    "shanghai": {"airport": "PVG", "city": "SHA", "lat": 31.2304, "lng": 121.4737, "label": "Shanghai, China"},
    "dubai": {"airport": "DXB", "city": "DXB", "lat": 25.2048, "lng": 55.2708, "label": "Dubai, UAE"},
    "mumbai": {"airport": "BOM", "city": "BOM", "lat": 19.0760, "lng": 72.8777, "label": "Mumbai, India"},
    "delhi": {"airport": "DEL", "city": "DEL", "lat": 28.6139, "lng": 77.2090, "label": "Delhi, India"},
    "sydney": {"airport": "SYD", "city": "SYD", "lat": -33.8688, "lng": 151.2093, "label": "Sydney, Australia"},
    "melbourne": {"airport": "MEL", "city": "MEL", "lat": -37.8136, "lng": 144.9631, "label": "Melbourne, Australia"},
    "auckland": {"airport": "AKL", "city": "AKL", "lat": -36.8509, "lng": 174.7645, "label": "Auckland, New Zealand"},
    # Middle East
    "tel aviv": {"airport": "TLV", "city": "TLV", "lat": 32.0853, "lng": 34.7818, "label": "Tel Aviv, Israel"},
    "amman": {"airport": "AMM", "city": "AMM", "lat": 31.9454, "lng": 35.9284, "label": "Amman, Jordan"},
}

ORIGINS = {
    "new york": "JFK",
    "nyc": "JFK",
    "brooklyn": "JFK",
    "manhattan": "JFK",
    "los angeles": "LAX",
    "la": "LAX",
    "san francisco": "SFO",
    "chicago": "ORD",
    "miami": "MIA",
    "boston": "BOS",
    "seattle": "SEA",
    "washington": "IAD",
    "dc": "IAD",
    "toronto": "YYZ",
    "vancouver": "YVR",
    "london": "LHR",
    "paris": "CDG",
    "amsterdam": "AMS",
    "frankfurt": "FRA",
    "berlin": "BER",
    "madrid": "MAD",
    "rome": "FCO",
    "zurich": "ZRH",
    "stockholm": "ARN",
    "dubai": "DXB",
    "singapore": "SIN",
    "hong kong": "HKG",
    "tokyo": "HND",
    "seoul": "ICN",
    "sydney": "SYD",
    "lagos": "LOS",
    "nairobi": "NBO",
    "kathmandu": "KTM",
    "mumbai": "BOM",
    "delhi": "DEL",
    "osaka": "KIX",
    "bangkok": "BKK",
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
    lowered = text.lower()
    if lowered in ORIGINS:
        return ORIGINS[lowered]
    for key, item in DESTINATIONS.items():
        if key in lowered and item.get("airport"):
            return item["airport"]
    return text.upper() or "JFK"

