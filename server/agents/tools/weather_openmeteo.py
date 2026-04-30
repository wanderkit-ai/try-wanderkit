from __future__ import annotations

from typing import Any

import httpx

from ._shared import ToolDef
from ._travel_lookup import lookup_destination


def openmeteo_forecast(input: dict[str, Any]) -> dict[str, Any]:
    try:
        destination_info = lookup_destination(input.get("destination"))
        lat = input.get("latitude") or input.get("lat") or destination_info.get("lat")
        lng = input.get("longitude") or input.get("lng") or destination_info.get("lng")
        if lat is None or lng is None:
            return {"error": "latitude and longitude are required when destination is unknown"}

        forecast_days = max(1, min(int(input.get("forecast_days") or 7), 16))
        params = {
            "latitude": lat,
            "longitude": lng,
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
            "timezone": input.get("timezone") or "auto",
            "temperature_unit": input.get("temperature_unit") or "fahrenheit",
            "wind_speed_unit": input.get("wind_speed_unit") or "mph",
            "forecast_days": forecast_days,
        }
        with httpx.Client(timeout=20) as client:
            response = client.get("https://api.open-meteo.com/v1/forecast", params=params)
        if response.status_code >= 400:
            return {"error": "Open-Meteo forecast failed", "status": response.status_code, "details": response.text}
        data = response.json()
        return {
            "destination": destination_info.get("label"),
            "latitude": lat,
            "longitude": lng,
            "forecast_days": forecast_days,
            "daily": data.get("daily", {}),
            "source": "open-meteo",
        }
    except Exception as exc:
        return {"error": str(exc) or "Open-Meteo forecast failed"}


TOOLS: dict[str, ToolDef] = {
    "openmeteo_forecast": ToolDef(
        name="openmeteo_forecast",
        description="Get a no-key Open-Meteo daily weather forecast for a destination or coordinates.",
        input_schema={
            "type": "object",
            "properties": {
                "destination": {"type": "string"},
                "latitude": {"type": "number"},
                "longitude": {"type": "number"},
                "forecast_days": {"type": "integer", "minimum": 1, "maximum": 16},
                "temperature_unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
            },
            "required": [],
        },
        handler=openmeteo_forecast,
    )
}

