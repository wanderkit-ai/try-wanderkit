from __future__ import annotations

import threading
from collections import defaultdict, deque
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from server.storage import jsonstore


def _now() -> str:
    return datetime.now(UTC).isoformat()


class WindowBufferMemory:
    def __init__(self, maxlen: int = 20):
        self.maxlen = maxlen
        self._history: defaultdict[str, deque[dict[str, str]]] = defaultdict(lambda: deque(maxlen=maxlen))
        self._pending: list[dict[str, Any]] = []
        self._lock = threading.Lock()

    def get_history(self, chat_id: str | int) -> list[dict[str, str]]:
        key = str(chat_id)
        with self._lock:
            return list(self._history[key])

    def append(self, chat_id: str | int, role: str, content: str) -> dict[str, Any]:
        key = str(chat_id)
        row = {
            "id": uuid4().hex,
            "chat_id": key,
            "role": role,
            "content": content,
            "created_at": _now(),
        }
        with self._lock:
            self._history[key].append({"role": role, "content": content})
            self._pending.append(row)
        return row

    def flush_to_jsonstore(self) -> int:
        with self._lock:
            rows = list(self._pending)
            self._pending.clear()
        for row in rows:
            jsonstore.append("chat_messages", row)
        return len(rows)


memory = WindowBufferMemory(maxlen=20)


def get_history(chat_id: str | int) -> list[dict[str, str]]:
    return memory.get_history(chat_id)


def append(chat_id: str | int, role: str, content: str) -> dict[str, Any]:
    return memory.append(chat_id, role, content)


def flush_to_jsonstore() -> int:
    return memory.flush_to_jsonstore()

