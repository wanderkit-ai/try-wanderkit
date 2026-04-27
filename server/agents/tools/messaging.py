"""Outbound messaging — WhatsApp (with simulated reply) and email."""

from __future__ import annotations

from typing import Any

from backend.agents.mock_data import OPERATORS, find_by_id

from ._shared import ToolDef


def _send_whatsapp(input: dict[str, Any]) -> dict[str, Any]:
    """Simulate sending WhatsApp to an operator and return a mock reply.

    The reply is deterministic per operator (template chosen via hash of id)
    so the same operator always responds in the same voice, which keeps
    multi-turn negotiations coherent across calls.
    """
    operator = find_by_id(OPERATORS, input.get("operator_id"))
    message = str(input.get("message") or "")

    if operator:
        contact = operator.get("contactName", "there")
        company = operator.get("company", "us")
        specialty = (operator.get("specialties") or ["travel"])[0]
        price_tier = operator.get("priceTier", "$$")
        reply_hours = operator.get("responseHours", 12)

        reply_templates = [
            f"Hi! Thanks for reaching out. {company} here — {contact} speaking. "
            f"Yes, we run {specialty} trips in this region. "
            f"Could you send me the exact dates and group size? I'll put together a full quote within 24 hrs.",

            f"Hey! {contact} from {company}. Got your message. "
            f"We'd love to work on this — {specialty} is our bread and butter. "
            f"What's the budget range you're working with? We're {price_tier} tier so should be a good fit.",

            f"Hello! This is {contact} at {company}. "
            f"Received your request — we're available for those dates. "
            f"We'll need pax count, dietary requirements, and any must-haves. "
            f"Our response time is usually under {reply_hours} hours once we have the details.",
        ]

        idx = hash(operator.get("id", "")) % len(reply_templates)
        simulated_reply = reply_templates[idx]
    else:
        simulated_reply = "Hi! Got your message. Can you send more details about the trip dates and group size?"

    return {
        "sent": True,
        "to": operator.get("whatsapp") if operator else "+UNKNOWN",
        "operator": operator.get("company") if operator else input.get("operator_id"),
        "tripId": input.get("trip_id"),
        "preview": message[:120],
        "operatorReply": simulated_reply,
        "replyStatus": "received",
        "note": "[mock] In production this would dispatch via Twilio and receive replies via webhook.",
    }


def _send_email(input: dict[str, Any]) -> dict[str, Any]:
    """Simulate sending an email. In production this would dispatch via Resend."""
    return {
        "sent": True,
        "to": input.get("to"),
        "subject": input.get("subject"),
        "note": "[mock] In production this would dispatch via Resend.",
    }


TOOLS: dict[str, ToolDef] = {
    "send_whatsapp": ToolDef(
        name="send_whatsapp",
        description="Send a WhatsApp message to a local operator and receive their simulated reply.",
        input_schema={
            "type": "object",
            "properties": {
                "operator_id": {"type": "string"},
                "trip_id": {"type": "string"},
                "message": {"type": "string"},
            },
            "required": ["operator_id", "message"],
        },
        handler=_send_whatsapp,
    ),
    "send_email": ToolDef(
        name="send_email",
        description="Send an email to a customer or operator.",
        input_schema={
            "type": "object",
            "properties": {
                "to": {"type": "string"},
                "subject": {"type": "string"},
                "body": {"type": "string"},
            },
            "required": ["to", "subject", "body"],
        },
        handler=_send_email,
    ),
}
