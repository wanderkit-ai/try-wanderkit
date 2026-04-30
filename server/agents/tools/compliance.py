"""Compliance tools — visa research and per-customer document checklists."""

from __future__ import annotations

from typing import Any

from backend.agents.mock_data import (
    CUSTOMERS,
    DOC_CHECKLISTS,
    TRIPS,
    VISA_REQUIREMENTS,
    find_by_id,
)

from ._shared import ToolDef


def _country_of(destination: str) -> str:
    """Best-effort country extraction from a destination string.

    Trip destinations look like 'Annapurna, Nepal' or 'Morocco' — we want
    just the country part for VISA_REQUIREMENTS lookup.
    """
    if "," in destination:
        return destination.split(",")[-1].strip()
    return destination.strip()


def _research_visa_requirements(input: dict[str, Any]) -> dict[str, Any]:
    """Look up visa, passport, and vaccination requirements for a corridor.

    Returns the matching VISA_REQUIREMENTS row, or a "research required" stub
    for unknown corridors so the agent can surface that gap to the human.
    """
    nationality = (input.get("nationality") or "").strip()
    destination = (input.get("destination") or "").strip()
    if not nationality or not destination:
        return {"error": "nationality and destination are required"}

    country = _country_of(destination)
    key = (nationality, country)
    entry = VISA_REQUIREMENTS.get(key)
    if entry:
        return {
            "nationality": nationality,
            "destination": country,
            **entry,
            "source": "[mock] Noma visa table",
        }
    return {
        "nationality": nationality,
        "destination": country,
        "visaRequired": None,
        "note": (
            f"[mock] No record for {nationality} → {country}. "
            "Human should confirm with the embassy or a visa service."
        ),
    }


def _required_doc_types(visa: dict[str, Any]) -> list[str]:
    """Translate a visa-requirements row into a per-trip doc checklist."""
    docs = ["Passport (photo page)"]
    if visa.get("visaRequired"):
        docs.append(f"Visa: {visa.get('visaType', 'tourist visa')}")
    if visa.get("passportValidity"):
        docs.append("Passport validity confirmation (6+ months past return)")
    for v in visa.get("vaccinations", []) or []:
        docs.append(f"Vaccination: {v}")
    docs.append("Travel insurance certificate")
    return docs


def _create_doc_checklist(input: dict[str, Any]) -> dict[str, Any]:
    """Build a per-customer doc checklist for a trip and persist it.

    Looks up the customer's nationality + the trip's destination, runs visa
    research, then writes the checklist to DOC_CHECKLISTS keyed by (cus,trip).
    """
    customer_id = input.get("customer_id")
    trip_id = input.get("trip_id")
    customer = find_by_id(CUSTOMERS, customer_id)
    trip = find_by_id(TRIPS, trip_id)
    if not customer:
        return {"error": f"Customer {customer_id} not found"}
    if not trip:
        return {"error": f"Trip {trip_id} not found"}

    visa = _research_visa_requirements(
        {"nationality": customer.get("nationality"), "destination": trip.get("destination", "")}
    )

    items = [
        {"docType": doc_type, "status": "missing", "uploadedFilename": None, "uploadedUrl": None}
        for doc_type in _required_doc_types(visa)
    ]
    DOC_CHECKLISTS[(customer_id, trip_id)] = items

    return {
        "customerId": customer_id,
        "tripId": trip_id,
        "checklist": items,
        "visa": visa,
        "note": "[mock] Checklist saved on the customer/trip pair.",
    }


TOOLS: dict[str, ToolDef] = {
    "research_visa_requirements": ToolDef(
        name="research_visa_requirements",
        description=(
            "Look up visa, passport validity, and vaccination requirements "
            "for a (nationality, destination) corridor."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "nationality": {"type": "string", "description": "Customer's passport nationality."},
                "destination": {"type": "string", "description": "Country or 'City, Country' string."},
            },
            "required": ["nationality", "destination"],
        },
        handler=_research_visa_requirements,
    ),
    "create_doc_checklist": ToolDef(
        name="create_doc_checklist",
        description="Generate and save a document checklist for a customer's specific trip.",
        input_schema={
            "type": "object",
            "properties": {
                "customer_id": {"type": "string"},
                "trip_id": {"type": "string"},
            },
            "required": ["customer_id", "trip_id"],
        },
        handler=_create_doc_checklist,
    ),
}
