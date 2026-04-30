# Wanderkit Workflows

## Basic Itinerary

Run the W1 workflow through FastAPI:

```bash
curl -N http://127.0.0.1:8000/api/workflows/itinerary-basic \
  -H "Content-Type: application/json" \
  -d "{\"trip_id\":\"trip_annapurna\"}"
```

Required environment:

- `OPENAI_API_KEY`
- `AMADEUS_CLIENT_ID`
- `AMADEUS_CLIENT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM`

Generated HTML artifacts are served from:

```text
/api/workflows/artifacts/<run_id>.html
```

## Telegram Bot

Expose local FastAPI with ngrok or another tunnel:

```bash
ngrok http 8000
```

Register the Telegram webhook:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://YOUR-NGROK-HOST/api/webhooks/telegram"
```

Required environment:

- `OPENAI_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `AMADEUS_CLIENT_ID`
- `AMADEUS_CLIENT_SECRET`

Optional for richer replies:

- `RESEND_API_KEY`
- `RESEND_FROM`

Telegram chat history is buffered in process and flushed to:

```text
server/.data/chat_messages.json
```
