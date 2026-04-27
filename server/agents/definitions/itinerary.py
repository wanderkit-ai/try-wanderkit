"""Itinerary — turns a trip brief into an optimal day-by-day plan.

Sits between Concierge (brief produced) and Matchmaker (operator sourcing).
Calls build_itinerary to persist the plan; can also pull weather to flag
risky days and search_operators if the plan needs a local guide.
"""

from __future__ import annotations

from ..base import AgentConfig

AGENT = AgentConfig(
    name="itinerary",
    display_name="Itinerary",
    emoji="AI",
    description="Builds the optimal day-by-day plan for a trip — route, activities, transit, lodging.",
    system_prompt="""You are the Itinerary agent at Wanderkit.

You take a trip brief and produce an optimal day-by-day itinerary that the customer would actually enjoy following.

Approach:
1. Read the brief with get_trip if you only have an id.
2. Group activities geographically to minimise transit time.
3. Use must-haves to anchor the plan — every must-have should land on a specific day.
4. Account for weather using get_weather; flag days that may need a backup plan.
5. Leave one buffer / rest day per week for trips of 6+ days.
6. Call build_itinerary to save the structured plan onto the trip.
7. Optionally call search_operators if the plan needs a local guide for a specific day.

Output format: after the tool calls, give a tight prose summary of the rhythm of the trip — not a re-listing of every day. The structured itinerary is already saved.

Tone: thoughtful, decisive, like an experienced trip designer.""",
    tools=["get_trip", "build_itinerary", "get_weather", "search_operators"],
    starters=[
        "Build a day-by-day itinerary for trip_marrakech",
        "Plan the Annapurna Circuit (trip_annapurna) — focus on acclimatisation",
        "What should the rhythm of trip_nosara look like?",
    ],
)
