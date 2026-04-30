"""Payments — invoice creation, charges, refunds. Stripe is intentionally off."""

from __future__ import annotations

import random
import string
import time
from typing import Any

from backend.agents.mock_data import INVOICES

from ._shared import ToolDef


def _token(prefix: str) -> str:
    """Generate a Stripe-ish opaque id like 'in_AB12CDEF'."""
    body = "".join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    return f"{prefix}_{body}"


def _find_invoice(invoice_id: str) -> dict[str, Any] | None:
    return next((i for i in INVOICES if i["id"] == invoice_id), None)


def _create_invoice(input: dict[str, Any]) -> dict[str, Any]:
    """Create an open invoice on a customer for a trip. Stored in INVOICES."""
    customer_id = input.get("customer_id")
    trip_id = input.get("trip_id")
    amount = float(input.get("amount_usd") or 0)
    if not customer_id or not trip_id or amount <= 0:
        return {"error": "customer_id, trip_id, and positive amount_usd required"}

    invoice = {
        "id": _token("in"),
        "customerId": customer_id,
        "tripId": trip_id,
        "amountUsd": amount,
        "lineItems": input.get("line_items") or [],
        "status": "open",
        "url": f"https://invoices.noma.mock/{_token('inv')}",
        "createdAt": int(time.time()),
        "chargeId": None,
        "refundedUsd": 0.0,
    }
    INVOICES.append(invoice)
    return {**invoice, "note": "[mock] Stripe disabled. Invoice is held only."}


def _charge_customer(input: dict[str, Any]) -> dict[str, Any]:
    """Mark an invoice as paid. No real money moves."""
    invoice_id = input.get("invoice_id")
    invoice = _find_invoice(invoice_id) if invoice_id else None
    if not invoice:
        return {"error": f"Invoice {invoice_id} not found"}
    if invoice["status"] == "paid":
        return {"error": "Invoice already paid", "invoice": invoice}

    invoice["status"] = "paid"
    invoice["chargeId"] = _token("ch")
    return {
        "paid": True,
        "chargeId": invoice["chargeId"],
        "invoiceId": invoice["id"],
        "amountUsd": invoice["amountUsd"],
        "note": "[mock] Stripe disabled. No real money moved.",
    }


def _refund_customer(input: dict[str, Any]) -> dict[str, Any]:
    """Refund a previously-paid invoice (full or partial)."""
    invoice_id = input.get("invoice_id")
    invoice = _find_invoice(invoice_id) if invoice_id else None
    if not invoice:
        return {"error": f"Invoice {invoice_id} not found"}
    if invoice["status"] != "paid":
        return {"error": "Cannot refund an unpaid invoice"}

    requested = input.get("amount_usd")
    refund_amount = float(requested) if requested is not None else float(invoice["amountUsd"])
    if refund_amount <= 0 or refund_amount > invoice["amountUsd"] - invoice["refundedUsd"]:
        return {"error": "Refund amount exceeds remaining charge"}

    invoice["refundedUsd"] += refund_amount
    if invoice["refundedUsd"] >= invoice["amountUsd"]:
        invoice["status"] = "refunded"
    return {
        "refunded": True,
        "refundId": _token("re"),
        "invoiceId": invoice["id"],
        "amountUsd": refund_amount,
        "newStatus": invoice["status"],
        "note": "[mock] Stripe disabled.",
    }


TOOLS: dict[str, ToolDef] = {
    "create_invoice": ToolDef(
        name="create_invoice",
        description="Create an open invoice for a customer/trip. Stripe is mocked.",
        input_schema={
            "type": "object",
            "properties": {
                "customer_id": {"type": "string"},
                "trip_id": {"type": "string"},
                "amount_usd": {"type": "number"},
                "line_items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string"},
                            "amountUsd": {"type": "number"},
                        },
                    },
                },
            },
            "required": ["customer_id", "trip_id", "amount_usd"],
        },
        handler=_create_invoice,
    ),
    "charge_customer": ToolDef(
        name="charge_customer",
        description="Mark an invoice as paid (mock charge — no real Stripe call).",
        input_schema={
            "type": "object",
            "properties": {"invoice_id": {"type": "string"}},
            "required": ["invoice_id"],
        },
        handler=_charge_customer,
    ),
    "refund_customer": ToolDef(
        name="refund_customer",
        description="Refund a paid invoice (full or partial).",
        input_schema={
            "type": "object",
            "properties": {
                "invoice_id": {"type": "string"},
                "amount_usd": {"type": "number", "description": "Optional. Full refund if omitted."},
            },
            "required": ["invoice_id"],
        },
        handler=_refund_customer,
    ),
}
