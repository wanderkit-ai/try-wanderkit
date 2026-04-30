from __future__ import annotations

from collections.abc import AsyncGenerator, Callable
from typing import Any


WorkflowHandler = Callable[[dict[str, Any]], AsyncGenerator[dict[str, Any], None]]
WORKFLOWS: dict[str, WorkflowHandler] = {}


def register(name: str) -> Callable[[WorkflowHandler], WorkflowHandler]:
    def decorator(handler: WorkflowHandler) -> WorkflowHandler:
        if name in WORKFLOWS:
            raise RuntimeError(f"Duplicate workflow name: {name}")
        WORKFLOWS[name] = handler
        return handler

    return decorator


def get_workflow(name: str) -> WorkflowHandler | None:
    return WORKFLOWS.get(name)


def list_workflows() -> list[str]:
    return sorted(WORKFLOWS)

