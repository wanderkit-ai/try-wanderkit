from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request

from server.agents.registry import get_agent
from server.agents.runner_openai import OpenAIAgentRunner
from server.agents.tools.telegram import telegram_send_message
from server.workflows import memory


router = APIRouter()


def _extract_telegram_message(update: dict[str, Any]) -> tuple[str | None, str | None]:
    message = update.get("message") or update.get("edited_message") or {}
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    text = message.get("text")
    if chat_id is None or not isinstance(text, str) or not text.strip():
        return None, None
    return str(chat_id), text.strip()


@router.post("/api/webhooks/telegram")
async def telegram_webhook(update: dict[str, Any]) -> dict[str, Any]:
    chat_id, text = _extract_telegram_message(update)
    if not chat_id or not text:
        return {"ok": True, "ignored": True}

    agent = get_agent("telegram_bot")
    if not agent:
        raise HTTPException(status_code=500, detail="telegram_bot agent is not registered")

    memory.append(chat_id, "user", text)
    history = memory.get_history(chat_id)
    runner = OpenAIAgentRunner(agent)
    final_text_parts: list[str] = []
    sent_by_tool = False

    async for event in runner.run(history):
        if event.get("type") == "text":
            final_text_parts.append(event.get("text", ""))
        elif event.get("type") == "tool_result" and event.get("name") == "telegram_send_message":
            result = event.get("result") or {}
            sent_by_tool = bool(result.get("sent"))
        elif event.get("type") == "error":
            final_text_parts = [f"Sorry, I hit a snag: {event.get('message', 'failed')}"]
            break

    final_text = "".join(final_text_parts).strip()
    send_result: dict[str, Any] | None = None
    if final_text:
        memory.append(chat_id, "assistant", final_text)
        if not sent_by_tool:
            send_result = telegram_send_message({"chat_id": chat_id, "text": final_text})

    memory.flush_to_jsonstore()
    return {"ok": True, "chat_id": chat_id, "sent": bool(sent_by_tool or (send_result or {}).get("sent"))}


@router.post("/api/webhooks/whatsapp")
async def whatsapp_webhook(_: Request) -> dict[str, Any]:
    return {"ok": True, "deferred": "WhatsApp is scheduled for phase 6"}
