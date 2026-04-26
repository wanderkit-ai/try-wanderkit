# Tripdrop MVP

## What this is
Creator-economy platform for travel influencers to sell curated group trips ("drops"). Full-stack Next.js 14 app with Supabase, Prisma 7, Stripe, Resend, and Codex AI.

## Tech stack
- **Framework**: Next.js 14 App Router, TypeScript
- **Styling**: Tailwind CSS + CSS custom properties (dark editorial design)
- **Fonts**: Cormorant Garamond (display) + Syne (sans) + Space Mono (mono) — loaded from Google Fonts in globals.css
- **Database**: PostgreSQL via Supabase, ORM via Prisma 7
- **Auth**: Supabase Auth (magic link + Google OAuth)
- **Payments**: Stripe Checkout Sessions
- **Email**: Resend
- **AI**: Anthropic Codex API (streaming itinerary generation)

## Critical Prisma 7 notes
Prisma 7 changed the client and config model significantly:
- Schema file does NOT have `url =` or `directUrl =` — connection URL is in `prisma.config.ts`
- PrismaClient must be instantiated with an adapter: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`
- See `lib/prisma.ts` for the correct pattern

## External client initialization
All external clients (Stripe, Resend, Supabase) use lazy-proxy initialization to avoid module-load errors during Next.js build when env vars are empty. See `lib/stripe.ts`, `lib/resend.ts`, `lib/supabase.ts`.

## Environment setup
Copy `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` — Supabase connection pooler URL (Transaction mode, port 6543)
- `DIRECT_URL` — Supabase direct connection (port 5432) — put this in `prisma.config.ts` datasource.url for migrations
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`

## Database commands
```bash
npm run db:generate   # Generate Prisma client (after schema changes)
npm run db:push       # Push schema to DB without migrations
npm run db:migrate    # Create and run migrations
npm run db:seed       # Seed Jamie + Nepal Vision + Annapurna drop
npm run db:studio     # Prisma Studio
```

## Design system
- Background: `#080808`, Surface: `#141414`, Card: `#191919`
- Accent (lime): `#c8ff57`
- All tokens in `app/globals.css` as CSS custom properties
- Dark, editorial aesthetic — Linear meets Stripe meets travel magazine

## Route structure
- `app/(public)/[creatorSlug]/[dropSlug]/` — public trip drop page (ISR 60s)
- `app/(public)/apply/[dropId]/` — 4-step application form
- `app/(creator)/` — creator dashboard (auth-gated)
- `app/(admin)/admin/` — admin panel (admin role only)
- `app/auth/login/` — magic link login
- `app/creator/signup/` — creator application

## Seed data
After DB is connected: `npm run db:seed`
- Creator: Jamie Chen (slug: `jamie`)
- Operator: Nepal Vision Treks
- Drop: Annapurna Circuit (slug: `annapurna-oct-2026`, status: LIVE)
- URL: `/jamie/annapurna-oct-2026`
- 3 seeded applications (1 SUBMITTED, 1 APPROVED, 1 DEPOSIT_PAID)

## Key business logic
- **Application flow**: SUBMITTED → APPROVED (creator approves, Stripe session created) → DEPOSIT_PAID (webhook fires)
- **Drop flow**: DRAFT → REVIEW (creator submits) → LIVE (admin approves + creates Stripe products)
- **Waitlist**: Auto-set when drop is full at application time
