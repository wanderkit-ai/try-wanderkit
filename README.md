# Noma MVP

A Notion-style CRM + 6 AI agents for creator-led travel. Influencers curate small-group trips; agents handle customer intake, operator sourcing, negotiation, itinerary building, and bookings — all from one dashboard.

---

## What it does

Noma connects three parties — **travel influencers**, **their customers**, and **local operators** — through an AI-orchestrated pipeline:

1. **Concierge** takes a customer's interest and turns it into a structured trip brief
2. **Matchmaker** finds and ranks local operators by destination, style, and budget fit
3. **Negotiator** messages operators on WhatsApp, requests quotes, and compares proposals
4. **Itinerary** builds a day-by-day programme from the brief, weather data, and destination intel
5. **Booker** handles direct flights and hotels when no operator is needed
6. **Social** groups compatible travelers and surfaces advisories, weather, and news

Every agent streams its reasoning and tool calls live to the UI.

---

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — stats, recent agent activity feed |
| `/trips` | Trip pipeline table + pipeline view |
| `/trips/[id]` | Trip detail — itinerary, quotes, WhatsApp thread, agent log |
| `/people/customers` | Customer CRM with status board |
| `/people/influencers` | Influencer roster |
| `/people/operators` | Operator directory |
| `/agents` | All 6 agents — overview grid + recent activity |
| `/agents/[name]` | Live agent chat with tool introspection |
| `/book` | Flight + hotel search, hand-off to Booker agent |
| `/calendar` | Day / Week / Month / Year calendar with meetings, departures, deadlines |
| `/community` | Forum — categories, posts, replies |
| `/inbox` | All messages — WhatsApp, email, portal |
| `/help` | FAQ, live AI Q&A, contact form |
| `/manage` | Influencer profiles — stats, customers (active/past), trip history |
| `/proposals/[id]` | **Public** client proposal page — itinerary, pricing, accept/request-changes CTAs |

---

## AI Agents

All agents are Anthropic Claude (`claude-sonnet-4-6`) with streaming tool use. No LangChain. The loop runner lives in `client/lib/agents/base.ts`.

| Agent | Emoji | Tools | Role |
|---|---|---|---|
| Concierge | 💌 | `list_customers`, `list_influencers`, `draft_brief`, `send_email` | Customer intake → structured trip brief |
| Itinerary | 🗺️ | `get_trip`, `get_weather`, `get_travel_advisory`, `get_news`, `generate_itinerary`, `save_itinerary` | Day-by-day itinerary builder |
| Matchmaker | 🧭 | `get_trip`, `search_operators`, `list_customers` | Finds and ranks local operators |
| Negotiator | 🤝 | `get_trip`, `list_trip_quotes`, `search_operators`, `send_whatsapp`, `send_email` | Sends quote requests, compares proposals |
| Booker | 🛎️ | `book_lodging`, `book_flight`, `send_email`, `list_customers` | Direct flight + hotel reservations |
| Social | 🫂 | `find_compatible_customers`, `get_travel_advisory`, `get_weather`, `get_news`, `list_customers` | Group matching + destination intel |

Navigating to `/agents/itinerary?trip=<id>` auto-starts the agent with the trip pre-loaded.

---

## Stack

- **Next.js 14** App Router + TypeScript
- **Tailwind CSS** — custom design tokens, no component library
- **Supabase** — auth (magic link / password); all data is mock in-memory
- **Anthropic SDK** — direct streaming, no middleware framework
- **Stripe** — intentionally disabled (all bookings held without payment)

---

## Running locally

```bash
cd client
npm install
npm run dev
# → http://localhost:3000
```

Requires a `.env.local` in `client/` — copy the template and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

Login with any Supabase-verified email. All data is mock — no database migrations needed.

---

## Key files

```
client/
├── app/
│   ├── (dashboard)/          # All authenticated pages
│   │   ├── page.tsx          # Home dashboard
│   │   ├── trips/[id]/       # Trip detail + Send Proposal button
│   │   ├── agents/[name]/    # Dynamic agent chat (supports ?trip= pre-load)
│   │   ├── book/             # Flight + hotel search
│   │   ├── calendar/         # Full calendar (day/week/month/year)
│   │   ├── community/        # Forum
│   │   ├── help/             # FAQ + AI Q&A + contact
│   │   └── manage/           # Influencer profiles
│   └── proposals/[id]/       # Public client proposal (no auth)
├── lib/
│   ├── agents/
│   │   ├── base.ts           # Tool-use loop runner + SSE streaming
│   │   ├── registry.ts       # 6 agent configs
│   │   └── tools.ts          # 16 tools (incl. generate_itinerary, save_itinerary)
│   ├── mock-data.ts          # Customers, influencers, operators, trips, quotes,
│   │                         # calendar events, forum posts, booking results
│   └── types.ts              # Shared TypeScript types
└── components/
    ├── sidebar.tsx            # Nav — People, Trips, Book, Calendar, Community,
    │                          # Agents (single tab), Manage, Help
    ├── agent-chat.tsx         # Streaming chat UI with tool introspection
    └── ...
```

---

## Design language

Light, editorial, Notion-inspired. Off-white page (`#fbfbfa`), warm gray ink, single teal accent (`#2e7d6b`). Subtle 1px borders, no drop shadows on flat surfaces. Inter throughout. All tokens as CSS variables in `globals.css`.

---

## Mock data included

| Entity | Count |
|---|---|
| Influencers | 3 (Jamie Chen, Maya Okafor, Lucas Brandt) |
| Operators | 6 (Nepal, Kenya, Morocco, Argentina, Costa Rica, Bali) |
| Customers | 6 (across 3 influencers) |
| Trips | 5 (Annapurna, Mara, Marrakech, Patagonia, Nosara) |
| Quotes | 3 |
| Calendar events | 20 (meetings, departures, deadlines, tasks) |
| Forum posts | 10 |
| Pre-built itineraries | 2 (Annapurna 13-day, Mara 10-day) |

Pre-built proposal pages: `/proposals/trip_mara` and `/proposals/trip_annapurna` work immediately without running an agent.
