from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Any

from openai import AsyncOpenAI

from server.settings import get_settings


def _client() -> AsyncOpenAI:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set (checked process.env, .env.local, .env)")
    return AsyncOpenAI(api_key=settings.openai_api_key)


async def chat(
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]] | None = None,
    model: str | None = None,
    **kwargs: Any,
) -> Any:
    """Run one OpenAI chat-completions request for workflow code."""
    settings = get_settings()
    return await _client().chat.completions.create(
        model=model or settings.openai_model,
        messages=messages,
        tools=tools or None,
        **kwargs,
    )


async def stream_chat(
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]] | None = None,
    model: str | None = None,
    **kwargs: Any,
) -> AsyncGenerator[dict[str, Any], None]:
    """Stream text deltas from an OpenAI chat-completions request."""
    settings = get_settings()
    stream = await _client().chat.completions.create(
        model=model or settings.openai_model,
        messages=messages,
        tools=tools or None,
        stream=True,
        **kwargs,
    )
    async for chunk in stream:
        choice = chunk.choices[0] if chunk.choices else None
        delta = choice.delta if choice else None
        text = getattr(delta, "content", None) if delta else None
        if text:
            yield {"type": "text_delta", "text": text}
        if choice and choice.finish_reason:
            yield {"type": "done", "finish_reason": choice.finish_reason}

