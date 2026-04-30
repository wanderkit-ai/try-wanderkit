from __future__ import annotations

import asyncio
import inspect
import json
from collections.abc import AsyncGenerator
from typing import Any

from openai import AsyncOpenAI

from server.agents.base import AgentConfig
from server.agents.tools import to_openai_tools, tools_for
from server.settings import get_settings


def _model_dump(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump(exclude_none=True)
    if isinstance(value, list):
        return [_model_dump(item) for item in value]
    if isinstance(value, dict):
        return {key: _model_dump(item) for key, item in value.items()}
    return value


def _parse_arguments(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return {"_raw": raw}
    return value if isinstance(value, dict) else {"value": value}


class OpenAIAgentRunner:
    def __init__(self, config: AgentConfig):
        self.config = config
        self.tool_defs = tools_for(config.tools)

    async def run(self, history: list[dict[str, str]]) -> AsyncGenerator[dict[str, Any], None]:
        settings = get_settings()
        if not settings.openai_api_key:
            yield {"type": "error", "message": "OPENAI_API_KEY is not set (checked process.env, .env.local, .env)"}
            return

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        conversation: list[dict[str, Any]] = [
            {"role": message["role"], "content": message["content"]}
            for message in history
            if message.get("role") in {"user", "assistant"} and isinstance(message.get("content"), str)
        ]
        tools = to_openai_tools(self.tool_defs)

        safety = 0
        while safety < 8:
            safety += 1
            try:
                params: dict[str, Any] = {
                    "model": settings.openai_model,
                    "messages": [
                        {"role": "system", "content": self.config.system_prompt},
                        *conversation,
                    ],
                    "max_tokens": 1500,
                    "temperature": 0.2,
                }
                if tools:
                    params["tools"] = tools
                    params["tool_choice"] = "auto"
                response = await client.chat.completions.create(**params)
            except Exception as exc:
                yield {"type": "error", "message": str(exc) or "OpenAI API error"}
                return

            choice = response.choices[0] if response.choices else None
            message = choice.message if choice else None
            if not message:
                yield {"type": "error", "message": "OpenAI response did not include a message"}
                return

            text = message.content or ""
            if text:
                yield {"type": "text", "text": text}

            tool_calls = list(message.tool_calls or [])
            assistant_message: dict[str, Any] = {"role": "assistant", "content": text or None}
            if tool_calls:
                assistant_message["tool_calls"] = _model_dump(tool_calls)
            conversation.append(assistant_message)

            if not tool_calls:
                yield {"type": "done"}
                return

            for tool_call in tool_calls:
                name = tool_call.function.name
                input_data = _parse_arguments(tool_call.function.arguments)
                yield {"type": "tool_use", "name": name, "input": input_data}
                result = await self._call_tool(name, input_data)
                yield {"type": "tool_result", "name": name, "result": result}
                conversation.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result, default=str),
                    }
                )

        yield {"type": "error", "message": "Agent exceeded maximum tool-loop depth."}

    async def _call_tool(self, name: str, input: dict[str, Any]) -> Any:
        tool = next((tool for tool in self.tool_defs if tool.name == name), None)
        if not tool:
            return {"error": f"Unknown tool {name}"}
        try:
            if inspect.iscoroutinefunction(tool.handler):
                result = tool.handler(input)
            else:
                result = await asyncio.to_thread(tool.handler, input)
            if inspect.isawaitable(result):
                return await result
            return result
        except Exception as exc:
            return {"error": str(exc) or "Tool failed"}
