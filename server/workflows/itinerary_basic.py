from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape
from pydantic import BaseModel, Field

from backend.agents.mock_data import CUSTOMERS, TRIPS, find_by_id
from server.agents.tools.email_resend import resend_send_email
from server.agents.tools.flights_amadeus import amadeus_search_flights
from server.agents.tools.hotels_amadeus import amadeus_search_hotels
from server.llm.openai_client import chat
from server.settings import get_settings
from server.storage import jsonstore
from server.workflows.base import Step, WorkflowContext, run_dag
from server.workflows.registry import register


TEMPLATE_DIR = Path(__file__).resolve().parent / "templates"


class BasicItineraryInput(BaseModel):
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
    request = BasicItineraryInput.model_validate(merged).model_dump()
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
            "max_results": 5,
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
            "max_hotels": 10,
        },
    )
    return {"hotels": result}


async def merge(ctx: WorkflowContext) -> dict[str, Any]:
    return {
        "travel_data": {
            "flights": ctx.result("search_flights", {}).get("flights", {}),
            "hotels": ctx.result("search_hotels", {}).get("hotels", {}),
        }
    }


async def generate_itinerary(ctx: WorkflowContext) -> dict[str, Any]:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required to generate an itinerary")

    request = ctx.result("parse_validate")["request"]
    travel_data = ctx.result("merge")["travel_data"]
    response = await chat(
        [
            {
                "role": "system",
                "content": (
                    "You are Noma's basic itinerary generator. Return strict JSON only. "
                    "Use the provided real flight and hotel data where available. "
                    "Keep the plan practical, budget-aware, and concise."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "schema": {
                            "summary": "string",
                            "total_cost": "number or null",
                            "days": [
                                {
                                    "day": "number",
                                    "date": "YYYY-MM-DD",
                                    "location": "string",
                                    "morning": "string",
                                    "afternoon": "string",
                                    "evening": "string",
                                    "lodging": "string",
                                }
                            ],
                            "booking_notes": ["string"],
                        },
                        "trip": request,
                        "travel_data": travel_data,
                    },
                    default=str,
                ),
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
        max_tokens=2200,
    )
    content = response.choices[0].message.content or "{}"
    itinerary = json.loads(content)
    return {"itinerary": itinerary}


async def format_html(ctx: WorkflowContext) -> dict[str, Any]:
    request = ctx.result("parse_validate")["request"]
    itinerary = ctx.result("generate_itinerary")["itinerary"]
    travel_data = ctx.result("merge")["travel_data"]
    html = _render_template(
        "itinerary_basic.html.j2",
        {
            "request": request,
            "itinerary": itinerary,
            "travel_data": travel_data,
            "generated_at": _now(),
        },
    )

    run_id = str(ctx.get("run_id") or f"itinerary_{datetime.now(UTC).timestamp():.0f}")
    artifact_dir = jsonstore.DATA_DIR / "itineraries"
    artifact_dir.mkdir(parents=True, exist_ok=True)
    artifact_path = artifact_dir / f"{run_id}.html"
    artifact_path.write_text(html, encoding="utf-8")
    jsonstore.append(
        "itineraries",
        {
            "id": run_id,
            "workflow": "itinerary-basic",
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
            "subject": f"Your {request['destination']} itinerary",
            "html": formatted["html"],
            "idempotency_key": f"itinerary-basic-{ctx.get('run_id')}",
        },
    )
    jsonstore.append(
        "email_log",
        {
            "workflow": "itinerary-basic",
            "run_id": ctx.get("run_id"),
            "to": request["traveler_email"],
            "sent": bool(email.get("sent")),
            "provider_id": email.get("id"),
            "error": email.get("error"),
            "created_at": _now(),
        },
    )
    return {"email_sent": bool(email.get("sent")), "email": email}


async def respond(ctx: WorkflowContext) -> dict[str, Any]:
    formatted = ctx.result("format_html")
    sent = ctx.result("send_email")
    return {
        "run_id": ctx.get("run_id"),
        "email_sent": sent.get("email_sent", False),
        "itinerary_url": formatted.get("itinerary_url"),
    }


@register("itinerary-basic")
async def itinerary_basic(payload: dict[str, Any]):
    steps = [
        Step("parse_validate", (), parse_validate),
        Step("search_flights", ("parse_validate",), search_flights),
        Step("search_hotels", ("parse_validate",), search_hotels),
        Step("merge", ("search_flights", "search_hotels"), merge),
        Step("generate_itinerary", ("merge",), generate_itinerary),
        Step("format_html", ("generate_itinerary",), format_html),
        Step("send_email", ("format_html",), send_email),
        Step("respond", ("send_email",), respond),
    ]
    async for event in run_dag(steps, payload):
        yield event
