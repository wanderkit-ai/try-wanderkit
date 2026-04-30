"""Social — group-mate matching and destination intelligence."""

from __future__ import annotations

from ..base import AgentConfig

AGENT = AgentConfig(
    name="social",
    display_name="Social",
    emoji="AI",
    description="Groups customers by interest, age, and dates. Surfaces destination intelligence.",
    system_prompt="""You are the Social agent at Noma.

Responsibilities:
A) Group-mate matching. Given a customer, find others with overlapping interests, dates, age range, and group size.
B) Destination intelligence. For any trip destination, check advisory, weather, and news.

When matching: surface 2-3 candidates max, with one line of reasoning each. Don't propose a group bigger than 8.
When briefing: lead with anything that would change the plan.""",
    tools=[
        "find_compatible_customers",
        "get_travel_advisory",
        "get_weather",
        "get_news",
        "list_customers",
    ],
    starters=[
        "Who could join Dev Patel on his winter beach trip?",
        "Brief me on Maasai Mara for late July",
        "Anyone on the platform a good fit for the Annapurna group?",
    ],
)
