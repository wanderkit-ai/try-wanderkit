from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape
from pydantic import BaseModel, Field

from backend.agents.mock_data import CUSTOMERS, TRIPS, find_by_id
from server.agents.tools.activities import tripadvisor_activities
from server.agents.tools.email_resend import resend_send_email
from server.agents.tools.flights_amadeus import amadeus_search_flights
from server.agents.tools.hotels_amadeus import amadeus_search_hotels
from server.agents.tools.slack import slack_post_webhook
from server.agents.tools.weather_openmeteo import openmeteo_forecast
from server.llm.openai_client import chat
from server.settings import get_settings
from server.storage import jsonstore
from server.workflows.base import Step, WorkflowContext, run_dag
from server.workflows.registry import register


TEMPLATE_DIR = Path(__file__).resolve().parent / "templates"


class PremiumItineraryInput(BaseModel):
    trip_id: str | None = None
    destination: str
    start_date: str = Field(alias="startDate")
    end_date: str = Field(alias="endDate")
    budget: float | None = None
    traveler_email: str | None = None
    origin: str = "JFK"
    travelers: int = 1
    style: list[str] = Field(default_factory=list)
    must_haves: list[str] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _trip_defaults(trip_id: str | None) -> dict[str, Any]:
    trip = find_by_id(TRIPS, trip_id)
    if not trip:
        return {}

    first_customer = find_by_id(CUSTOMERS, (trip.get("customerIds") or [None])[0])
    budget = trip.get("budgetPerPerson")
    if isinstance(budget, (int, float)) and budget > 10000:
        budget = round(budget / 100, 2)

    return {
        "trip_id": trip.get("id"),
        "destination": trip.get("destination"),
        "startDate": trip.get("startDate"),
        "endDate": trip.get("endDate"),
        "budget": budget,
        "traveler_email": first_customer.get("email") if first_customer else None,
        "travelers": max(1, len(trip.get("customerIds") or [])),
        "style": trip.get("style") or [],
        "must_haves": trip.get("mustHaves") or [],
    }


def _render_template(name: str, context: dict[str, Any]) -> str:
    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )
    return env.get_template(name).render(**context)


async def parse_validate(ctx: WorkflowContext) -> dict[str, Any]:
    merged = {**_trip_defaults(ctx.get("trip_id")), **ctx.data}
    request = PremiumItineraryInput.model_validate(merged).model_dump()
    return {"request": request}


async def search_flights(ctx: WorkflowContext) -> dict[str, Any]:
    request = ctx.result("parse_validate")["request"]
    result = await asyncio.to_thread(
        amadeus_search_flights,
        {
            "origin": request["origin"],
            "destination": request["destination"],
            "departure_date": request["start_date"],
            "return_date": request["end_date"],
            "adults": request["travelers"],
            "currency": "USD",
            "max_results": 8,
        },
    )
    return {"flights": result}


async def search_hotels(ctx: WorkflowContext) -> dict[str, Any]:
    request = ctx.result("parse_validate")["request"]
    result = await asyncio.to_thread(
        amadeus_search_hotels,
        {
            "destination": request["destination"],
            "check_in": request["start_date"],
            "check_out": request["end_date"],
            "adults": request["travelers"],
            "currency": "USD",
            "max_hotels": 15,
        },
    )
    return {"hotels": result}


async def get_weather(ctx: WorkflowContext) -> dict[str, Any]:
    request = ctx.result("parse_validate")["request"]
    result = await asyncio.to_thread(
        openmeteo_forecast,
        {
            "destination": request["destination"],
            "start_date": request["start_date"],
            "end_date": request["end_date"],
        },
    )
    return {"weather": result}


async def get_activities(ctx: WorkflowContext) -> dict[str, Any]:
    request = ctx.result("parse_validate")["request"]
    result = await asyncio.to_thread(
        tripadvisor_activities,
        {"destination": request["destination"], "limit": 10},
    )
    return {"activities": result}


async def merge(ctx: WorkflowContext) -> dict[str, Any]:
    return {
        "travel_data": {
            "flights": ctx.result("search_flights", {}).get("flights", {}),
            "hotels": ctx.result("search_hotels", {}).get("hotels", {}),
            "weather": ctx.result("get_weather", {}).get("weather", {}),
            "activities": ctx.result("get_activities", {}).get("activities", {}),
        }
    }


async def score_recommendations(ctx: WorkflowContext) -> dict[str, Any]:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required")

    request = ctx.result("parse_validate")["request"]
    travel_data = ctx.result("merge")["travel_data"]

    response = await chat(
        [
            {
                "role": "system",
                "content": (
                    "You are a travel analyst. Score and rank the provided flights, hotels, and activities. "
                    "Return strict JSON only. Add a 'score' (0-100) and 'rationale' (1 sentence) to the top 3 "
                    "items in each category. Weigh price, quality, and relevance to the traveler's style."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "schema": {
                            "top_flights": [{"item": "object", "score": "number", "rationale": "string"}],
                            "top_hotels": [{"item": "object", "score": "number", "rationale": "string"}],
                            "top_activities": [{"item": "object", "score": "number", "rationale": "string"}],
                        },
                        "traveler_style": request.get("style", []),
                        "budget_per_person": request.get("budget"),
                        "travel_data": travel_data,
                    },
                    default=str,
                ),
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
        max_tokens=1500,
    )
    content = response.choices[0].message.content or "{}"
    scored = json.loads(content)
    return {"scored": scored}


async def generate_itinerary(ctx: WorkflowContext) -> dict[str, Any]:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required")

    request = ctx.result("parse_validate")["request"]
    travel_data = ctx.result("merge")["travel_data"]
    scored = ctx.result("score_recommendations").get("scored", {})

    response = await chat(
        [
            {
                "role": "system",
                "content": (
                    "You are Noma's premium itinerary generator. Return strict JSON only. "
                    "Use the scored recommendations to feature the best options prominently. "
                    "Include weather context in each day's narrative. Write richer, more detailed "
                    "daily descriptions than a basic plan would."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "schema": {
                            "summary": "string",
                            "total_cost": "number or null",
                            "highlights": ["string"],
                            "days": [
                                {
                                    "day": "number",
                                    "date": "YYYY-MM-DD",
                                    "location": "string",
                                    "weather_note": "string",
                                    "morning": "string",
                                    "afternoon": "string",
                                    "evening": "string",
                                    "lodging": "string",
                                    "featured_activity": "string or null",
                                }
                            ],
                            "booking_notes": ["string"],
                        },
                        "trip": request,
                        "travel_data": travel_data,
                        "scored_recommendations": scored,
                    },
                    default=str,
                ),
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
        max_tokens=3000,
    )
    content = response.choices[0].message.content or "{}"
    itinerary = json.loads(content)
    return {"itinerary": itinerary}


async def format_html(ctx: WorkflowContext) -> dict[str, Any]:
    request = ctx.result("parse_validate")["request"]
    itinerary = ctx.result("generate_itinerary")["itinerary"]
    travel_data = ctx.result("merge")["travel_data"]
    scored = ctx.result("score_recommendations").get("scored", {})

    html = _render_template(
        "itinerary_premium.html.j2",
        {
            "request": request,
            "itinerary": itinerary,
            "travel_data": travel_data,
            "scored": scored,
            "generated_at": _now(),
        },
    )

    run_id = str(ctx.get("run_id") or f"premium_{datetime.now(UTC).timestamp():.0f}")
    artifact_dir = jsonstore.DATA_DIR / "itineraries"
    artifact_dir.mkdir(parents=True, exist_ok=True)
    artifact_path = artifact_dir / f"{run_id}.html"
    artifact_path.write_text(html, encoding="utf-8")
    jsonstore.append(
        "itineraries",
        {
            "id": run_id,
            "workflow": "itinerary-premium",
            "trip_id": request.get("trip_id"),
            "destination": request["destination"],
            "artifact": str(artifact_path),
            "created_at": _now(),
        },
    )
    return {"html": html, "itinerary_url": f"/api/workflows/artifacts/{run_id}.html"}


async def send_email(ctx: WorkflowContext) -> dict[str, Any]:
    request = ctx.result("parse_validate")["request"]
    formatted = ctx.result("format_html")
    if not request.get("traveler_email"):
        return {"email_sent": False, "email": {"sent": False, "error": "traveler_email is required"}}

    email = await asyncio.to_thread(
        resend_send_email,
        {
            "to": request["traveler_email"],
            "subject": f"Your premium {request['destination']} itinerary",
            "html": formatted["html"],
            "idempotency_key": f"itinerary-premium-{ctx.get('run_id')}",
        },
    )
    jsonstore.append(
        "email_log",
        {
            "workflow": "itinerary-premium",
            "run_id": ctx.get("run_id"),
            "to": request["traveler_email"],
            "sent": bool(email.get("sent")),
            "provider_id": email.get("id"),
            "error": email.get("error"),
            "created_at": _now(),
        },
    )
    return {"email_sent": bool(email.get("sent")), "email": email}


async def slack_notify(ctx: WorkflowContext) -> dict[str, Any]:
    request = ctx.result("parse_validate")["request"]
    itinerary = ctx.result("generate_itinerary").get("itinerary", {})
    scored = ctx.result("score_recommendations").get("scored", {})

    top_flight = (scored.get("top_flights") or [{}])[0]
    top_hotel = (scored.get("top_hotels") or [{}])[0]
    total_cost = itinerary.get("total_cost")
    cost_text = f"~${total_cost:,.0f}" if total_cost else "TBD"

    text = (
        f"*Premium itinerary generated* — {request['destination']} "
        f"({request['start_date']} → {request['end_date']})\n"
        f"Budget: {cost_text} · Travelers: {request['travelers']}\n"
        f"Top flight: {top_flight.get('item', {}).get('airline', 'N/A') if top_flight else 'N/A'} "
        f"(score {top_flight.get('score', '?')})\n"
        f"Top hotel: {top_hotel.get('item', {}).get('name', 'N/A') if top_hotel else 'N/A'} "
        f"(score {top_hotel.get('score', '?')})"
    )

    result = await asyncio.to_thread(slack_post_webhook, {"text": text})
    return {"slack_sent": result.get("sent", False), "slack_error": result.get("error")}


async def respond(ctx: WorkflowContext) -> dict[str, Any]:
    formatted = ctx.result("format_html")
    sent = ctx.result("send_email")
    slack = ctx.result("slack_notify")
    return {
        "run_id": ctx.get("run_id"),
        "email_sent": sent.get("email_sent", False),
        "slack_sent": slack.get("slack_sent", False),
        "itinerary_url": formatted.get("itinerary_url"),
    }


@register("itinerary-premium")
async def itinerary_premium(payload: dict[str, Any]):
    steps = [
        Step("parse_validate", (), parse_validate),
        Step("search_flights", ("parse_validate",), search_flights),
        Step("search_hotels", ("parse_validate",), search_hotels),
        Step("get_weather", ("parse_validate",), get_weather),
        Step("get_activities", ("parse_validate",), get_activities),
        Step("merge", ("search_flights", "search_hotels", "get_weather", "get_activities"), merge),
        Step("score_recommendations", ("merge",), score_recommendations),
        Step("generate_itinerary", ("score_recommendations",), generate_itinerary),
        Step("format_html", ("generate_itinerary",), format_html),
        Step("send_email", ("format_html",), send_email),
        Step("slack_notify", ("generate_itinerary",), slack_notify),
        Step("respond", ("send_email", "slack_notify"), respond),
    ]
    async for event in run_dag(steps, payload):
        yield event
