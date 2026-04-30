from __future__ import annotations

from typing import Any

from server.settings import get_settings

try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
except ImportError:  # pragma: no cover - lets the app boot before deps are installed
    AsyncIOScheduler = None  # type: ignore[assignment]


_scheduler: Any = None


def _parse_cron(expr: str) -> dict[str, str]:
    """Convert a 5-field cron string into APScheduler CronTrigger kwargs."""
    parts = expr.strip().split()
    if len(parts) != 5:
        raise ValueError(f"Expected 5-field cron expression, got: {expr!r}")
    minute, hour, day, month, day_of_week = parts
    return {
        "minute": minute,
        "hour": hour,
        "day": day,
        "month": month,
        "day_of_week": day_of_week,
    }


def start_scheduler() -> Any:
    global _scheduler
    if AsyncIOScheduler is None:
        return None
    if _scheduler and _scheduler.running:
        return _scheduler

    settings = get_settings()
    _scheduler = AsyncIOScheduler(timezone="UTC")
    if settings.scrape_cron:
        from server.workflows.scrape_leads import run_scheduled_scrape
        _scheduler.add_job(
            run_scheduled_scrape,
            "cron",
            **_parse_cron(settings.scrape_cron),
            id="scrape_leads",
            replace_existing=True,
            misfire_grace_time=300,
        )
    _scheduler.start()
    return _scheduler


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
