"""Direct lodging bookings — Airbnb / hotel / VRBO holds (Stripe disabled)."""

from __future__ import annotations

import random
import string
from typing import Any

from ._shared import ToolDef


def _book_lodging(input: dict[str, Any]) -> dict[str, Any]:
    """Hold a lodging property without charging.

    Stripe is intentionally disabled in this environment. Returns a fake
    confirmation code so downstream tools/UI have something to display.
    """
    token = "".join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    return {
        "booked": True,
        "confirmation": f"WK-{token}",
        **input,
        "note": "[mock] Stripe is intentionally disabled in this environment.",
    }


TOOLS: dict[str, ToolDef] = {
    "book_lodging": ToolDef(
        name="book_lodging",
        description="Book direct lodging.",
        input_schema={
            "type": "object",
            "properties": {
                "provider": {"type": "string", "enum": ["airbnb", "hotel", "vrbo"]},
                "property_id": {"type": "string"},
                "check_in": {"type": "string"},
                "check_out": {"type": "string"},
                "guests": {"type": "number"},
                "total_usd": {"type": "number"},
            },
            "required": ["provider", "property_id", "check_in", "check_out", "guests"],
        },
        handler=_book_lodging,
    ),
}
