"""Destination intelligence — weather, advisories, news. All mocked."""

from __future__ import annotations

from typing import Any

from ._shared import ToolDef


def _get_weather(input: dict[str, Any]) -> dict[str, Any]:
    """Return a mock 7-day weather summary for a destination."""
    return {
        "destination": input.get("destination"),
        "summary": "[mock] Avg high 22C, lows 8C, 20% chance of rain mid-week.",
    }


def _get_travel_advisory(input: dict[str, Any]) -> dict[str, Any]:
    """Return a mock US State Department travel advisory level for a country."""
    return {
        "country": input.get("country"),
        "level": "[mock] Level 2 - Exercise Increased Caution. Updated 2026-04-14.",
    }


def _get_news(input: dict[str, Any]) -> dict[str, Any]:
    """Return mock destination headlines that could affect trip planning."""
    destination = input.get("destination")
    return {
        "destination": destination,
        "headlines": [
            f"[mock] {destination}: New national park entry fee announced (Apr 2026)",
            f"[mock] {destination}: Domestic carriers expand routes for tourist season",
        ],
    }


TOOLS: dict[str, ToolDef] = {
    "get_weather": ToolDef(
        name="get_weather",
        description="Get 7-day weather forecast for a destination.",
        input_schema={
            "type": "object",
            "properties": {"destination": {"type": "string"}},
            "required": ["destination"],
        },
        handler=_get_weather,
    ),
    "get_travel_advisory": ToolDef(
        name="get_travel_advisory",
        description="Fetch the latest US State Department travel advisory level.",
        input_schema={
            "type": "object",
            "properties": {"country": {"type": "string"}},
            "required": ["country"],
        },
        handler=_get_travel_advisory,
    ),
    "get_news": ToolDef(
        name="get_news",
        description="Recent news headlines relevant to a destination.",
        input_schema={
            "type": "object",
            "properties": {"destination": {"type": "string"}},
            "required": ["destination"],
        },
        handler=_get_news,
    ),
}
