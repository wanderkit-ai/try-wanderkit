import {
  customers,
  influencers,
  operators,
  trips,
  quotes,
  findById,
} from '@/lib/mock-data';
import { search as tavilySearch } from './tavily';
import type { ItineraryDay } from '@/lib/types';
import type { TripStyle } from '@/lib/types';

export type ToolHandler = (input: any) => Promise<unknown> | unknown;

export interface ToolDef {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: ToolHandler;
}

// ─── Shared lookups ─────────────────────────────────────────────────────────

const list_customers: ToolDef = {
  name: 'list_customers',
  description: 'List customers in the CRM, optionally filtered by influencer, status, or interests.',
  input_schema: {
    type: 'object',
    properties: {
      influencer_id: { type: 'string', description: 'Filter to one influencer (e.g. inf_jamie)' },
      status: { type: 'string', enum: ['lead', 'briefed', 'matched', 'paid', 'travelling', 'returned'] },
      interest: { type: 'string', description: 'A trip style (hiking, beach, etc)' },
    },
  },
  handler: ({ influencer_id, status, interest }) =>
    customers
      .filter((c) => !influencer_id || c.influencerId === influencer_id)
      .filter((c) => !status || c.status === status)
      .filter((c) => !interest || c.interests.includes(interest as TripStyle))
      .map((c) => ({
        id: c.id,
        name: c.name,
        city: c.city,
        country: c.country,
        age: c.age,
        interests: c.interests,
        budget: `$${(c.budgetMin / 100).toFixed(0)}–$${(c.budgetMax / 100).toFixed(0)} pp/day`,
        groupSize: c.groupSize,
        availability: c.availability,
        status: c.status,
        influencer: c.influencerId,
      })),
};

const list_influencers: ToolDef = {
  name: 'list_influencers',
  description: 'List travel influencers (creators) on the platform.',
  input_schema: { type: 'object', properties: {} },
  handler: () =>
    influencers.map((i) => ({
      id: i.id,
      name: i.name,
      handle: i.handle,
      followers: i.followers,
      niches: i.niches,
      regions: i.regions,
    })),
};

const search_operators: ToolDef = {
  name: 'search_operators',
  description:
    'Search local operators by region/country and trip style. Returns operators ranked by rating and response speed.',
  input_schema: {
    type: 'object',
    properties: {
      region: { type: 'string', description: 'Region or country to search (e.g. Patagonia, Nepal, Morocco)' },
      style: {
        type: 'string',
        description: 'A trip style (hiking, beach, expedition, cultural, safari, culinary, wellness)',
      },
      max_tier: {
        type: 'string',
        enum: ['$', '$$', '$$$'],
        description: 'Max price tier',
      },
    },
  },
  handler: ({ region, style, max_tier }) => {
    const tierRank = { $: 1, $$: 2, $$$: 3 } as const;
    return operators
      .filter((o) =>
        !region
          ? true
          : o.country.toLowerCase().includes(String(region).toLowerCase()) ||
            o.region.toLowerCase().includes(String(region).toLowerCase())
      )
      .filter((o) => !style || o.specialties.includes(style as TripStyle))
      .filter((o) => !max_tier || tierRank[o.priceTier] <= tierRank[max_tier as keyof typeof tierRank])
      .sort((a, b) => b.rating - a.rating || a.responseHours - b.responseHours)
      .map((o) => ({
        id: o.id,
        company: o.company,
        contact: o.contactName,
        country: o.country,
        region: o.region,
        specialties: o.specialties,
        rating: o.rating,
        replyTimeHours: o.responseHours,
        priceTier: o.priceTier,
        whatsapp: o.whatsapp,
        email: (o as { email?: string }).email,
        website: (o as { website?: string }).website,
      }));
  },
};

const get_trip: ToolDef = {
  name: 'get_trip',
  description: 'Fetch a trip brief by id.',
  input_schema: {
    type: 'object',
    properties: { trip_id: { type: 'string' } },
    required: ['trip_id'],
  },
  handler: ({ trip_id }) => {
    const t = findById(trips, trip_id);
    if (!t) return { error: 'Trip not found' };
    return t;
  },
};

const list_trip_quotes: ToolDef = {
  name: 'list_trip_quotes',
  description: 'List the quotes received for a given trip.',
  input_schema: {
    type: 'object',
    properties: { trip_id: { type: 'string' } },
    required: ['trip_id'],
  },
  handler: ({ trip_id }) =>
    quotes
      .filter((q) => q.tripId === trip_id)
      .map((q) => {
        const op = findById(operators, q.operatorId);
        return {
          id: q.id,
          operator: op?.company,
          operatorId: op?.id,
          status: q.status,
          perPersonUsd: q.perPersonCents / 100,
          totalUsd: q.totalCents / 100,
          includes: q.includes,
          excludes: q.excludes,
        };
      }),
};

// ─── Side-effect tools (mocked) ─────────────────────────────────────────────

const send_whatsapp: ToolDef = {
  name: 'send_whatsapp',
  description:
    'Send a WhatsApp message to a local operator on behalf of an influencer. Used to request a quote or follow up. Returns immediately; the reply will arrive separately.',
  input_schema: {
    type: 'object',
    properties: {
      operator_id: { type: 'string' },
      trip_id: { type: 'string' },
      message: { type: 'string', description: 'The exact message body to send' },
    },
    required: ['operator_id', 'message'],
  },
  handler: ({ operator_id, message, trip_id }) => {
    const op = findById(operators, operator_id);
    return {
      sent: true,
      to: op?.whatsapp ?? '+UNKNOWN',
      operator: op?.company ?? operator_id,
      tripId: trip_id ?? null,
      preview: String(message).slice(0, 120),
      note: '[mock] In production this would dispatch via Twilio.',
    };
  },
};

const send_email: ToolDef = {
  name: 'send_email',
  description: 'Send an email to a customer or operator. Used for confirmations, follow-ups.',
  input_schema: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'email address' },
      subject: { type: 'string' },
      body: { type: 'string' },
    },
    required: ['to', 'subject', 'body'],
  },
  handler: ({ to, subject }) => ({
    sent: true,
    to,
    subject,
    note: '[mock] In production this would dispatch via Resend.',
  }),
};

const draft_brief: ToolDef = {
  name: 'draft_brief',
  description:
    'Save a structured trip brief from a customer intake. Used by the Concierge after gathering enough info.',
  input_schema: {
    type: 'object',
    properties: {
      customer_id: { type: 'string' },
      destination: { type: 'string' },
      style: { type: 'array', items: { type: 'string' } },
      season: { type: 'string', enum: ['spring', 'summer', 'fall', 'winter'] },
      budget_per_person: { type: 'number', description: 'USD per person per day' },
      group_size: { type: 'number' },
      must_haves: { type: 'array', items: { type: 'string' } },
    },
    required: ['customer_id', 'destination', 'style', 'budget_per_person'],
  },
  handler: (input) => ({
    saved: true,
    brief_id: `brief_${Date.now()}`,
    ...input,
    note: '[mock] Brief stored. Matchmaker can now take over.',
  }),
};

const book_lodging: ToolDef = {
  name: 'book_lodging',
  description:
    'Book direct lodging (Airbnb / hotel) when no operator is involved. Used by the Booker when the influencer/customer wants a specific property.',
  input_schema: {
    type: 'object',
    properties: {
      provider: { type: 'string', enum: ['airbnb', 'hotel', 'vrbo'] },
      property_id: { type: 'string' },
      check_in: { type: 'string' },
      check_out: { type: 'string' },
      guests: { type: 'number' },
      total_usd: { type: 'number' },
    },
    required: ['provider', 'property_id', 'check_in', 'check_out', 'guests'],
  },
  handler: (input) => ({
    booked: true,
    confirmation: `WK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    ...input,
    note: '[mock] Stripe is intentionally disabled in this environment.',
  }),
};

const book_flight: ToolDef = {
  name: 'book_flight',
  description: 'Search and hold flights for a customer. Used by the Booker.',
  input_schema: {
    type: 'object',
    properties: {
      origin: { type: 'string' },
      destination: { type: 'string' },
      depart_date: { type: 'string' },
      return_date: { type: 'string' },
      passengers: { type: 'number' },
    },
    required: ['origin', 'destination', 'depart_date', 'passengers'],
  },
  handler: (input) => ({
    held: true,
    quote: { airline: 'LATAM', total_usd: 1240, layovers: 1 },
    ...input,
    note: '[mock] Real bookings would use Duffel.',
  }),
};

const get_weather: ToolDef = {
  name: 'get_weather',
  description: 'Get 7-day weather forecast for a destination.',
  input_schema: {
    type: 'object',
    properties: { destination: { type: 'string' } },
    required: ['destination'],
  },
  handler: ({ destination }) => ({
    destination,
    summary: '[mock] Avg high 22°C, lows 8°C, 20% chance of rain mid-week.',
  }),
};

const get_travel_advisory: ToolDef = {
  name: 'get_travel_advisory',
  description: 'Fetch the latest US State Department travel advisory level for a country.',
  input_schema: {
    type: 'object',
    properties: { country: { type: 'string' } },
    required: ['country'],
  },
  handler: ({ country }) => ({
    country,
    level: '[mock] Level 2 — Exercise Increased Caution. Updated 2026-04-14.',
  }),
};

const get_news: ToolDef = {
  name: 'get_news',
  description: 'Recent news headlines relevant to a destination.',
  input_schema: {
    type: 'object',
    properties: { destination: { type: 'string' } },
    required: ['destination'],
  },
  handler: ({ destination }) => ({
    destination,
    headlines: [
      `[mock] ${destination}: New national park entry fee announced (Apr 2026)`,
      `[mock] ${destination}: Domestic carriers expand routes for tourist season`,
    ],
  }),
};

const find_compatible_customers: ToolDef = {
  name: 'find_compatible_customers',
  description:
    'Given a customer, find others on the platform with overlapping interests, dates, age range, and group size — for forming small group trips.',
  input_schema: {
    type: 'object',
    properties: {
      customer_id: { type: 'string' },
      max_age_diff: { type: 'number', default: 8 },
    },
    required: ['customer_id'],
  },
  handler: ({ customer_id, max_age_diff = 8 }) => {
    const seed = findById(customers, customer_id);
    if (!seed) return { error: 'Customer not found' };
    const matches = customers
      .filter((c) => c.id !== seed.id)
      .map((c) => {
        const interestOverlap = c.interests.filter((i) => seed.interests.includes(i)).length;
        const seasonOverlap = c.availability.filter((s) => seed.availability.includes(s)).length;
        const ageDelta = Math.abs(c.age - seed.age);
        return { customer: c, interestOverlap, seasonOverlap, ageDelta };
      })
      .filter((m) => m.interestOverlap > 0 && m.seasonOverlap > 0 && m.ageDelta <= max_age_diff)
      .sort(
        (a, b) =>
          b.interestOverlap - a.interestOverlap ||
          b.seasonOverlap - a.seasonOverlap ||
          a.ageDelta - b.ageDelta
      )
      .slice(0, 5)
      .map((m) => ({
        id: m.customer.id,
        name: m.customer.name,
        age: m.customer.age,
        city: m.customer.city,
        sharedInterests: m.customer.interests.filter((i) => seed.interests.includes(i)),
        sharedSeasons: m.customer.availability.filter((s) => seed.availability.includes(s)),
      }));
    return { seed: { id: seed.id, name: seed.name }, matches };
  },
};

// ─── Trip listing ───────────────────────────────────────────────────────────

const list_trips: ToolDef = {
  name: 'list_trips',
  description: 'List all trips in the system. Use this to find a trip by name or destination when the user hasn\'t provided a trip_id.',
  input_schema: {
    type: 'object',
    properties: {
      status: { type: 'string', description: 'Filter by trip status (brief, sourcing, quoting, approved, booked, completed, cancelled)' },
      destination: { type: 'string', description: 'Filter by destination keyword (e.g. Patagonia, Bali)' },
    },
  },
  handler: ({ status, destination }) =>
    trips
      .filter((t) => !status || t.status === status)
      .filter((t) => !destination || t.destination.toLowerCase().includes(String(destination).toLowerCase()) || t.title.toLowerCase().includes(String(destination).toLowerCase()))
      .map((t) => ({
        id: t.id,
        title: t.title,
        destination: t.destination,
        status: t.status,
        startDate: t.startDate,
        endDate: t.endDate,
        groupSize: t.groupSize,
        style: t.style,
        budgetPerPerson: `$${(t.budgetPerPerson / 100).toFixed(0)}/pp/day`,
        hasItinerary: !!(t.itinerary && t.itinerary.length > 0),
      })),
};

// ─── Web search (mock) ───────────────────────────────────────────────────────

const web_search_destination: ToolDef = {
  name: 'web_search_destination',
  description: 'Search the web for destination research: best time to visit, highlights, logistics, permits, and insider tips. Use this to enrich an itinerary before generating it.',
  input_schema: {
    type: 'object',
    properties: {
      destination: { type: 'string', description: 'The destination or region to research (e.g. Patagonia, Bali, Marrakech)' },
      focus: { type: 'string', description: 'Optional focus area: logistics, activities, weather, culture, fitness' },
    },
    required: ['destination'],
  },
  handler: async ({ destination, focus }: { destination: string; focus?: string }) => {
    const focusClause = focus ? ` ${focus}` : ' best time to visit activities logistics tips permits';
    const results = await tavilySearch(
      `${destination} travel guide${focusClause}`,
      6
    );
    return { destination, results };
  },
};

const web_search_operators: ToolDef = {
  name: 'web_search_operators',
  description: 'Search the web for local tour operators in a given destination. Returns raw search results with company names, contacts, and descriptions. Call add_operator to save promising ones.',
  input_schema: {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'Country, region, or city to search (e.g. Patagonia, Bali, Marrakech)' },
      specialty: { type: 'string', description: 'Trip style to filter by (hiking, beach, safari, cultural, wellness, culinary, expedition)' },
    },
    required: ['location'],
  },
  handler: async ({ location, specialty }: { location: string; specialty?: string }) => {
    const styleClause = specialty ? ` ${specialty}` : '';
    const [generalResults, contactResults] = await Promise.all([
      tavilySearch(`local tour operators ${location}${styleClause} travel company guide services`, 5),
      tavilySearch(`${location}${styleClause} tour company contact email booking`, 4),
    ]);
    return {
      location,
      note: 'Review these results and call add_operator for any worth adding to the database.',
      generalResults,
      contactResults,
    };
  },
};

const add_operator: ToolDef = {
  name: 'add_operator',
  description: 'Add a newly discovered operator to the Noma database. Use after finding promising operators via web_search_operators.',
  input_schema: {
    type: 'object',
    properties: {
      company: { type: 'string' },
      contactName: { type: 'string' },
      email: { type: 'string' },
      whatsapp: { type: 'string' },
      country: { type: 'string' },
      region: { type: 'string' },
      specialties: { type: 'array', items: { type: 'string' } },
      rating: { type: 'number' },
      responseHours: { type: 'number' },
      priceTier: { type: 'string', enum: ['$', '$$', '$$$'] },
      notes: { type: 'string' },
    },
    required: ['company', 'contactName', 'country', 'region'],
  },
  handler: (input) => {
    const newId = `op_web_${Date.now()}`;
    const newOp = {
      id: newId,
      company: input.company,
      contactName: input.contactName,
      email: input.email ?? '',
      whatsapp: input.whatsapp ?? '',
      country: input.country,
      region: input.region,
      specialties: input.specialties ?? [],
      rating: input.rating ?? 0,
      responseHours: input.responseHours ?? 24,
      priceTier: input.priceTier ?? '$$',
      notes: input.notes ?? '',
    };
    operators.push(newOp as any);
    return {
      added: true,
      id: newId,
      company: input.company,
      note: 'Operator added to the Noma database. They will now appear in the Operators list.',
    };
  },
};

// ─── Flight search (real APIs, server-side) ──────────────────────────────────

const amadeus_search_flights: ToolDef = {
  name: 'amadeus_search_flights',
  description: 'Search flights via Amadeus/SerpAPI (Google Flights data). Primary flight source.',
  input_schema: {
    type: 'object',
    properties: {
      origin: { type: 'string', description: 'Departure city or airport code' },
      destination: { type: 'string', description: 'Arrival city or airport code' },
      depart_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
      return_date: { type: 'string', description: 'ISO return date' },
      passengers: { type: 'number', description: 'Number of passengers' },
    },
    required: ['origin', 'destination', 'depart_date', 'passengers'],
  },
  handler: () => ({ note: 'Handled server-side' }),
};

const skyscanner_search_flights: ToolDef = {
  name: 'skyscanner_search_flights',
  description: 'Search flights via Skyscanner (RapidAPI). Fallback flight source.',
  input_schema: {
    type: 'object',
    properties: {
      origin: { type: 'string', description: 'Departure city or airport code' },
      destination: { type: 'string', description: 'Arrival city or airport code' },
      depart_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
      return_date: { type: 'string', description: 'ISO return date' },
      passengers: { type: 'number' },
    },
    required: ['origin', 'destination', 'depart_date', 'passengers'],
  },
  handler: () => ({ note: 'Handled server-side' }),
};

const kiwi_search_flights: ToolDef = {
  name: 'kiwi_search_flights',
  description: 'Search cheapest flights via Kiwi/Tequila API. Last-resort flight source.',
  input_schema: {
    type: 'object',
    properties: {
      origin: { type: 'string', description: 'Departure city or airport code' },
      destination: { type: 'string', description: 'Arrival city or airport code' },
      depart_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
      return_date: { type: 'string' },
      passengers: { type: 'number' },
    },
    required: ['origin', 'destination', 'depart_date', 'passengers'],
  },
  handler: () => ({ note: 'Handled server-side' }),
};

// ─── Hotel search (real APIs, server-side) ───────────────────────────────────

const booking_search_hotels: ToolDef = {
  name: 'booking_search_hotels',
  description: 'Search hotels via Booking.com (RapidAPI). Primary hotel source.',
  input_schema: {
    type: 'object',
    properties: {
      destination: { type: 'string' },
      check_in: { type: 'string', description: 'ISO date YYYY-MM-DD' },
      check_out: { type: 'string', description: 'ISO date YYYY-MM-DD' },
      guests: { type: 'number' },
    },
    required: ['destination', 'check_in', 'check_out', 'guests'],
  },
  handler: () => ({ note: 'Handled server-side' }),
};

const amadeus_search_hotels: ToolDef = {
  name: 'amadeus_search_hotels',
  description: 'Search hotels via Amadeus API. Fallback hotel source.',
  input_schema: {
    type: 'object',
    properties: {
      destination: { type: 'string' },
      check_in: { type: 'string' },
      check_out: { type: 'string' },
      guests: { type: 'number' },
    },
    required: ['destination'],
  },
  handler: () => ({ note: 'Handled server-side' }),
};

// ─── Activities (real APIs, server-side) ─────────────────────────────────────

const viator_search_activities: ToolDef = {
  name: 'viator_search_activities',
  description: 'Search tours and activities via Viator partner API.',
  input_schema: {
    type: 'object',
    properties: {
      destination: { type: 'string' },
      limit: { type: 'number' },
    },
    required: ['destination'],
  },
  handler: () => ({ note: 'Handled server-side' }),
};

const tripadvisor_activities: ToolDef = {
  name: 'tripadvisor_activities',
  description: 'Fetch top activities and attractions for a destination via TripAdvisor.',
  input_schema: {
    type: 'object',
    properties: {
      destination: { type: 'string' },
      limit: { type: 'number' },
    },
    required: ['destination'],
  },
  handler: () => ({ note: 'Handled server-side' }),
};

// ─── Weather (real APIs, server-side) ────────────────────────────────────────

const openweathermap_forecast: ToolDef = {
  name: 'openweathermap_forecast',
  description: 'Get 5-day weather forecast via OpenWeatherMap API.',
  input_schema: {
    type: 'object',
    properties: {
      destination: { type: 'string' },
      days: { type: 'number' },
      units: { type: 'string', enum: ['metric', 'imperial'] },
    },
    required: ['destination'],
  },
  handler: () => ({ note: 'Handled server-side' }),
};

const openmeteo_forecast: ToolDef = {
  name: 'openmeteo_forecast',
  description: 'Get a multi-day weather forecast via Open-Meteo (free, no key needed).',
  input_schema: {
    type: 'object',
    properties: {
      destination: { type: 'string' },
      forecast_days: { type: 'number' },
    },
    required: ['destination'],
  },
  handler: () => ({ note: 'Handled server-side' }),
};

// ─── Legacy stubs (kept for backward compat) ─────────────────────────────────

const search_flights: ToolDef = {
  name: 'search_flights',
  description: 'Search and rank flight options between an origin and destination.',
  input_schema: {
    type: 'object',
    properties: {
      origin: { type: 'string' },
      destination: { type: 'string' },
      depart_date: { type: 'string' },
      return_date: { type: 'string' },
      passengers: { type: 'number' },
    },
    required: ['origin', 'destination', 'depart_date', 'passengers'],
  },
  handler: () => ({ note: 'Handled server-side' }),
};

const search_hotels: ToolDef = {
  name: 'search_hotels',
  description: 'Search and rank hotel options for a destination.',
  input_schema: {
    type: 'object',
    properties: {
      destination: { type: 'string' },
      check_in: { type: 'string' },
      check_out: { type: 'string' },
      nights: { type: 'number' },
      guests: { type: 'number' },
    },
    required: ['destination'],
  },
  handler: () => ({ note: 'Handled server-side' }),
};

// ─── Itinerary tools ────────────────────────────────────────────────────────

const generate_itinerary: ToolDef = {
  name: 'generate_itinerary',
  description:
    'Research a destination and return real web results to inform a day-by-day itinerary. Use the results plus your own knowledge to write the full itinerary, then call save_itinerary when the admin approves.',
  input_schema: {
    type: 'object',
    properties: {
      trip_id: { type: 'string', description: 'The trip to generate an itinerary for' },
      style_notes: { type: 'string', description: 'Optional notes on preferred pace, must-haves, or emphasis' },
    },
    required: ['trip_id'],
  },
  handler: async ({ trip_id, style_notes }: { trip_id: string; style_notes?: string }) => {
    const trip = findById(trips, trip_id);
    if (!trip) return { error: 'Trip not found' };

    const totalDays = Math.round(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000
    ) + 1;
    const styleClause = trip.style.join(' ') + (style_notes ? ` ${style_notes}` : '');

    const [itineraryResearch, logisticsResearch] = await Promise.all([
      tavilySearch(`${trip.destination} ${totalDays} day itinerary ${styleClause} what to do`, 5),
      tavilySearch(`${trip.destination} travel logistics getting around accommodation tips`, 4),
    ]);

    return {
      trip_id,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      totalDays,
      groupSize: trip.groupSize,
      style: trip.style,
      mustHaves: trip.mustHaves,
      budgetPerPerson: `$${(trip.budgetPerPerson / 100).toFixed(0)}/pp/day`,
      itineraryResearch,
      logisticsResearch,
      instruction: `Use the research above plus your knowledge to write a ${totalDays}-day day-by-day itinerary. Present it clearly to the admin. When they approve, call save_itinerary with the full ItineraryDay array.`,
    };
  },
};

const ITINERARY_DAY_SCHEMA = {
  type: 'object' as const,
  properties: {
    day: { type: 'number' },
    date: { type: 'string' },
    location: { type: 'string' },
    activities: { type: 'array', items: { type: 'string' } },
    transit: { type: 'string' },
    lodging: { type: 'string' },
    weather_note: { type: 'string' },
    morning: { type: 'string' },
    afternoon: { type: 'string' },
    evening: { type: 'string' },
    featured_activity: { type: 'string' },
  },
};

const preview_itinerary: ToolDef = {
  name: 'preview_itinerary',
  description:
    'Stream a draft itinerary into the live UI side panel without persisting it. Call this whenever you have a working day-by-day plan to show the user, and re-call after every refinement. The result is for display only; use save_itinerary once the admin approves.',
  input_schema: {
    type: 'object',
    properties: {
      trip_id: { type: 'string' },
      destination: { type: 'string' },
      totalDays: { type: 'number' },
      itinerary: { type: 'array', items: ITINERARY_DAY_SCHEMA },
    },
    required: ['itinerary'],
  },
  handler: ({ trip_id, destination, totalDays, itinerary }) => ({
    tripId: trip_id ?? null,
    destination: destination ?? null,
    totalDays: totalDays ?? (Array.isArray(itinerary) ? itinerary.length : 0),
    itinerary,
    preview: true,
  }),
};

const build_itinerary: ToolDef = {
  name: 'build_itinerary',
  description: 'Build and persist a complete itinerary for a trip. Used by the itinerary agent.',
  input_schema: {
    type: 'object',
    properties: {
      trip_id: { type: 'string' },
      itinerary: { type: 'array', items: ITINERARY_DAY_SCHEMA },
    },
    required: ['trip_id', 'itinerary'],
  },
  handler: () => ({ note: 'Handled server-side' }),
};

const save_itinerary: ToolDef = {
  name: 'save_itinerary',
  description: 'Persist the approved itinerary onto the matching trip record. Only call once the admin explicitly approves a draft.',
  input_schema: {
    type: 'object',
    properties: {
      trip_id: { type: 'string' },
      destination: { type: 'string' },
      totalDays: { type: 'number' },
      itinerary: { type: 'array', items: ITINERARY_DAY_SCHEMA },
    },
    required: ['trip_id', 'itinerary'],
  },
  handler: ({ trip_id, itinerary }) => {
    const trip = findById(trips, trip_id);
    if (!trip) return { error: 'Trip not found' };
    trip.itinerary = itinerary as ItineraryDay[];
    return {
      saved: true,
      trip_id,
      days: itinerary.length,
      note: 'Itinerary saved. Visit the trip detail page or /proposals/' + trip_id + ' to preview.',
    };
  },
};

// ─── Registry ───────────────────────────────────────────────────────────────

const ALL: Record<string, ToolDef> = {
  list_customers,
  list_influencers,
  list_trips,
  search_operators,
  get_trip,
  list_trip_quotes,
  send_whatsapp,
  send_email,
  draft_brief,
  book_lodging,
  book_flight,
  get_weather,
  get_travel_advisory,
  get_news,
  find_compatible_customers,
  web_search_destination,
  web_search_operators,
  add_operator,
  generate_itinerary,
  preview_itinerary,
  save_itinerary,
  build_itinerary,
  search_flights,
  search_hotels,
  amadeus_search_flights,
  skyscanner_search_flights,
  kiwi_search_flights,
  booking_search_hotels,
  amadeus_search_hotels,
  viator_search_activities,
  tripadvisor_activities,
  openweathermap_forecast,
  openmeteo_forecast,
};

export function toolsFor(names: string[]): ToolDef[] {
  return names.map((n) => {
    const t = ALL[n];
    if (!t) throw new Error(`Unknown tool: ${n}`);
    return t;
  });
}

export function toAnthropicTools(defs: ToolDef[]) {
  return defs.map((d) => ({
    name: d.name,
    description: d.description,
    input_schema: d.input_schema,
  }));
}
