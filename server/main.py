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
from server.agents.runner_openai import OpenAIAgentRunner
from server.routes import leads as leads_routes
from server.routes import search as search_routes
from server.routes import webhooks as webhook_routes
from server.routes import workflows as workflow_routes
from server.scheduler import shutdown_scheduler, start_scheduler
from server.settings import get_settings


settings = get_settings()

app = FastAPI(title="Noma API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(workflow_routes.router)
app.include_router(webhook_routes.router)
app.include_router(leads_routes.router)
app.include_router(search_routes.router)


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
    keys = [
        key
        for key in os.environ
        if any(
            token in key
            for token in (
                "ANTHROPIC",
                "SUPABASE",
                "OPENAI",
                "AMADEUS",
                "SERPAPI",
                "RESEND",
                "TELEGRAM",
                "FIRECRAWL",
                "SLACK",
                "GOOGLE",
                "GSHEETS",
                "TRIPADVISOR",
                "WHATSAPP",
            )
        )
    ]
    return {
        "anthropicLen": len(settings.anthropic_api_key or ""),
        "supabaseLen": len(os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")),
        "connectors": {
            "openai": bool(settings.openai_api_key),
            "amadeus": bool(settings.amadeus_client_id and settings.amadeus_client_secret),
            "serpapi": bool(settings.serpapi_key),
            "resend": bool(settings.resend_api_key and settings.resend_from),
            "telegram": bool(settings.telegram_bot_token),
            "firecrawl": bool(settings.firecrawl_api_key),
            "slack": bool(settings.slack_webhook_url),
            "gsheets": bool(settings.google_service_account_json and settings.gsheets_spreadsheet_id),
            "tripadvisor": bool(settings.tripadvisor_api_key),
            "whatsapp": bool(settings.whatsapp_access_token and settings.whatsapp_phone_number_id),
        },
        "keys": keys,
    }


@app.on_event("startup")
async def startup() -> None:
    start_scheduler()


@app.on_event("shutdown")
async def shutdown() -> None:
    shutdown_scheduler()


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
        runner = OpenAIAgentRunner(agent) if agent.runner == "openai" else AgentRunner(agent)
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
