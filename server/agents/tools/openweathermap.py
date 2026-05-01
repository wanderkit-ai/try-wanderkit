"""OpenWeatherMap 5-day weather forecast.

Free tier: 60 calls/minute, 5-day/3-hour forecast.
Get a free API key at: https://openweathermap.org/api
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any

import httpx

from server.settings import get_settings

from ._shared import ToolDef

_WMO_CODES: dict[int, str] = {
    800: "Clear sky", 801: "Few clouds", 802: "Scattered clouds",
    803: "Broken clouds", 804: "Overcast", 500: "Light rain",
    501: "Moderate rain", 502: "Heavy rain", 503: "Very heavy rain",
    200: "Thunderstorm", 300: "Drizzle", 600: "Light snow", 601: "Snow",
}


def openweathermap_forecast(input: dict[str, Any]) -> dict[str, Any]:
    """Get a 5-day weather forecast from OpenWeatherMap."""
    try:
        settings = get_settings()
        if not settings.openweathermap_api_key:
            return {"error": "OPENWEATHERMAP_API_KEY is not configured — get a free key at openweathermap.org/api"}

        destination = (input.get("destination") or "").strip()
        if not destination:
            return {"error": "destination is required"}

        days = min(int(input.get("days") or 7), 5)  # free tier max 5 days
        units = input.get("units", "metric")
        temp_unit = "°C" if units == "metric" else "°F"

        with httpx.Client(timeout=15) as client:
            r = client.get(
                "https://api.openweathermap.org/data/2.5/forecast",
                params={
                    "q": destination,
                    "appid": settings.openweathermap_api_key,
                    "units": units,
                    "cnt": days * 8,  # 8 slots per day (every 3 hours)
                },
            )

        if r.status_code == 404:
            return {"error": f"City not found: '{destination}' — try a major nearby city"}
        if r.status_code >= 400:
            return {"error": "OpenWeatherMap request failed", "status": r.status_code, "details": r.text[:200]}

        data = r.json()
        city = data.get("city") or {}

        # Aggregate to daily summaries
        daily: dict[str, dict[str, Any]] = defaultdict(lambda: {"temps": [], "weather_ids": [], "rain_mm": 0.0, "wind_mps": []})
        for slot in data.get("list") or []:
            date = (slot.get("dt_txt") or "")[:10]
            main = slot.get("main") or {}
            weather = (slot.get("weather") or [{}])[0]
            daily[date]["temps"].append(main.get("temp", 0))
            daily[date]["weather_ids"].append(weather.get("id", 800))
            daily[date]["rain_mm"] += (slot.get("rain") or {}).get("3h", 0.0)
            daily[date]["wind_mps"].append((slot.get("wind") or {}).get("speed", 0))

        forecast = []
        for date in sorted(daily)[:days]:
            d = daily[date]
            temps = d["temps"]
            dominant_id = max(set(d["weather_ids"]), key=d["weather_ids"].count)
            forecast.append({
                "date": date,
                "high": round(max(temps), 1) if temps else None,
                "low": round(min(temps), 1) if temps else None,
                "avg": round(sum(temps) / len(temps), 1) if temps else None,
                "unit": temp_unit,
                "condition": _WMO_CODES.get(dominant_id) or "Mixed",
                "rain_mm": round(d["rain_mm"], 1),
                "wind_avg_mps": round(sum(d["wind_mps"]) / len(d["wind_mps"]), 1) if d["wind_mps"] else 0,
            })

        return {
            "destination": city.get("name", destination),
            "country": city.get("country"),
            "timezone": city.get("timezone"),
            "forecast": forecast,
            "days": len(forecast),
            "source": "openweathermap.org",
        }
    except Exception as exc:
        return {"error": str(exc) or "OpenWeatherMap request failed"}


TOOLS: dict[str, ToolDef] = {
    "openweathermap_forecast": ToolDef(
        name="openweathermap_forecast",
        description=(
            "Get a 5-day weather forecast for a destination from OpenWeatherMap. "
            "Returns daily high/low temps, condition, and rainfall. "
            "Requires OPENWEATHERMAP_API_KEY (free at openweathermap.org/api)."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "destination": {"type": "string", "description": "City name, e.g. 'Marrakech' or 'Kathmandu'."},
                "days": {"type": "integer", "minimum": 1, "maximum": 5, "default": 5},
                "units": {"type": "string", "enum": ["metric", "imperial"], "default": "metric"},
            },
            "required": ["destination"],
        },
        handler=openweathermap_forecast,
    )
}
