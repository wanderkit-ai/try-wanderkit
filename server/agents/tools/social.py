"""Social tools — group-mate matching across the customer base."""

from __future__ import annotations

from typing import Any

from backend.agents.mock_data import CUSTOMERS, find_by_id

from ._shared import ToolDef


def _find_compatible_customers(input: dict[str, Any]) -> dict[str, Any]:
    """Find customers compatible with a seed customer.

    Compatibility = at least one shared interest, at least one overlapping
    season of availability, and age within max_age_diff. Sorted by most
    shared interests, then most shared seasons, then closest in age. Caps
    at 5 results so the agent's output stays focused.
    """
    seed = find_by_id(CUSTOMERS, input.get("customer_id"))
    if not seed:
        return {"error": "Customer not found"}

    max_age_diff = input.get("max_age_diff", 8)
    matches = []
    for customer in CUSTOMERS:
        if customer["id"] == seed["id"]:
            continue
        shared_interests = [i for i in customer["interests"] if i in seed["interests"]]
        shared_seasons = [s for s in customer["availability"] if s in seed["availability"]]
        age_delta = abs(customer["age"] - seed["age"])
        if shared_interests and shared_seasons and age_delta <= max_age_diff:
            matches.append(
                {
                    "id": customer["id"],
                    "name": customer["name"],
                    "age": customer["age"],
                    "city": customer["city"],
                    "sharedInterests": shared_interests,
                    "sharedSeasons": shared_seasons,
                    "_score": (-len(shared_interests), -len(shared_seasons), age_delta),
                }
            )
    matches.sort(key=lambda m: m.pop("_score"))
    return {"seed": {"id": seed["id"], "name": seed["name"]}, "matches": matches[:5]}


TOOLS: dict[str, ToolDef] = {
    "find_compatible_customers": ToolDef(
        name="find_compatible_customers",
        description="Find customers with overlapping interests, dates, age, and group size.",
        input_schema={
            "type": "object",
            "properties": {
                "customer_id": {"type": "string"},
                "max_age_diff": {"type": "number", "default": 8},
            },
            "required": ["customer_id"],
        },
        handler=_find_compatible_customers,
    ),
}
