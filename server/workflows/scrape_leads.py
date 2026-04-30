from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime
from typing import Any

from server.agents.tools.gsheets import sheet_append_rows
from server.agents.tools.scrape_firecrawl import firecrawl_scrape
from server.llm.openai_client import chat
from server.settings import get_settings
from server.storage import jsonstore
from server.workflows.base import Step, WorkflowContext, run_dag
from server.workflows.registry import register


def _now() -> str:
    return datetime.now(UTC).isoformat()


async def scrape_url(ctx: WorkflowContext) -> dict[str, Any]:
    target_url: str = ctx.get("target_url", "")
    if not target_url:
        raise ValueError("target_url is required")

    result = await asyncio.to_thread(firecrawl_scrape, {"url": target_url})
    if result.get("error"):
        raise RuntimeError(f"Firecrawl error: {result['error']}")
    return {"markdown": result.get("markdown", ""), "source_url": target_url}


async def standardise(ctx: WorkflowContext) -> dict[str, Any]:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required")

    markdown: str = ctx.result("scrape_url")["markdown"]
    if not markdown.strip():
        return {"raw_leads": []}

    response = await chat(
        [
            {
                "role": "system",
                "content": (
                    "You are a lead extraction assistant. Given scraped website content, "
                    "extract all business contacts you can find. Return strict JSON only."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "schema": {
                            "leads": [
                                {
                                    "company": "string",
                                    "contact_name": "string or null",
                                    "email": "string or null",
                                    "phone": "string or null",
                                    "website": "string or null",
                                    "description": "string or null",
                                }
                            ]
                        },
                        "content": markdown[:6000],
                        "source_url": ctx.result("scrape_url").get("source_url", ""),
                    }
                ),
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
        max_tokens=2000,
    )
    content = response.choices[0].message.content or "{}"
    parsed = json.loads(content)
    return {"raw_leads": parsed.get("leads", [])}


async def dedupe(ctx: WorkflowContext) -> dict[str, Any]:
    raw_leads: list[dict[str, Any]] = ctx.result("standardise").get("raw_leads", [])
    existing = jsonstore.read("leads")
    existing_emails = {row.get("email", "").lower() for row in existing if row.get("email")}

    new_leads = []
    for lead in raw_leads:
        email = (lead.get("email") or "").lower().strip()
        if email and email in existing_emails:
            continue
        if email:
            existing_emails.add(email)
        new_leads.append(lead)

    return {"new_leads": new_leads, "dupes_skipped": len(raw_leads) - len(new_leads)}


async def append_sheet(ctx: WorkflowContext) -> dict[str, Any]:
    new_leads: list[dict[str, Any]] = ctx.result("dedupe").get("new_leads", [])
    source_url: str = ctx.result("scrape_url").get("source_url", "")

    if not new_leads:
        return {"saved": 0, "sheet_appended": 0}

    saved_ids: list[str] = []
    rows_for_sheet: list[list[Any]] = []

    for lead in new_leads:
        stored = jsonstore.append(
            "leads",
            {
                "company": lead.get("company", ""),
                "contact_name": lead.get("contact_name", ""),
                "email": lead.get("email", ""),
                "phone": lead.get("phone", ""),
                "website": lead.get("website", ""),
                "description": lead.get("description", ""),
                "source_url": source_url,
                "status": "new",
                "created_at": _now(),
            },
        )
        saved_ids.append(stored["id"])
        rows_for_sheet.append([
            stored["id"],
            lead.get("company", ""),
            lead.get("contact_name", ""),
            lead.get("email", ""),
            lead.get("phone", ""),
            lead.get("website", ""),
            source_url,
            "new",
            _now(),
        ])

    # Sheet append is best-effort — don't fail the workflow if GSheets is unconfigured
    sheet_result = await asyncio.to_thread(
        sheet_append_rows,
        {"rows": rows_for_sheet, "range": "Leads!A1"},
    )
    sheet_appended = sheet_result.get("appended", 0)

    return {"saved": len(saved_ids), "lead_ids": saved_ids, "sheet_appended": sheet_appended}


@register("scrape-leads")
async def scrape_leads(payload: dict[str, Any]):
    steps = [
        Step("scrape_url", (), scrape_url),
        Step("standardise", ("scrape_url",), standardise),
        Step("dedupe", ("standardise",), dedupe),
        Step("append_sheet", ("dedupe",), append_sheet),
    ]
    async for event in run_dag(steps, payload):
        yield event


async def run_scheduled_scrape() -> None:
    """Cron entry point — calls the DAG with the configured target URL."""
    settings = get_settings()
    target_url = getattr(settings, "scrape_target_url", None) or ""
    if not target_url:
        return

    from server.storage import jsonstore as _js
    from uuid import uuid4
    from datetime import UTC, datetime

    run_id = uuid4().hex
    _js.append(
        "workflow_runs",
        {
            "id": run_id,
            "workflow": "scrape-leads",
            "status": "running",
            "started_at": datetime.now(UTC).isoformat(),
            "finished_at": None,
            "error": None,
        },
    )
    status = "success"
    error: str | None = None
    try:
        async for _ in scrape_leads({"target_url": target_url, "run_id": run_id}):
            pass
    except Exception as exc:
        status = "error"
        error = str(exc)
    finally:
        _js.update(
            "workflow_runs",
            run_id,
            {"status": status, "finished_at": datetime.now(UTC).isoformat(), "error": error},
        )
