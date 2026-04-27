"""CRM read tools — customers and influencers."""

from __future__ import annotations

from typing import Any

from backend.agents.mock_data import CUSTOMERS, INFLUENCERS

from ._shared import ToolDef


def _list_customers(input: dict[str, Any]) -> list[dict[str, Any]]:
    """Return customers, optionally filtered by influencer, status, or interest.

    Most agents call this for context lookups. Budget is formatted as a
    human-readable string so the LLM can use it in chat without doing math.
    """
    influencer_id = input.get("influencer_id")
    status = input.get("status")
    interest = input.get("interest")
    out = []
    for customer in CUSTOMERS:
        if influencer_id and customer.get("influencerId") != influencer_id:
            continue
        if status and customer.get("status") != status:
            continue
        if interest and interest not in customer.get("interests", []):
            continue
        out.append(
            {
                "id": customer["id"],
                "name": customer["name"],
                "email": customer.get("email"),
                "city": customer["city"],
                "country": customer["country"],
                "nationality": customer.get("nationality"),
                "passportExpiry": customer.get("passportExpiry"),
                "age": customer["age"],
                "interests": customer["interests"],
                "budget": f"${customer['budgetMin'] // 100}-${customer['budgetMax'] // 100} pp/day",
                "groupSize": customer["groupSize"],
                "availability": customer["availability"],
                "status": customer["status"],
                "influencer": customer["influencerId"],
            }
        )
    return out


def _list_influencers(_: dict[str, Any]) -> list[dict[str, Any]]:
    """Return all influencers on the platform with niches and regions."""
    return [
        {
            "id": i["id"],
            "name": i["name"],
            "handle": i["handle"],
            "followers": i["followers"],
            "niches": i["niches"],
            "regions": i["regions"],
        }
        for i in INFLUENCERS
    ]


TOOLS: dict[str, ToolDef] = {
    "list_customers": ToolDef(
        name="list_customers",
        description="List customers in the CRM, optionally filtered by influencer, status, or interests.",
        input_schema={
            "type": "object",
            "properties": {
                "influencer_id": {"type": "string"},
                "status": {
                    "type": "string",
                    "enum": ["lead", "briefed", "matched", "paid", "travelling", "returned"],
                },
                "interest": {"type": "string"},
            },
        },
        handler=_list_customers,
    ),
    "list_influencers": ToolDef(
        name="list_influencers",
        description="List travel influencers on the platform.",
        input_schema={"type": "object", "properties": {}},
        handler=_list_influencers,
    ),
}
