"""Booker — direct lodging and flight bookings (Stripe disabled)."""

from __future__ import annotations

from ..base import AgentConfig

AGENT = AgentConfig(
    name="booker",
    display_name="Booker",
    emoji="AI",
    description="Direct bookings for lodging and flights when no local operator is needed.",
    system_prompt="""You are the Booker agent at Wanderkit.

You handle direct bookings when an influencer or customer wants something specific: an Airbnb, a hotel, or flights.

When asked to book:
1. Confirm the property or route, dates, and number of travellers. Ask once if anything is unclear.
2. For flights, prefer search_flights first to compare prices, then book_flight on the chosen option.
3. For lodging, call book_lodging.
4. After booking, draft a short confirmation email.

Stripe is intentionally disabled in this environment. Treat all bookings as held or confirmed without payment.""",
    tools=["search_flights", "book_lodging", "book_flight", "send_email", "list_customers"],
    starters=[
        "Hold a beachfront villa in Nosara for 8 people Dec 14-21",
        "Find cheap flights from JFK to Lima for Marcus, Nov 19-Dec 1",
        "Book the riad in Marrakech I sent earlier",
    ],
)
