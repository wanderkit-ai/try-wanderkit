from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime
from typing import Any

from server.agents.tools.email_resend import resend_send_email
from server.agents.tools.gsheets import sheet_read_rows, sheet_update_cell
from server.llm.openai_client import chat
from server.settings import get_settings
from server.storage import jsonstore
from server.workflows.base import Step, WorkflowContext, run_dag
from server.workflows.registry import register


def _now() -> str:
    return datetime.now(UTC).isoformat()


async def read_lead(ctx: WorkflowContext) -> dict[str, Any]:
    lead_id: str = ctx.get("lead_id", "")
    if not lead_id:
        raise ValueError("lead_id is required")

    rows = jsonstore.read("leads")
    lead = next((r for r in rows if str(r.get("id")) == str(lead_id)), None)
    if not lead:
        raise ValueError(f"Lead {lead_id} not found")
    if lead.get("status") == "sent":
        raise ValueError(f"Lead {lead_id} has already been emailed (status=sent)")
    if not lead.get("email"):
        raise ValueError(f"Lead {lead_id} has no email address")

    return {"lead": lead}


async def compose_email(ctx: WorkflowContext) -> dict[str, Any]:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required")

    lead: dict[str, Any] = ctx.result("read_lead")["lead"]

    response = await chat(
        [
            {
                "role": "system",
                "content": (
                    "You are a travel business development specialist. Write a concise, personalized "
                    "cold outreach email for the Noma travel CRM platform. "
                    "Keep the subject under 10 words. Keep the body under 150 words. "
                    "Focus on how Noma can help them manage travel clients better. "
                    "Return strict JSON only."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "schema": {"subject": "string", "body_html": "string", "body_text": "string"},
                        "lead": {
                            "company": lead.get("company", ""),
                            "contact_name": lead.get("contact_name", ""),
                            "description": lead.get("description", ""),
                            "website": lead.get("website", ""),
                        },
                    }
                ),
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=600,
    )
    content = response.choices[0].message.content or "{}"
    email_draft = json.loads(content)
    return {
        "subject": email_draft.get("subject", f"Noma for {lead.get('company', 'your business')}"),
        "body_html": email_draft.get("body_html", ""),
        "body_text": email_draft.get("body_text", ""),
    }


async def send_email(ctx: WorkflowContext) -> dict[str, Any]:
    lead: dict[str, Any] = ctx.result("read_lead")["lead"]
    draft = ctx.result("compose_email")

    result = await asyncio.to_thread(
        resend_send_email,
        {
            "to": lead["email"],
            "subject": draft["subject"],
            "html": draft["body_html"],
            "text": draft.get("body_text", ""),
            "idempotency_key": f"cold-email-{ctx.get('run_id')}-{lead['id']}",
        },
    )
    jsonstore.append(
        "email_log",
        {
            "workflow": "cold-email",
            "run_id": ctx.get("run_id"),
            "lead_id": lead["id"],
            "to": lead["email"],
            "subject": draft["subject"],
            "sent": bool(result.get("sent")),
            "provider_id": result.get("id"),
            "error": result.get("error"),
            "created_at": _now(),
        },
    )
    return {"email_sent": bool(result.get("sent")), "email_result": result}


async def mark_sent(ctx: WorkflowContext) -> dict[str, Any]:
    lead: dict[str, Any] = ctx.result("read_lead")["lead"]
    email_sent: bool = ctx.result("send_email").get("email_sent", False)

    if not email_sent:
        return {"marked": False, "reason": "email not sent"}

    sent_at = _now()
    updated = jsonstore.update("leads", lead["id"], {"status": "sent", "sent_at": sent_at})

    # GSheets update is best-effort
    settings = get_settings()
    sheet_updated = False
    if settings.gsheets_spreadsheet_id and settings.google_service_account_json:
        try:
            existing_rows = await asyncio.to_thread(sheet_read_rows, {"range": "Leads!A:A"})
            rows_list: list[list[Any]] = existing_rows.get("rows", [])
            row_index = next(
                (i + 1 for i, row in enumerate(rows_list) if row and str(row[0]) == str(lead["id"])),
                None,
            )
            if row_index:
                # Column H is status (index 8), column I is sent_at (index 9) — 1-based
                await asyncio.to_thread(
                    sheet_update_cell,
                    {"cell": f"Leads!H{row_index}", "value": "sent"},
                )
                await asyncio.to_thread(
                    sheet_update_cell,
                    {"cell": f"Leads!I{row_index}", "value": sent_at},
                )
                sheet_updated = True
        except Exception:
            pass

    return {"marked": True, "status": updated.get("status"), "sheet_updated": sheet_updated}


async def respond(ctx: WorkflowContext) -> dict[str, Any]:
    lead: dict[str, Any] = ctx.result("read_lead")["lead"]
    sent = ctx.result("send_email")
    marked = ctx.result("mark_sent")
    return {
        "run_id": ctx.get("run_id"),
        "lead_id": lead["id"],
        "email": lead["email"],
        "email_sent": sent.get("email_sent", False),
        "status": "sent" if sent.get("email_sent") else "failed",
        "marked_in_store": marked.get("marked", False),
    }


@register("cold-email")
async def cold_email(payload: dict[str, Any]):
    steps = [
        Step("read_lead", (), read_lead),
        Step("compose_email", ("read_lead",), compose_email),
        Step("send_email", ("compose_email",), send_email),
        Step("mark_sent", ("send_email",), mark_sent),
        Step("respond", ("mark_sent",), respond),
    ]
    async for event in run_dag(steps, payload):
        yield event
