from __future__ import annotations

from typing import Any

import httpx

from server.settings import get_settings

from ._shared import ToolDef


def telegram_send_message(input: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    if not settings.telegram_bot_token:
        return {"sent": False, "error": "TELEGRAM_BOT_TOKEN is required"}

    chat_id = input.get("chat_id")
    text = input.get("text")
    if not chat_id or not text:
        return {"sent": False, "error": "chat_id and text are required"}

    body: dict[str, Any] = {
        "chat_id": chat_id,
        "text": text,
        "disable_web_page_preview": bool(input.get("disable_web_page_preview", True)),
    }
    if input.get("parse_mode"):
        body["parse_mode"] = input["parse_mode"]

    try:
        with httpx.Client(timeout=20) as client:
            response = client.post(
                f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
                json=body,
            )
        if response.status_code >= 400:
            return {"sent": False, "status": response.status_code, "error": response.text}
        payload = response.json()
        return {
            "sent": bool(payload.get("ok")),
            "message_id": payload.get("result", {}).get("message_id"),
            "chat_id": chat_id,
            "source": "telegram",
        }
    except Exception as exc:
        return {"sent": False, "error": str(exc) or "Telegram send failed"}


TOOLS: dict[str, ToolDef] = {
    "telegram_send_message": ToolDef(
        name="telegram_send_message",
        description="Send a text message to a Telegram chat.",
        input_schema={
            "type": "object",
            "properties": {
                "chat_id": {"type": "string"},
                "text": {"type": "string"},
                "parse_mode": {"type": "string", "enum": ["Markdown", "MarkdownV2", "HTML"]},
                "disable_web_page_preview": {"type": "boolean"},
            },
            "required": ["chat_id", "text"],
        },
        handler=telegram_send_message,
    )
}

