import {
  customers,
  influencers,
  operators,
  trips,
  quotes,
  findById,
} from '@/lib/mock-data';
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

// ─── Itinerary tools ────────────────────────────────────────────────────────

const DESTINATION_ITINERARIES: Record<string, (startDate: string) => ItineraryDay[]> = {
  annapurna: (start) => {
    const base = new Date(start);
    const d = (n: number) => new Date(base.getTime() + (n - 1) * 86400000).toISOString().slice(0, 10);
    return [
      { day: 1, date: d(1), location: 'Kathmandu', activities: ['Arrive at Tribhuvan International', 'Transfer to Thamel hotel', 'Gear check and briefing with guide', 'Welcome dinner at a rooftop restaurant'], transit: 'International flight', lodging: 'Hotel Yak & Yeti, Kathmandu' },
      { day: 2, date: d(2), location: 'Kathmandu → Pokhara', activities: ['Morning flight to Pokhara (25 min)', 'Acclimatisation walk around Phewa Lake', 'Visit Bindhyabasini Temple', 'Briefing and packing for the trail'], transit: 'Domestic flight KTM→PKR', lodging: 'Fish Tail Lodge, Pokhara' },
      { day: 3, date: d(3), location: 'Pokhara → Nayapul → Tikhedhunga', activities: ['Drive to Nayapul (1.5h)', 'Trek through Birethanti river valley', 'Steep ascent through rhododendron forest', 'Arrive Tikhedhunga (1,540 m)'], transit: 'Private jeep to Nayapul', lodging: 'Himalayan Teahouse, Tikhedhunga' },
      { day: 4, date: d(4), location: 'Tikhedhunga → Ghorepani', activities: ['Climb the famous stone staircase to Ulleri', 'Trek through dense forest of oak and rhododendron', 'Arrive Ghorepani (2,860 m)', 'Evening views of Annapurna South'], transit: 'Trek 10 km / 5h', lodging: 'Snowland Teahouse, Ghorepani' },
      { day: 5, date: d(5), location: 'Poon Hill & Tadapani', activities: ['Pre-dawn hike to Poon Hill (3,210 m) for sunrise panorama', 'Views of Dhaulagiri, Annapurna, Machapuchare', 'Return to Ghorepani for breakfast', 'Trek to Tadapani through rhododendron forest'], transit: 'Trek 14 km / 6h', lodging: 'Forest Camp Teahouse, Tadapani' },
      { day: 6, date: d(6), location: 'Tadapani → Chomrong', activities: ['Descend to Kimrong Khola river crossing', 'Steep climb to Chomrong village (2,170 m)', 'Visit local monastery', 'Arrange permits for Annapurna Sanctuary'], transit: 'Trek 9 km / 5h', lodging: 'Chomrong Cottage, Chomrong' },
      { day: 7, date: d(7), location: 'Chomrong → Dovan', activities: ['Cross Chomrong Khola suspension bridge', 'Enter Annapurna Conservation Area', 'Trek through bamboo and rhododendron forest', 'Pass Khuldighar and Bamboo villages'], transit: 'Trek 11 km / 5h', lodging: 'Dovan Teahouse' },
      { day: 8, date: d(8), location: 'Dovan → Machhapuchhre Base Camp', activities: ['Early start through Himalayan Canyon', 'Cross avalanche zones quickly in the morning', 'Pass Deurali to MBC (3,700 m)', 'First views of Machhapuchhre (Fishtail)'], transit: 'Trek 12 km / 6h', lodging: 'MBC Teahouse (3,700 m)' },
      { day: 9, date: d(9), location: 'Annapurna Base Camp (4,130 m)', activities: ['Trek to ABC — the highlight of the circuit', 'Arrive in the Annapurna amphitheatre', 'Surrounded by Annapurna I, II, III, IV, South', 'Sunset ceremony and group photo'], transit: 'Trek 5 km / 2.5h', lodging: 'ABC Mountain Lodge (4,130 m)' },
      { day: 10, date: d(10), location: 'ABC → Bamboo', activities: ['Early morning light on Annapurna I (8,091 m)', 'Begin descent — legs will feel it', 'Pass MBC and Deurali', 'Arrive Bamboo for well-earned rest'], transit: 'Trek 16 km / 7h', lodging: 'Bamboo Lodge' },
      { day: 11, date: d(11), location: 'Bamboo → Jhinu Danda', activities: ['Pass back through Chomrong', 'Descend to Jhinu Danda', 'Natural hot springs soak (1h) — post-trek bliss', 'Group dinner and storytelling'], transit: 'Trek 12 km / 5h', lodging: 'New Hot Spring Lodge, Jhinu Danda' },
      { day: 12, date: d(12), location: 'Jhinu → Nayapul → Pokhara', activities: ['Final morning descent to Siwai', 'Drive back to Pokhara', 'Lakeside stroll on Phewa Lake', 'Farewell dinner with mountain views'], transit: 'Trek 3 km + jeep to Pokhara', lodging: 'Fish Tail Lodge, Pokhara' },
      { day: 13, date: d(13), location: 'Pokhara → Kathmandu → Departure', activities: ['Morning flight to Kathmandu', 'Airport transfer and farewells', 'Optional last-minute Thamel shopping'], transit: 'Domestic flight PKR→KTM', lodging: 'None (departure day)' },
    ];
  },
  mara: (start) => {
    const base = new Date(start);
    const d = (n: number) => new Date(base.getTime() + (n - 1) * 86400000).toISOString().slice(0, 10);
    return [
      { day: 1, date: d(1), location: 'Nairobi', activities: ['Arrive at JKIA, Nairobi', 'Transfer to Karen suburb boutique hotel', 'Welcome briefing with guide and naturalist', 'Dinner at Carnivore Restaurant'], transit: 'International flight', lodging: 'The Emakoko, Karen' },
      { day: 2, date: d(2), location: 'Nairobi → Maasai Mara', activities: ['Scenic 45-min charter flight over the Rift Valley', 'Check in to tented camp', 'Afternoon game drive — lion and cheetah territory', 'Sundowner drinks on the savannah'], transit: 'Charter flight NBO→Mara airstrip', lodging: 'Savana Mara Camp, Olare Motorogi' },
      { day: 3, date: d(3), location: 'Maasai Mara — Northern Conservancy', activities: ['Dawn game drive (5:30am) — best predator activity', 'Big Five checklist: buffalo, elephant, lion, leopard spotted', 'Bush breakfast in the field', 'Afternoon: Mara River crossing observation point'], transit: 'Open 4×4 game drives', lodging: 'Savana Mara Camp' },
      { day: 4, date: d(4), location: 'Maasai Mara — Wildebeest Migration', activities: ['Full-day drive following the Great Migration herds', 'Witness a river crossing — 1.5M wildebeest + crocodiles', 'Picnic lunch in the bush', 'Return for evening cheetah tracking'], transit: 'Full-day 4×4 safari', lodging: 'Savana Mara Camp' },
      { day: 5, date: d(5), location: 'Maasai Mara — Cultural Day', activities: ['Morning: hot-air balloon safari over the Mara (optional)', 'Late breakfast back at camp', 'Afternoon: visit to local Maasai village — boma tour, school visit', 'Maasai elder talks on land rights and wildlife coexistence'], transit: 'Ground vehicle', lodging: 'Savana Mara Camp' },
      { day: 6, date: d(6), location: 'Mara → Lake Naivasha', activities: ['Morning game drive on way out', 'Charter flight to Lake Naivasha airstrip', 'Boat safari on Naivasha — hippos, herons, fish eagles', 'Walking safari on Crescent Island'], transit: 'Charter flight + boat', lodging: 'Enashipai Resort, Lake Naivasha' },
      { day: 7, date: d(7), location: 'Lake Naivasha → Hell\'s Gate', activities: ['Cycling through Hell\'s Gate National Park', 'Gorge walk with local guide', 'Geothermal spa at Olkaria (natural hot springs)', 'Sundowner overlooking the Rift Valley escarpment'], transit: 'Private vehicle', lodging: 'Enashipai Resort' },
      { day: 8, date: d(8), location: 'Naivasha → Amboseli', activities: ['Drive through Great Rift Valley floor', 'Arrive Amboseli — elephants with Kilimanjaro backdrop', 'Afternoon drive: largest elephant herds in Kenya', 'Sunset photography session at the salt flats'], transit: 'Private safari vehicle', lodging: 'Tortilis Camp, Amboseli' },
      { day: 9, date: d(9), location: 'Amboseli — Elephants & Kili Views', activities: ['Dawn drive for clear Kilimanjaro views', 'Visit Ol Tukai elephant research station', 'Afternoon: Maasai dancing and beadwork market', 'Bush dinner under the stars'], transit: 'Open 4×4 safari', lodging: 'Tortilis Camp, Amboseli' },
      { day: 10, date: d(10), location: 'Amboseli → Nairobi → Departure', activities: ['Final sunrise drive', 'Return to Nairobi by road or charter', 'Optional: lunch at Nairobi National Museum cafe', 'Airport transfer and departures'], transit: 'Charter or road to JKIA', lodging: 'None (departure day)' },
    ];
  },
  marrakech: (start) => {
    const base = new Date(start);
    const d = (n: number) => new Date(base.getTime() + (n - 1) * 86400000).toISOString().slice(0, 10);
    return [
      { day: 1, date: d(1), location: 'Marrakech', activities: ['Arrive at Marrakech Menara Airport', 'Transfer to riad in the medina', 'Rooftop mint tea welcome', 'Evening stroll through Djemaa el-Fna square'], transit: 'Airport transfer', lodging: 'Atlas Riads Collection, Medina' },
      { day: 2, date: d(2), location: 'Marrakech — Medina Deep Dive', activities: ['Morning: guided souks tour (spices, leather, metalwork)', 'Medersa Ben Youssef — Islamic geometry masterclass', 'Lunch: bastilla at a family-run dar', 'Afternoon: Bahia Palace and El Badi ruins'], transit: 'Walking', lodging: 'Atlas Riads Collection' },
      { day: 3, date: d(3), location: 'Marrakech — Cooking & Gardens', activities: ['Sunrise Majorelle Garden visit (before crowds)', 'Private Moroccan cooking class — tagine, couscous, msemen', 'Afternoon: Hammam and spa', 'Evening: Mouassine neighbourhood dinner'], transit: 'Walking + petits taxis', lodging: 'Atlas Riads Collection' },
      { day: 4, date: d(4), location: 'Atlas Mountains Day Trip', activities: ['Drive into the High Atlas (Ourika Valley)', 'Hike to Setti Fatma waterfalls', 'Lunch with Berber family', 'Return via Asni weekly market'], transit: 'Private van', lodging: 'Atlas Riads Collection' },
      { day: 5, date: d(5), location: 'Essaouira', activities: ['Morning drive to coastal Essaouira (2.5h)', 'Blue-and-white medina wander', 'Fish lunch at the port', 'Sunset on the Skala ramparts'], transit: 'Private van', lodging: 'Heure Bleue Palais, Essaouira' },
      { day: 6, date: d(6), location: 'Essaouira → Marrakech', activities: ['Morning: Gnawa music walk in the medina', 'Argan cooperative visit — cold-press demo', 'Return to Marrakech by midday', 'Free afternoon for last shopping'], transit: 'Private van', lodging: 'Atlas Riads Collection' },
      { day: 7, date: d(7), location: 'Marrakech — Food Market Day', activities: ['Mellah (Jewish quarter) food market at dawn', 'Orange juice and sfenj breakfast in the square', 'Olive and preserved lemon stalls tour', 'Private dinner: 6-course Moroccan feast at the riad'], transit: 'Walking', lodging: 'Atlas Riads Collection' },
      { day: 8, date: d(8), location: 'Fès day trip (optional) or Marrakech free', activities: ['Optional: first flight to Fès for a day trip (Blue Gate, tanneries)', 'Or: leisure morning, rooftop breakfast', 'Afternoon: Yves Saint Laurent Museum', 'Farewell dinner at Naranj rooftop'], transit: 'Domestic flight or local', lodging: 'Atlas Riads Collection' },
      { day: 9, date: d(9), location: 'Marrakech → Departure', activities: ['Morning hammam for last time', 'Transfer to airport', 'Departures'], transit: 'Airport transfer', lodging: 'None (departure day)' },
    ];
  },
  nosara: (start) => {
    const base = new Date(start);
    const d = (n: number) => new Date(base.getTime() + (n - 1) * 86400000).toISOString().slice(0, 10);
    return [
      { day: 1, date: d(1), location: 'Nosara, Costa Rica', activities: ['Arrive at Nosara airstrip or transfer from SJO', 'Check in to beachfront villa', 'Sunset surf session at Playa Guiones', 'Welcome BBQ at the villa'], transit: 'Charter flight or private transfer from SJO', lodging: 'Playa Guiones Villa (8 pax)' },
      { day: 2, date: d(2), location: 'Nosara — Surf Foundations', activities: ['6am: guided surf lesson at Playa Guiones (2h)', 'Post-surf smoothie bowls at the villa', 'Afternoon: yoga session at Bodhi Tree Yoga Resort', 'Evening: traditional casado dinner at local soda'], transit: 'Walking to beach', lodging: 'Playa Guiones Villa' },
      { day: 3, date: d(3), location: 'Nosara — Advanced Surf + Sauna', activities: ['Dawn patrol surf — intermediate group splits off to boat trip', 'Midday: traditional Finnish sauna at Iguana Sauna', 'Cold plunge in the ocean', 'Afternoon: stand-up paddleboard tour of mangroves'], transit: 'Walking / bikes', lodging: 'Playa Guiones Villa' },
      { day: 4, date: d(4), location: 'Nosara — Wellness Day', activities: ['Morning meditation on the beach (sunrise)', 'Full-day at leisure — surfing, reading, hammock', 'Afternoon: massage at Harmony Hotel spa', 'Group dinner at La Luna restaurant'], transit: 'None', lodging: 'Playa Guiones Villa' },
      { day: 5, date: d(5), location: 'Nicoya Peninsula Exploration', activities: ['Boat trip to Isla Gitana for snorkeling', 'Sea turtle nesting site visit (seasonal)', 'Beach lunch on a secluded cove', 'Return for sunset sauna session'], transit: 'Boat tour', lodging: 'Playa Guiones Villa' },
      { day: 6, date: d(6), location: 'Nosara — Final Surf', activities: ['Last morning surf competition among the group', 'Awards breakfast: best wipeout and best wave', 'Pack up and final swim', 'Afternoon transfers to SJO for departures'], transit: 'Private transfer to San José', lodging: 'None (departure day)' },
    ];
  },
};

const generate_itinerary: ToolDef = {
  name: 'generate_itinerary',
  description:
    'Generate a day-by-day itinerary for a trip. Returns an array of ItineraryDay objects based on the destination, style, and dates. Does NOT save — call save_itinerary after reviewing.',
  input_schema: {
    type: 'object',
    properties: {
      trip_id: { type: 'string', description: 'The trip to generate an itinerary for' },
      style_notes: { type: 'string', description: 'Optional notes on preferred pace, must-haves, or emphasis' },
    },
    required: ['trip_id'],
  },
  handler: ({ trip_id }) => {
    const trip = findById(trips, trip_id);
    if (!trip) return { error: 'Trip not found' };
    const key = Object.keys(DESTINATION_ITINERARIES).find((k) =>
      trip.destination.toLowerCase().includes(k) || trip.id.toLowerCase().includes(k)
    );
    const itinerary = key ? DESTINATION_ITINERARIES[key](trip.startDate) : null;
    if (!itinerary) {
      return {
        error: `No template for "${trip.destination}". Available: ${Object.keys(DESTINATION_ITINERARIES).join(', ')}`,
      };
    }
    return {
      generated: true,
      trip_id,
      destination: trip.destination,
      days: itinerary.length,
      itinerary,
      note: 'Preview only — call save_itinerary(trip_id, itinerary) to persist.',
    };
  },
};

const save_itinerary: ToolDef = {
  name: 'save_itinerary',
  description: 'Persist a generated itinerary to a trip. Pass the itinerary array returned by generate_itinerary.',
  input_schema: {
    type: 'object',
    properties: {
      trip_id: { type: 'string' },
      itinerary: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            day: { type: 'number' },
            date: { type: 'string' },
            location: { type: 'string' },
            activities: { type: 'array', items: { type: 'string' } },
            transit: { type: 'string' },
            lodging: { type: 'string' },
          },
        },
      },
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
  generate_itinerary,
  save_itinerary,
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
