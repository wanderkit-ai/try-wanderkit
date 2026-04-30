from __future__ import annotations

from typing import Any

import httpx

from server.agents.tools._shared import ToolDef
from server.settings import get_settings

_BASE = "https://api.firecrawl.dev/v1"


def _headers() -> dict[str, str]:
    settings = get_settings()
    if not settings.firecrawl_api_key:
        raise RuntimeError("FIRECRAWL_API_KEY is not configured")
    return {
        "Authorization": f"Bearer {settings.firecrawl_api_key}",
        "Content-Type": "application/json",
    }


def firecrawl_scrape(params: dict[str, Any]) -> dict[str, Any]:
    """Scrape a single URL and return markdown + metadata."""
    url: str = params.get("url", "")
    if not url:
        return {"error": "url is required", "markdown": "", "metadata": {}}

    formats: list[str] = params.get("formats", ["markdown"])
    try:
        resp = httpx.post(
            f"{_BASE}/scrape",
            headers=_headers(),
            json={"url": url, "formats": formats},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json().get("data") or {}
        return {
            "markdown": data.get("markdown", ""),
            "metadata": data.get("metadata", {}),
            "html": data.get("html", "") if "html" in formats else "",
        }
    except RuntimeError as exc:
        return {"error": str(exc), "markdown": "", "metadata": {}}
    except httpx.HTTPStatusError as exc:
        return {"error": f"Firecrawl {exc.response.status_code}: {exc.response.text[:200]}", "markdown": "", "metadata": {}}
    except Exception as exc:
        return {"error": str(exc), "markdown": "", "metadata": {}}


def firecrawl_crawl(params: dict[str, Any]) -> dict[str, Any]:
    """Crawl a site and return a list of scraped pages (synchronous polling)."""
    url: str = params.get("url", "")
    if not url:
        return {"error": "url is required", "pages": []}

    limit: int = int(params.get("limit", 10))
    try:
        # Start crawl job
        resp = httpx.post(
            f"{_BASE}/crawl",
            headers=_headers(),
            json={"url": url, "limit": limit, "scrapeOptions": {"formats": ["markdown"]}},
            timeout=30,
        )
        resp.raise_for_status()
        job = resp.json()
        job_id = job.get("id") or job.get("jobId")
        if not job_id:
            return {"error": "No job ID returned by Firecrawl", "pages": []}

        # Poll until done (max 60s)
        import time
        for _ in range(12):
            time.sleep(5)
            status_resp = httpx.get(
                f"{_BASE}/crawl/{job_id}",
                headers=_headers(),
                timeout=15,
            )
            status_resp.raise_for_status()
            status_data = status_resp.json()
            if status_data.get("status") == "completed":
                pages = [
                    {"url": p.get("metadata", {}).get("url", ""), "markdown": p.get("markdown", "")}
                    for p in (status_data.get("data") or [])
                ]
                return {"pages": pages, "total": len(pages)}
            if status_data.get("status") == "failed":
                return {"error": "Crawl job failed", "pages": []}

        return {"error": "Crawl timed out after 60s", "pages": []}
    except RuntimeError as exc:
        return {"error": str(exc), "pages": []}
    except httpx.HTTPStatusError as exc:
        return {"error": f"Firecrawl {exc.response.status_code}", "pages": []}
    except Exception as exc:
        return {"error": str(exc), "pages": []}


TOOLS: dict[str, ToolDef] = {
    "firecrawl_scrape": ToolDef(
        name="firecrawl_scrape",
        description="Scrape a single URL and return its content as clean markdown and metadata.",
        input_schema={
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The full URL to scrape"},
                "formats": {
                    "type": "array",
                    "items": {"type": "string", "enum": ["markdown", "html"]},
                    "description": "Output formats to request (default: ['markdown'])",
                },
            },
            "required": ["url"],
        },
        handler=firecrawl_scrape,
    ),
    "firecrawl_crawl": ToolDef(
        name="firecrawl_crawl",
        description="Crawl an entire site (up to a limit) and return scraped markdown for each page.",
        input_schema={
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The starting URL to crawl"},
                "limit": {"type": "integer", "description": "Max pages to crawl (default 10)", "default": 10},
            },
            "required": ["url"],
        },
        handler=firecrawl_crawl,
    ),
}
