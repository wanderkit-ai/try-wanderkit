"""Customer document storage — upload + list. Mock URLs only."""

from __future__ import annotations

import random
import string
from datetime import datetime
from typing import Any

from backend.agents.mock_data import CUSTOMERS, DOC_CHECKLISTS, find_by_id

from ._shared import ToolDef


def _mock_url() -> str:
    """Return a fake hosted-document URL. Real impl would use S3 or similar."""
    token = "".join(random.choice(string.ascii_lowercase + string.digits) for _ in range(12))
    return f"https://docs.noma.mock/{token}.pdf"


def _upload_document(input: dict[str, Any]) -> dict[str, Any]:
    """Record an "uploaded" document on the customer and mark its checklist item.

    Updates two places so the UI and the agent see consistent state:
    1. The customer's documents[] list (shown on customer detail page).
    2. The matching DOC_CHECKLISTS row (if a trip_id is provided).
    """
    customer_id = input.get("customer_id")
    doc_type = input.get("doc_type")
    filename = input.get("filename") or "document.pdf"
    trip_id = input.get("trip_id")

    customer = find_by_id(CUSTOMERS, customer_id)
    if not customer:
        return {"error": f"Customer {customer_id} not found"}
    if not doc_type:
        return {"error": "doc_type is required"}

    url = _mock_url()
    record = {
        "docType": doc_type,
        "filename": filename,
        "url": url,
        "uploadedAt": datetime.utcnow().isoformat() + "Z",
        "status": "uploaded",
    }
    customer.setdefault("documents", []).append(record)

    if trip_id:
        items = DOC_CHECKLISTS.get((customer_id, trip_id), [])
        for item in items:
            if item["docType"] == doc_type and item["status"] == "missing":
                item["status"] = "uploaded"
                item["uploadedFilename"] = filename
                item["uploadedUrl"] = url
                break

    return {
        "customerId": customer_id,
        "doc": record,
        "tripId": trip_id,
        "note": "[mock] Real uploads would go to S3 with a signed URL flow.",
    }


def _list_customer_documents(input: dict[str, Any]) -> dict[str, Any]:
    """Return uploaded documents plus the active checklist (if a trip is given)."""
    customer_id = input.get("customer_id")
    trip_id = input.get("trip_id")
    customer = find_by_id(CUSTOMERS, customer_id)
    if not customer:
        return {"error": f"Customer {customer_id} not found"}

    return {
        "customerId": customer_id,
        "documents": customer.get("documents", []),
        "checklist": DOC_CHECKLISTS.get((customer_id, trip_id), []) if trip_id else [],
    }


TOOLS: dict[str, ToolDef] = {
    "upload_document": ToolDef(
        name="upload_document",
        description=(
            "Record a customer's uploaded document (passport, visa, vaccination cert, etc). "
            "Marks the matching checklist item complete if trip_id is given."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "customer_id": {"type": "string"},
                "doc_type": {"type": "string"},
                "filename": {"type": "string"},
                "trip_id": {"type": "string"},
            },
            "required": ["customer_id", "doc_type"],
        },
        handler=_upload_document,
    ),
    "list_customer_documents": ToolDef(
        name="list_customer_documents",
        description="List a customer's uploaded documents, plus their checklist for a trip if given.",
        input_schema={
            "type": "object",
            "properties": {
                "customer_id": {"type": "string"},
                "trip_id": {"type": "string"},
            },
            "required": ["customer_id"],
        },
        handler=_list_customer_documents,
    ),
}
