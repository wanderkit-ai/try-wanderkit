from __future__ import annotations

import json
import os
import re
import threading
from pathlib import Path
from typing import Any
from uuid import uuid4


DATA_DIR = Path(__file__).resolve().parents[1] / ".data"
_LOCK = threading.Lock()
_NAME_RE = re.compile(r"^[A-Za-z0-9_.-]+$")


def _path(name: str) -> Path:
    if not _NAME_RE.match(name):
        raise ValueError(f"Invalid store name: {name}")
    filename = name if name.endswith(".json") else f"{name}.json"
    return DATA_DIR / filename


def read(name: str) -> list[dict[str, Any]]:
    path = _path(name)
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise ValueError(f"Store {name} must contain a JSON array")
    return data


def write(name: str, rows: list[dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = _path(name)
    temp_path = path.with_name(f".{path.name}.{uuid4().hex}.tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(rows, handle, indent=2, sort_keys=True)
        handle.write("\n")
    os.replace(temp_path, path)


def append(name: str, row: dict[str, Any]) -> dict[str, Any]:
    with _LOCK:
        rows = read(name)
        stored = dict(row)
        stored.setdefault("id", uuid4().hex)
        rows.append(stored)
        write(name, rows)
    return stored


def update(name: str, id: str, patch: dict[str, Any]) -> dict[str, Any]:
    with _LOCK:
        rows = read(name)
        for index, row in enumerate(rows):
            if str(row.get("id")) == str(id):
                updated = {**row, **patch}
                rows[index] = updated
                write(name, rows)
                return updated
    raise KeyError(f"No row with id={id} in store {name}")

