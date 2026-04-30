from __future__ import annotations

from fastapi import APIRouter, HTTPException

from server.storage import jsonstore


router = APIRouter()


@router.get("/api/leads")
async def list_leads() -> list[dict]:
    return jsonstore.read("leads")


@router.get("/api/leads/{lead_id}")
async def get_lead(lead_id: str) -> dict:
    rows = jsonstore.read("leads")
    lead = next((r for r in rows if str(r.get("id")) == lead_id), None)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead
