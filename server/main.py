from __future__ import annotations

import json
import os
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.agents.mock_data import CUSTOMERS, INFLUENCERS, OPERATORS, QUOTES, TRIPS
from server.agents.registry import AGENT_LIST, get_agent
from server.agents.runner import AgentRunner
from server.settings import get_settings


settings = get_settings()

app = FastAPI(title="Wanderkit API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AgentRunRequest(BaseModel):
    messages: list[ChatMessage] = Field(default_factory=list)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/debug/env")
async def debug_env() -> dict[str, object]:
    keys = [key for key in os.environ if "ANTHROPIC" in key or "SUPABASE" in key]
    return {
        "anthropicLen": len(settings.anthropic_api_key or ""),
        "supabaseLen": len(os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")),
        "keys": keys,
    }


@app.get("/api/agents")
async def list_agents() -> list[dict]:
    return [agent.public() for agent in AGENT_LIST]


@app.post("/api/agents/{agent_name}")
async def run_agent(agent_name: str, body: AgentRunRequest) -> StreamingResponse:
    agent = get_agent(agent_name)
    if not agent:
        raise HTTPException(status_code=404, detail="Unknown agent")
    if not body.messages:
        raise HTTPException(status_code=400, detail="messages array required")

    async def events():
        runner = AgentRunner(agent)
        async for event in runner.run([message.model_dump() for message in body.messages]):
            yield f"data: {json.dumps(event)}\n\n"
            if event.get("type") in {"done", "error"}:
                break

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    )


@app.get("/api/data")
async def data() -> dict[str, list[dict]]:
    return {
        "customers": CUSTOMERS,
        "influencers": INFLUENCERS,
        "operators": OPERATORS,
        "trips": TRIPS,
        "quotes": QUOTES,
    }


class UploadDocumentRequest(BaseModel):
    doc_type: str
    filename: str = "document.pdf"
    trip_id: str | None = None


@app.post("/api/customers/{customer_id}/documents")
async def upload_customer_document(customer_id: str, body: UploadDocumentRequest) -> dict:
    from server.agents.tools.documents import _upload_document
    return _upload_document({
        "customer_id": customer_id,
        "doc_type": body.doc_type,
        "filename": body.filename,
        "trip_id": body.trip_id,
    })
