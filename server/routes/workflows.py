from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

from server.storage import jsonstore
from server.workflows.registry import get_workflow, list_workflows


router = APIRouter()


def _now() -> str:
    return datetime.now(UTC).isoformat()


@router.get("/api/workflows")
async def workflows() -> list[dict[str, str]]:
    return [{"name": name} for name in list_workflows()]


@router.get("/api/workflows/artifacts/{artifact_name}")
async def workflow_artifact(artifact_name: str) -> FileResponse:
    if "/" in artifact_name or "\\" in artifact_name or not artifact_name.endswith(".html"):
        raise HTTPException(status_code=404, detail="Unknown artifact")
    path = jsonstore.DATA_DIR / "itineraries" / artifact_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Unknown artifact")
    return FileResponse(path, media_type="text/html")


@router.post("/api/workflows/{workflow_name}")
async def run_workflow(workflow_name: str, body: dict[str, Any]) -> StreamingResponse:
    workflow = get_workflow(workflow_name)
    if not workflow:
        raise HTTPException(status_code=404, detail="Unknown workflow")

    run_id = uuid4().hex
    jsonstore.append(
        "workflow_runs",
        {
            "id": run_id,
            "workflow": workflow_name,
            "status": "running",
            "started_at": _now(),
            "finished_at": None,
            "error": None,
        },
    )

    async def events():
        status = "success"
        error: str | None = None
        payload = {**body, "run_id": run_id}
        try:
            async for event in workflow(payload):
                event.setdefault("run_id", run_id)
                if event.get("type") == "error":
                    status = "error"
                    error = str(event.get("message") or "Workflow failed")
                yield f"data: {json.dumps(event)}\n\n"
                if event.get("type") in {"done", "error"}:
                    break
        except Exception as exc:
            status = "error"
            error = str(exc) or exc.__class__.__name__
            yield f"data: {json.dumps({'type': 'error', 'message': error, 'run_id': run_id})}\n\n"
        finally:
            jsonstore.update(
                "workflow_runs",
                run_id,
                {
                    "status": status,
                    "finished_at": _now(),
                    "error": error,
                },
            )

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    )
