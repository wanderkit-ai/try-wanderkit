from __future__ import annotations

import asyncio
import inspect
from collections.abc import AsyncGenerator, Awaitable, Callable, Iterable
from dataclasses import dataclass, field
from typing import Any


@dataclass
class WorkflowContext:
    data: dict[str, Any] = field(default_factory=dict)
    results: dict[str, dict[str, Any]] = field(default_factory=dict)

    def get(self, key: str, default: Any = None) -> Any:
        return self.data.get(key, default)

    def update(self, values: dict[str, Any]) -> None:
        self.data.update(values)

    def result(self, step: str, default: Any = None) -> Any:
        return self.results.get(step, default)

    def set_result(self, step: str, value: dict[str, Any]) -> None:
        self.results[step] = value

    def snapshot(self) -> dict[str, Any]:
        return {**self.data, "steps": self.results}


StepFn = Callable[[WorkflowContext], Awaitable[dict[str, Any]] | dict[str, Any]]


@dataclass(frozen=True)
class Step:
    name: str
    deps: tuple[str, ...] | list[str]
    fn: StepFn


async def _run_step(step: Step, ctx: WorkflowContext) -> dict[str, Any]:
    value = step.fn(ctx)
    if inspect.isawaitable(value):
        value = await value
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise TypeError(f"Step {step.name} returned {type(value).__name__}; expected dict")
    return value


def _validate_steps(steps: Iterable[Step]) -> dict[str, Step]:
    step_map: dict[str, Step] = {}
    for step in steps:
        if step.name in step_map:
            raise ValueError(f"Duplicate workflow step: {step.name}")
        step_map[step.name] = step

    for step in step_map.values():
        for dep in step.deps:
            if dep not in step_map:
                raise ValueError(f"Step {step.name} depends on unknown step {dep}")
    return step_map


async def run_dag(
    steps: Iterable[Step],
    initial_ctx: dict[str, Any] | WorkflowContext,
) -> AsyncGenerator[dict[str, Any], None]:
    step_map = _validate_steps(steps)
    ctx = initial_ctx if isinstance(initial_ctx, WorkflowContext) else WorkflowContext(dict(initial_ctx))
    completed: set[str] = set()
    pending = set(step_map)

    while pending:
        ready = sorted(
            name
            for name in pending
            if all(dep in completed for dep in step_map[name].deps)
        )
        if not ready:
            unresolved = {name: list(step_map[name].deps) for name in sorted(pending)}
            yield {
                "type": "error",
                "message": "Workflow graph has a cycle or unresolved dependency",
                "data": {"pending": unresolved},
            }
            return

        for name in ready:
            yield {"type": "step", "step": name, "status": "running", "data": {}}

        results = await asyncio.gather(
            *[_run_step(step_map[name], ctx) for name in ready],
            return_exceptions=True,
        )

        had_error = False
        for name, result in zip(ready, results):
            if isinstance(result, Exception):
                had_error = True
                yield {
                    "type": "step",
                    "step": name,
                    "status": "error",
                    "data": {"error": str(result) or result.__class__.__name__},
                }
                continue

            ctx.set_result(name, result)
            completed.add(name)
            pending.remove(name)
            yield {"type": "step", "step": name, "status": "success", "data": result}

        if had_error:
            yield {"type": "error", "message": "Workflow failed", "data": ctx.snapshot()}
            return

    yield {"type": "done", "data": ctx.snapshot()}

