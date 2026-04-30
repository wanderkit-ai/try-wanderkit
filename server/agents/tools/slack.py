from __future__ import annotations

from typing import Any

import httpx

from server.agents.tools._shared import ToolDef
from server.settings import get_settings


def slack_post_webhook(params: dict[str, Any]) -> dict[str, Any]:
    """Post a message to a Slack channel via incoming webhook."""
    settings = get_settings()
    if not settings.slack_webhook_url:
        return {"sent": False, "error": "SLACK_WEBHOOK_URL is not configured"}

    text: str = params.get("text", "")
    blocks: list[dict[str, Any]] | None = params.get("blocks")

    payload: dict[str, Any] = {}
    if text:
        payload["text"] = text
    if blocks:
        payload["blocks"] = blocks
    if not payload:
        return {"sent": False, "error": "Either text or blocks is required"}

    try:
        resp = httpx.post(
            settings.slack_webhook_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        resp.raise_for_status()
        return {"sent": True}
    except httpx.HTTPStatusError as exc:
        return {"sent": False, "error": f"Slack webhook {exc.response.status_code}: {exc.response.text[:200]}"}
    except Exception as exc:
        return {"sent": False, "error": str(exc)}


TOOLS: dict[str, ToolDef] = {
    "slack_post_webhook": ToolDef(
        name="slack_post_webhook",
        description="Post a notification or summary message to a Slack channel via incoming webhook.",
        input_schema={
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "Plain text fallback message",
                },
                "blocks": {
                    "type": "array",
                    "description": "Optional Slack Block Kit blocks for richer formatting",
                    "items": {"type": "object"},
                },
            },
        },
        handler=slack_post_webhook,
    ),
}
