from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from typing import Any

from anthropic import AsyncAnthropic

from server.agents.base import AgentConfig
from server.agents.tools import ToolDef, to_anthropic_tools, tools_for
from server.settings import get_settings


def _block_to_dict(block: Any) -> dict[str, Any]:
    if hasattr(block, "model_dump"):
        return block.model_dump(exclude_none=True)
    if isinstance(block, dict):
        return block
    return dict(block)


class AgentRunner:
    def __init__(self, config: AgentConfig):
        self.config = config
        self.tool_defs = tools_for(config.tools)

    async def run(self, history: list[dict[str, str]]) -> AsyncGenerator[dict[str, Any], None]:
        settings = get_settings()
        if not settings.anthropic_api_key:
            yield {"type": "error", "message": "ANTHROPIC_API_KEY is not set (checked process.env, .env.local, .env)"}
            return

        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        conversation: list[dict[str, Any]] = [
            {"role": message["role"], "content": message["content"]}
            for message in history
            if message.get("role") in {"user", "assistant"} and isinstance(message.get("content"), str)
        ]
        tools = to_anthropic_tools(self.tool_defs)

        safety = 0
        while safety < 8:
            safety += 1
            try:
                response = await client.messages.create(
                    model=settings.anthropic_model,
                    max_tokens=1500,
                    system=self.config.system_prompt,
                    tools=tools or None,
                    messages=conversation,
                )
            except Exception as exc:
                yield {"type": "error", "message": str(exc) or "Anthropic API error"}
                return

            assistant_blocks: list[dict[str, Any]] = []
            tool_uses: list[dict[str, Any]] = []

            for block in response.content:
                item = _block_to_dict(block)
                if item.get("type") == "text":
                    assistant_blocks.append({"type": "text", "text": item.get("text", "")})
                    yield {"type": "text", "text": item.get("text", "")}
                elif item.get("type") == "tool_use":
                    assistant_blocks.append(item)
                    tool_uses.append(
                        {
                            "id": item.get("id"),
                            "name": item.get("name"),
                            "input": item.get("input") or {},
                        }
                    )
                    yield {"type": "tool_use", "name": item.get("name"), "input": item.get("input") or {}}

            conversation.append({"role": "assistant", "content": assistant_blocks})

            if response.stop_reason != "tool_use" or not tool_uses:
                yield {"type": "done"}
                return

            tool_results = []
            for tool_use in tool_uses:
                result = await self._call_tool(tool_use["name"], tool_use["input"])
                yield {"type": "tool_result", "name": tool_use["name"], "result": result}
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_use["id"],
                        "content": json.dumps(result),
                    }
                )

            conversation.append({"role": "user", "content": tool_results})

        yield {"type": "error", "message": "Agent exceeded maximum tool-loop depth."}

    async def _call_tool(self, name: str, input: dict[str, Any]) -> Any:
        tool = next((tool for tool in self.tool_defs if tool.name == name), None)
        if not tool:
            return {"error": f"Unknown tool {name}"}
        try:
            return tool.handler(input)
        except Exception as exc:
            return {"error": str(exc) or "Tool failed"}
