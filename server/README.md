# Noma FastAPI Server

This is the new Python backend for the active client/server app. The original TypeScript/Next implementation remains untouched under `_legacy`.

## Run

```powershell
python -m venv .venv
.venv\Scripts\pip install -r server\requirements.txt
.venv\Scripts\uvicorn server.main:app --reload --port 8000
```

The Next client proxies `/api/agents/*` and `/api/debug/env` to this server. Override the server URL with:

```powershell
$env:FASTAPI_BASE_URL = "http://127.0.0.1:8000"
```
