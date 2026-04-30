from __future__ import annotations

from typing import Any
from uuid import uuid4

import httpx

from server.settings import get_settings

from ._shared import ToolDef


def resend_send_email(input: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    if not settings.resend_api_key or not settings.resend_from:
        return {"sent": False, "error": "RESEND_API_KEY and RESEND_FROM are required"}

    to = input.get("to")
    subject = input.get("subject")
    html = input.get("html")
    text = input.get("text")
    if not to or not subject or not (html or text):
        return {"sent": False, "error": "to, subject, and html or text are required"}

    body: dict[str, Any] = {
        "from": input.get("from") or settings.resend_from,
        "to": to if isinstance(to, list) else [to],
        "subject": subject,
    }
    if html:
        body["html"] = html
    if text:
        body["text"] = text

    try:
        with httpx.Client(timeout=20) as client:
            response = client.post(
                "https://api.resend.com/emails",
                json=body,
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Idempotency-Key": str(input.get("idempotency_key") or uuid4()),
                },
            )
        if response.status_code >= 400:
            return {"sent": False, "status": response.status_code, "error": response.text}
        data = response.json()
        return {"sent": True, "id": data.get("id"), "to": body["to"], "source": "resend"}
    except Exception as exc:
        return {"sent": False, "error": str(exc) or "Resend send failed"}


TOOLS: dict[str, ToolDef] = {
    "resend_send_email": ToolDef(
        name="resend_send_email",
        description="Send an email through the Resend API.",
        input_schema={
            "type": "object",
            "properties": {
                "to": {"oneOf": [{"type": "string"}, {"type": "array", "items": {"type": "string"}}]},
                "subject": {"type": "string"},
                "html": {"type": "string"},
                "text": {"type": "string"},
                "idempotency_key": {"type": "string"},
            },
            "required": ["to", "subject"],
        },
        handler=resend_send_email,
    )
}
