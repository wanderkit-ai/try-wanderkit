from __future__ import annotations

import json
from typing import Any

from server.agents.tools._shared import ToolDef
from server.settings import get_settings


def _service() -> Any:
    """Return an authenticated Google Sheets service object."""
    settings = get_settings()
    if not settings.google_service_account_json:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON is not configured")

    try:
        from google.oauth2.service_account import Credentials
        from googleapiclient.discovery import build
    except ImportError:
        raise RuntimeError("google-api-python-client is not installed")

    sa_path = settings.google_service_account_json
    scopes = ["https://www.googleapis.com/auth/spreadsheets"]

    if sa_path.strip().startswith("{"):
        info = json.loads(sa_path)
        creds = Credentials.from_service_account_info(info, scopes=scopes)
    else:
        creds = Credentials.from_service_account_file(sa_path, scopes=scopes)

    return build("sheets", "v4", credentials=creds, cache_discovery=False)


def _spreadsheet_id(params: dict[str, Any]) -> str:
    settings = get_settings()
    return params.get("spreadsheet_id") or settings.gsheets_spreadsheet_id or ""


def sheet_append_rows(params: dict[str, Any]) -> dict[str, Any]:
    """Append rows to a Google Sheet."""
    spreadsheet_id = _spreadsheet_id(params)
    if not spreadsheet_id:
        return {"error": "GSHEETS_SPREADSHEET_ID is not configured", "appended": 0}

    sheet_range: str = params.get("range", "Sheet1!A1")
    rows: list[list[Any]] = params.get("rows", [])
    if not rows:
        return {"error": "rows is required and must be non-empty", "appended": 0}

    try:
        svc = _service()
        result = (
            svc.spreadsheets()
            .values()
            .append(
                spreadsheetId=spreadsheet_id,
                range=sheet_range,
                valueInputOption="USER_ENTERED",
                insertDataOption="INSERT_ROWS",
                body={"values": rows},
            )
            .execute()
        )
        updates = result.get("updates", {})
        return {"appended": updates.get("updatedRows", len(rows)), "range": updates.get("updatedRange", "")}
    except RuntimeError as exc:
        return {"error": str(exc), "appended": 0}
    except Exception as exc:
        return {"error": str(exc), "appended": 0}


def sheet_read_rows(params: dict[str, Any]) -> dict[str, Any]:
    """Read rows from a Google Sheet range."""
    spreadsheet_id = _spreadsheet_id(params)
    if not spreadsheet_id:
        return {"error": "GSHEETS_SPREADSHEET_ID is not configured", "rows": []}

    sheet_range: str = params.get("range", "Sheet1!A1:Z1000")
    try:
        svc = _service()
        result = (
            svc.spreadsheets()
            .values()
            .get(spreadsheetId=spreadsheet_id, range=sheet_range)
            .execute()
        )
        return {"rows": result.get("values", []), "range": result.get("range", "")}
    except RuntimeError as exc:
        return {"error": str(exc), "rows": []}
    except Exception as exc:
        return {"error": str(exc), "rows": []}


def sheet_update_cell(params: dict[str, Any]) -> dict[str, Any]:
    """Update a single cell in a Google Sheet."""
    spreadsheet_id = _spreadsheet_id(params)
    if not spreadsheet_id:
        return {"error": "GSHEETS_SPREADSHEET_ID is not configured", "updated": False}

    cell: str = params.get("cell", "")
    value: Any = params.get("value", "")
    if not cell:
        return {"error": "cell is required (e.g. 'Sheet1!B3')", "updated": False}

    try:
        svc = _service()
        svc.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=cell,
            valueInputOption="USER_ENTERED",
            body={"values": [[value]]},
        ).execute()
        return {"updated": True, "cell": cell, "value": value}
    except RuntimeError as exc:
        return {"error": str(exc), "updated": False}
    except Exception as exc:
        return {"error": str(exc), "updated": False}


TOOLS: dict[str, ToolDef] = {
    "sheet_append_rows": ToolDef(
        name="sheet_append_rows",
        description="Append one or more rows to a Google Sheet.",
        input_schema={
            "type": "object",
            "properties": {
                "rows": {
                    "type": "array",
                    "items": {"type": "array"},
                    "description": "List of rows, each row is a list of cell values",
                },
                "range": {
                    "type": "string",
                    "description": "Sheet range to append to, e.g. 'Sheet1!A1'",
                    "default": "Sheet1!A1",
                },
                "spreadsheet_id": {
                    "type": "string",
                    "description": "Override spreadsheet ID (uses GSHEETS_SPREADSHEET_ID env var if omitted)",
                },
            },
            "required": ["rows"],
        },
        handler=sheet_append_rows,
    ),
    "sheet_read_rows": ToolDef(
        name="sheet_read_rows",
        description="Read rows from a Google Sheet range.",
        input_schema={
            "type": "object",
            "properties": {
                "range": {
                    "type": "string",
                    "description": "A1 notation range, e.g. 'Sheet1!A1:F100'",
                    "default": "Sheet1!A1:Z1000",
                },
                "spreadsheet_id": {"type": "string"},
            },
        },
        handler=sheet_read_rows,
    ),
    "sheet_update_cell": ToolDef(
        name="sheet_update_cell",
        description="Update a single cell in a Google Sheet.",
        input_schema={
            "type": "object",
            "properties": {
                "cell": {"type": "string", "description": "Cell reference, e.g. 'Sheet1!B3'"},
                "value": {"description": "New value for the cell"},
                "spreadsheet_id": {"type": "string"},
            },
            "required": ["cell", "value"],
        },
        handler=sheet_update_cell,
    ),
}
