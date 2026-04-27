import type {
  Customer,
  Influencer,
  Operator,
  TripBrief,
  Quote,
  Message,
  AgentEvent,
} from './types';

const COLORS = ['#e07a5f', '#81b29a', '#f2cc8f', '#3d405b', '#a8dadc', '#e76f51', '#a6b1e1', '#cdb4db'];
const c = (i: number) => COLORS[i % COLORS.length];

export const influencers: Influencer[] = [
  {
    id: 'inf_jamie',
    name: 'Jamie Chen',
    handle: '@travelwithjamie',
    email: 'jamie@travelwithjamie.co',
    avatarColor: c(0),
    followers: 184_000,
    niches: ['hiking', 'expedition', 'cultural'],
    regions: ['Nepal', 'Patagonia', 'Iceland'],
    bio: 'Mountain trips with substance. Small groups, big country.',
    activeTrips: 3,
  },
  {
    id: 'inf_maya',
    name: 'Maya Okafor',
    handle: '@maya.wanders',
    email: 'maya@mayawanders.com',
    avatarColor: c(1),
    followers: 92_400,
    niches: ['safari', 'cultural', 'culinary'],
    regions: ['Kenya', 'Morocco', 'Senegal'],
    bio: 'Slow travel across Africa. Food, family, stories.',
    activeTrips: 2,
  },
  {
    id: 'inf_lucas',
    name: 'Lucas Brandt',
    handle: '@lucas.surf',
    email: 'lucas@lucasbrandt.surf',
    avatarColor: c(2),
    followers: 56_900,
    niches: ['beach', 'wellness'],
    regions: ['Costa Rica', 'Portugal', 'Bali'],
    bio: 'Surf + sauna. Nothing else.',
    activeTrips: 1,
  },
];

export const operators: Operator[] = [
  {
    id: 'op_andes',
    company: 'AndesTours Patagonia',
    contactName: 'Sofía Ramírez',
    whatsapp: '+54 9 2944 555 010',
    email: 'sofia@andestours.ar',
    country: 'Argentina',
    region: 'Patagonia',
    specialties: ['expedition', 'hiking'],
    rating: 4.8,
    responseHours: 4,
    priceTier: '$$',
    notes: 'Reliable. Speaks fluent English. Owns mountain lodge.',
  },
  {
    id: 'op_himalaya',
    company: 'Nepal Vision Treks',
    contactName: 'Pemba Sherpa',
    whatsapp: '+977 98 1234 5678',
    email: 'pemba@nepalvision.np',
    country: 'Nepal',
    region: 'Annapurna',
    specialties: ['hiking', 'expedition', 'cultural'],
    rating: 4.9,
    responseHours: 6,
    priceTier: '$$',
  },
  {
    id: 'op_savana',
    company: 'Savana Camps',
    contactName: 'Daniel Otieno',
    whatsapp: '+254 712 880 220',
    email: 'daniel@savanacamps.ke',
    country: 'Kenya',
    region: 'Maasai Mara',
    specialties: ['safari', 'cultural'],
    rating: 4.7,
    responseHours: 8,
    priceTier: '$$$',
  },
  {
    id: 'op_atlas',
    company: 'Atlas Riads',
    contactName: 'Yasmine El Idrissi',
    whatsapp: '+212 661 700 130',
    email: 'yasmine@atlasriads.ma',
    country: 'Morocco',
    region: 'Marrakech',
    specialties: ['cultural', 'culinary'],
    rating: 4.6,
    responseHours: 12,
    priceTier: '$$',
  },
  {
    id: 'op_pura',
    company: 'Pura Vida Surf',
    contactName: 'Ana Quirós',
    whatsapp: '+506 8888 4422',
    email: 'ana@puravidasurf.cr',
    country: 'Costa Rica',
    region: 'Nosara',
    specialties: ['beach', 'wellness'],
    rating: 4.8,
    responseHours: 3,
    priceTier: '$$',
  },
  {
    id: 'op_bali',
    company: 'Ubud Collective',
    contactName: 'Wayan Sutrisna',
    whatsapp: '+62 812 3700 9001',
    email: 'wayan@ubudcollective.id',
    country: 'Indonesia',
    region: 'Bali',
    specialties: ['wellness', 'cultural', 'culinary'],
    rating: 4.5,
    responseHours: 10,
    priceTier: '$',
  },
];

export const customers: Customer[] = [
  {
    id: 'cus_priya',
    name: 'Priya Shah',
    email: 'priya.shah@gmail.com',
    avatarColor: c(3),
    city: 'Brooklyn',
    country: 'USA',
    age: 29,
    joinedAt: '2026-03-12',
    influencerId: 'inf_jamie',
    interests: ['hiking', 'cultural'],
    budgetMin: 280_000,
    budgetMax: 450_000,
    groupSize: 2,
    availability: ['fall'],
    status: 'matched',
    notes: 'First international hike. Wants moderate difficulty.',
    nationality: 'USA',
    passportExpiry: '2029-08-14',
    documents: [],
  },
  {
    id: 'cus_marcus',
    name: 'Marcus Reilly',
    email: 'marcus.r@hey.com',
    avatarColor: c(4),
    city: 'London',
    country: 'UK',
    age: 34,
    joinedAt: '2026-03-22',
    influencerId: 'inf_jamie',
    interests: ['expedition'],
    budgetMin: 450_000,
    budgetMax: 800_000,
    groupSize: 1,
    availability: ['summer', 'fall'],
    status: 'briefed',
    nationality: 'UK',
    passportExpiry: '2027-03-02',
    documents: [],
  },
  {
    id: 'cus_sara',
    name: 'Sara Lindqvist',
    email: 'sara.lindqvist@proton.me',
    avatarColor: c(5),
    city: 'Stockholm',
    country: 'Sweden',
    age: 31,
    joinedAt: '2026-04-01',
    influencerId: 'inf_maya',
    interests: ['safari', 'cultural'],
    budgetMin: 600_000,
    budgetMax: 900_000,
    groupSize: 4,
    availability: ['summer'],
    status: 'paid',
    notes: 'Family of 4. Two kids ages 9 and 12.',
    nationality: 'Sweden',
    passportExpiry: '2031-01-19',
    documents: [],
  },
  {
    id: 'cus_dev',
    name: 'Dev Patel',
    email: 'dev@devpatel.dev',
    avatarColor: c(6),
    city: 'Toronto',
    country: 'Canada',
    age: 27,
    joinedAt: '2026-04-08',
    influencerId: 'inf_lucas',
    interests: ['beach', 'wellness'],
    budgetMin: 200_000,
    budgetMax: 350_000,
    groupSize: 3,
    availability: ['winter'],
    status: 'lead',
    nationality: 'Canada',
    passportExpiry: '2028-11-30',
    documents: [],
  },
  {
    id: 'cus_aisha',
    name: 'Aisha Bello',
    email: 'aisha.bello@outlook.com',
    avatarColor: c(7),
    city: 'Lagos',
    country: 'Nigeria',
    age: 26,
    joinedAt: '2026-04-14',
    influencerId: 'inf_maya',
    interests: ['culinary', 'cultural'],
    budgetMin: 180_000,
    budgetMax: 320_000,
    groupSize: 2,
    availability: ['fall', 'winter'],
    status: 'briefed',
    nationality: 'Nigeria',
    passportExpiry: '2027-09-05',
    documents: [],
  },
  {
    id: 'cus_yuki',
    name: 'Yuki Tanaka',
    email: 'yuki.t@icloud.com',
    avatarColor: c(0),
    city: 'Osaka',
    country: 'Japan',
    age: 38,
    joinedAt: '2026-04-19',
    influencerId: 'inf_jamie',
    interests: ['hiking', 'wellness'],
    budgetMin: 350_000,
    budgetMax: 500_000,
    groupSize: 2,
    availability: ['spring'],
    status: 'matched',
    nationality: 'Japan',
    passportExpiry: '2030-06-22',
    documents: [],
  },
];

export const trips: TripBrief[] = [
  {
    id: 'trip_annapurna',
    title: 'Annapurna Circuit — Oct 2026',
    influencerId: 'inf_jamie',
    customerIds: ['cus_priya', 'cus_yuki'],
    destination: 'Annapurna, Nepal',
    region: 'Annapurna',
    style: ['hiking', 'cultural'],
    season: 'fall',
    startDate: '2026-10-12',
    endDate: '2026-10-25',
    groupSize: 8,
    budgetPerPerson: 380_000,
    mustHaves: ['Teahouse stays', 'Local guide', 'Vegetarian-friendly'],
    status: 'quoting',
    createdAt: '2026-04-02',
    itinerary: [
      { day: 1, date: '2026-10-12', location: 'Kathmandu', activities: ['Arrive at Tribhuvan International', 'Transfer to Thamel hotel', 'Gear check and briefing with guide', 'Welcome dinner at a rooftop restaurant'], transit: 'International flight', lodging: 'Hotel Yak & Yeti, Kathmandu' },
      { day: 2, date: '2026-10-13', location: 'Kathmandu → Pokhara', activities: ['Morning flight to Pokhara (25 min)', 'Acclimatisation walk around Phewa Lake', 'Visit Bindhyabasini Temple', 'Briefing and packing for the trail'], transit: 'Domestic flight KTM→PKR', lodging: 'Fish Tail Lodge, Pokhara' },
      { day: 3, date: '2026-10-14', location: 'Pokhara → Tikhedhunga', activities: ['Drive to Nayapul (1.5h)', 'Trek through Birethanti river valley', 'Steep ascent through rhododendron forest', 'Arrive Tikhedhunga (1,540 m)'], transit: 'Private jeep to Nayapul', lodging: 'Himalayan Teahouse, Tikhedhunga' },
      { day: 4, date: '2026-10-15', location: 'Tikhedhunga → Ghorepani', activities: ['Climb the famous stone staircase to Ulleri', 'Trek through dense forest of oak and rhododendron', 'Arrive Ghorepani (2,860 m)', 'Evening views of Annapurna South'], transit: 'Trek 10 km / 5h', lodging: 'Snowland Teahouse, Ghorepani' },
      { day: 5, date: '2026-10-16', location: 'Poon Hill & Tadapani', activities: ['Pre-dawn hike to Poon Hill (3,210 m) for sunrise panorama', 'Views of Dhaulagiri, Annapurna, Machapuchare', 'Return to Ghorepani for breakfast', 'Trek to Tadapani through rhododendron forest'], transit: 'Trek 14 km / 6h', lodging: 'Forest Camp Teahouse, Tadapani' },
      { day: 6, date: '2026-10-17', location: 'Tadapani → Chomrong', activities: ['Descend to Kimrong Khola river crossing', 'Steep climb to Chomrong village (2,170 m)', 'Visit local monastery', 'Arrange permits for Annapurna Sanctuary'], transit: 'Trek 9 km / 5h', lodging: 'Chomrong Cottage' },
      { day: 7, date: '2026-10-18', location: 'Chomrong → Dovan', activities: ['Cross Chomrong Khola suspension bridge', 'Enter Annapurna Conservation Area', 'Trek through bamboo and rhododendron forest', 'Pass Khuldighar and Bamboo villages'], transit: 'Trek 11 km / 5h', lodging: 'Dovan Teahouse' },
      { day: 8, date: '2026-10-19', location: 'Dovan → Machhapuchhre Base Camp', activities: ['Early start through Himalayan Canyon', 'Cross avalanche zones quickly in the morning', 'Pass Deurali to MBC (3,700 m)', 'First views of Machhapuchhre (Fishtail)'], transit: 'Trek 12 km / 6h', lodging: 'MBC Teahouse (3,700 m)' },
      { day: 9, date: '2026-10-20', location: 'Annapurna Base Camp (4,130 m)', activities: ['Trek to ABC — the highlight of the circuit', 'Arrive in the Annapurna amphitheatre', 'Surrounded by Annapurna I, II, III, IV, South', 'Sunset ceremony and group photo'], transit: 'Trek 5 km / 2.5h', lodging: 'ABC Mountain Lodge (4,130 m)' },
      { day: 10, date: '2026-10-21', location: 'ABC → Bamboo', activities: ['Early morning light on Annapurna I (8,091 m)', 'Begin descent', 'Pass MBC and Deurali', 'Arrive Bamboo for well-earned rest'], transit: 'Trek 16 km / 7h', lodging: 'Bamboo Lodge' },
      { day: 11, date: '2026-10-22', location: 'Bamboo → Jhinu Danda', activities: ['Pass back through Chomrong', 'Descend to Jhinu Danda', 'Natural hot springs soak (1h)', 'Group dinner and storytelling'], transit: 'Trek 12 km / 5h', lodging: 'New Hot Spring Lodge, Jhinu Danda' },
      { day: 12, date: '2026-10-23', location: 'Jhinu → Pokhara', activities: ['Final morning descent to Siwai', 'Drive back to Pokhara', 'Lakeside stroll on Phewa Lake', 'Farewell dinner with mountain views'], transit: 'Trek 3 km + jeep to Pokhara', lodging: 'Fish Tail Lodge, Pokhara' },
      { day: 13, date: '2026-10-24', location: 'Pokhara → Kathmandu → Departure', activities: ['Morning flight to Kathmandu', 'Airport transfer and farewells', 'Optional last-minute Thamel shopping'], transit: 'Domestic flight PKR→KTM', lodging: 'None (departure day)' },
    ],
  },
  {
    id: 'trip_mara',
    title: 'Maasai Mara Family Safari',
    influencerId: 'inf_maya',
    customerIds: ['cus_sara'],
    destination: 'Maasai Mara, Kenya',
    region: 'Maasai Mara',
    style: ['safari', 'cultural'],
    season: 'summer',
    startDate: '2026-07-18',
    endDate: '2026-07-28',
    groupSize: 4,
    budgetPerPerson: 750_000,
    mustHaves: ['Kid-friendly camp', 'Private vehicle', 'Cultural visit'],
    status: 'booked',
    createdAt: '2026-03-08',
    acceptedQuoteId: 'q_savana_1',
    itinerary: [
      { day: 1, date: '2026-07-18', location: 'Nairobi', activities: ['Arrive at JKIA, Nairobi', 'Transfer to Karen suburb boutique hotel', 'Welcome briefing with guide and naturalist', 'Dinner at Carnivore Restaurant'], transit: 'International flight', lodging: 'The Emakoko, Karen' },
      { day: 2, date: '2026-07-19', location: 'Nairobi → Maasai Mara', activities: ['Scenic 45-min charter flight over the Rift Valley', 'Check in to tented camp', 'Afternoon game drive — lion and cheetah territory', 'Sundowner drinks on the savannah'], transit: 'Charter flight NBO→Mara airstrip', lodging: 'Savana Mara Camp, Olare Motorogi' },
      { day: 3, date: '2026-07-20', location: 'Maasai Mara — Northern Conservancy', activities: ['Dawn game drive (5:30am) — best predator activity', 'Big Five checklist: buffalo, elephant, lion, leopard spotted', 'Bush breakfast in the field', 'Afternoon: Mara River crossing observation point'], transit: 'Open 4×4 game drives', lodging: 'Savana Mara Camp' },
      { day: 4, date: '2026-07-21', location: 'Maasai Mara — Wildebeest Migration', activities: ['Full-day drive following the Great Migration herds', 'Witness a river crossing — 1.5M wildebeest + crocodiles', 'Picnic lunch in the bush', 'Return for evening cheetah tracking'], transit: 'Full-day 4×4 safari', lodging: 'Savana Mara Camp' },
      { day: 5, date: '2026-07-22', location: 'Maasai Mara — Cultural Day', activities: ['Optional hot-air balloon safari over the Mara', 'Late breakfast back at camp', 'Afternoon: visit to local Maasai village — boma tour, school visit', 'Maasai elder talks on land rights and wildlife coexistence'], transit: 'Ground vehicle', lodging: 'Savana Mara Camp' },
      { day: 6, date: '2026-07-23', location: 'Mara → Lake Naivasha', activities: ['Morning game drive on way out', 'Charter flight to Lake Naivasha airstrip', 'Boat safari on Naivasha — hippos, herons, fish eagles', 'Walking safari on Crescent Island'], transit: 'Charter flight + boat', lodging: 'Enashipai Resort, Lake Naivasha' },
      { day: 7, date: '2026-07-24', location: 'Lake Naivasha → Hell\'s Gate', activities: ['Cycling through Hell\'s Gate National Park', 'Gorge walk with local guide', 'Geothermal spa at Olkaria (natural hot springs)', 'Sundowner overlooking the Rift Valley escarpment'], transit: 'Private vehicle', lodging: 'Enashipai Resort' },
      { day: 8, date: '2026-07-25', location: 'Naivasha → Amboseli', activities: ['Drive through Great Rift Valley floor', 'Arrive Amboseli — elephants with Kilimanjaro backdrop', 'Afternoon drive: largest elephant herds in Kenya', 'Sunset photography session at the salt flats'], transit: 'Private safari vehicle', lodging: 'Tortilis Camp, Amboseli' },
      { day: 9, date: '2026-07-26', location: 'Amboseli — Elephants & Kili Views', activities: ['Dawn drive for clear Kilimanjaro views', 'Visit Ol Tukai elephant research station', 'Afternoon: Maasai dancing and beadwork market', 'Bush dinner under the stars'], transit: 'Open 4×4 safari', lodging: 'Tortilis Camp, Amboseli' },
      { day: 10, date: '2026-07-27', location: 'Amboseli → Nairobi → Departure', activities: ['Final sunrise drive', 'Return to Nairobi by charter', 'Optional: lunch at Nairobi National Museum cafe', 'Airport transfer and departures'], transit: 'Charter or road to JKIA', lodging: 'None (departure day)' },
    ],
  },
  {
    id: 'trip_marrakech',
    title: 'Marrakech to Fez — Culinary Trail',
    influencerId: 'inf_maya',
    customerIds: ['cus_aisha'],
    destination: 'Morocco',
    region: 'Marrakech',
    style: ['cultural', 'culinary'],
    season: 'fall',
    startDate: '2026-11-04',
    endDate: '2026-11-13',
    groupSize: 6,
    budgetPerPerson: 290_000,
    mustHaves: ['Cooking class', 'Riad stays', 'Train between cities'],
    status: 'sourcing',
    createdAt: '2026-04-18',
    itinerary: [],
  },
  {
    id: 'trip_patagonia',
    title: 'Patagonia W-Trek',
    influencerId: 'inf_jamie',
    customerIds: ['cus_marcus'],
    destination: 'Torres del Paine, Chile',
    region: 'Patagonia',
    style: ['expedition', 'hiking'],
    season: 'fall',
    startDate: '2026-11-20',
    endDate: '2026-11-30',
    groupSize: 6,
    budgetPerPerson: 620_000,
    mustHaves: ['Camp + refugio mix', 'English-speaking guide'],
    status: 'brief',
    createdAt: '2026-04-22',
    itinerary: [],
  },
  {
    id: 'trip_nosara',
    title: 'Nosara Surf & Sauna',
    influencerId: 'inf_lucas',
    customerIds: ['cus_dev'],
    destination: 'Nosara, Costa Rica',
    region: 'Nosara',
    style: ['beach', 'wellness'],
    season: 'winter',
    startDate: '2026-12-14',
    endDate: '2026-12-21',
    groupSize: 8,
    budgetPerPerson: 280_000,
    mustHaves: ['Beachfront villa', 'Daily yoga', '2x surf coaching'],
    status: 'brief',
    createdAt: '2026-04-24',
    itinerary: [],
  },
];

export const quotes: Quote[] = [
  {
    id: 'q_himalaya_1',
    tripId: 'trip_annapurna',
    operatorId: 'op_himalaya',
    status: 'received',
    totalCents: 8 * 360_000,
    perPersonCents: 360_000,
    currency: 'USD',
    includes: ['Guide', 'Porters', 'Teahouse stays', 'All meals on trail', 'Permits'],
    excludes: ['Flights', 'Travel insurance'],
    receivedAt: '2026-04-20T08:14:00Z',
    notes: 'Can swap teahouse for boutique lodge in Manang for +$140 pp.',
  },
  {
    id: 'q_savana_1',
    tripId: 'trip_mara',
    operatorId: 'op_savana',
    status: 'accepted',
    totalCents: 4 * 720_000,
    perPersonCents: 720_000,
    currency: 'USD',
    includes: ['Tented camp (private)', 'Game drives', 'Cultural visit', 'All meals'],
    excludes: ['International flights', 'Tips'],
    receivedAt: '2026-03-15T11:00:00Z',
  },
  {
    id: 'q_atlas_1',
    tripId: 'trip_marrakech',
    operatorId: 'op_atlas',
    status: 'requested',
    totalCents: 0,
    perPersonCents: 0,
    currency: 'USD',
    includes: [],
    excludes: [],
    receivedAt: null,
  },
];

export const messages: Message[] = [
  {
    id: 'msg_1',
    tripId: 'trip_annapurna',
    operatorId: 'op_himalaya',
    customerId: null,
    channel: 'whatsapp',
    direction: 'out',
    body: "Hi Pemba — Jamie Chen is putting together an Annapurna trip Oct 12-25 for 8. Budget ~$380/pp/day. Can you send a quote with teahouse stays and a vegetarian-friendly option?",
    sentAt: '2026-04-19T15:02:00Z',
    fromAgent: 'negotiator',
  },
  {
    id: 'msg_2',
    tripId: 'trip_annapurna',
    operatorId: 'op_himalaya',
    customerId: null,
    channel: 'whatsapp',
    direction: 'in',
    body: "Yes! We can do this. Quote attached: $360/pp covers guide, porters, teahouse stays, all meals on trail, permits. Boutique lodge in Manang available +$140pp.",
    sentAt: '2026-04-20T08:14:00Z',
  },
  {
    id: 'msg_3',
    tripId: 'trip_marrakech',
    operatorId: 'op_atlas',
    customerId: null,
    channel: 'whatsapp',
    direction: 'out',
    body: "Hi Yasmine — looking for an 8-day Marrakech-to-Fez culinary trip in early November. 6 pax, $290/pp/day. Cooking class + riad stays + train between cities. Can you quote?",
    sentAt: '2026-04-25T09:30:00Z',
    fromAgent: 'negotiator',
  },
  {
    id: 'msg_4',
    tripId: null,
    operatorId: null,
    customerId: 'cus_dev',
    channel: 'portal',
    direction: 'in',
    body: "Found you through Lucas. Three of us want a winter beach-and-yoga thing. Around $300/pp/day. Costa Rica or Bali ideally.",
    sentAt: '2026-04-24T17:45:00Z',
  },
];

export const agentEvents: AgentEvent[] = [
  {
    id: 'evt_1',
    agent: 'concierge',
    tripId: 'trip_nosara',
    kind: 'completed',
    summary: 'Drafted brief for Dev Patel — Nosara Surf & Sauna',
    detail: '3 pax, winter, $280pp/day, beachfront villa + 2x surf coaching',
    at: '2026-04-24T17:48:00Z',
  },
  {
    id: 'evt_2',
    agent: 'matchmaker',
    tripId: 'trip_nosara',
    kind: 'tool_call',
    summary: 'Searched operators in Costa Rica + Bali',
    detail: 'Found 4 candidates; ranked by fit',
    at: '2026-04-24T17:51:00Z',
  },
  {
    id: 'evt_3',
    agent: 'negotiator',
    tripId: 'trip_marrakech',
    kind: 'message',
    summary: 'Sent quote request to Atlas Riads',
    detail: 'WhatsApp · awaiting reply',
    at: '2026-04-25T09:30:00Z',
  },
  {
    id: 'evt_4',
    agent: 'negotiator',
    tripId: 'trip_annapurna',
    kind: 'tool_result',
    summary: 'Parsed quote from Nepal Vision Treks',
    detail: '$360 pp · meets budget · vegetarian noted',
    at: '2026-04-20T08:16:00Z',
  },
  {
    id: 'evt_5',
    agent: 'social',
    kind: 'message',
    summary: 'Suggested grouping Priya + Yuki on Annapurna trip',
    detail: 'Compatible interests, dates, group sizes',
    at: '2026-04-21T10:00:00Z',
  },
];

export function findById<T extends { id: string }>(arr: T[], id: string | null | undefined): T | undefined {
  if (!id) return undefined;
  return arr.find((x) => x.id === id);
}

// ─── Calendar Events ─────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:MM (24h), undefined = all-day
  endTime?: string;   // HH:MM
  kind: 'meeting' | 'departure' | 'deadline' | 'task' | 'return';
  tripId?: string;
  customerId?: string;
  influencerId?: string;
  description?: string;
}

export const calendarEvents: CalendarEvent[] = [
  { id: 'cal_1', title: 'Call with Priya — trip brief review', date: '2026-04-28', time: '10:00', endTime: '10:30', kind: 'meeting', customerId: 'cus_priya', tripId: 'trip_annapurna', description: 'Review Annapurna itinerary draft and confirm must-haves.' },
  { id: 'cal_2', title: 'Matchmaker review — Patagonia shortlist', date: '2026-04-30', time: '14:00', endTime: '14:45', kind: 'task', tripId: 'trip_patagonia', description: 'Agent will present 3 shortlisted operators for Marcus\'s W-Trek.' },
  { id: 'cal_3', title: 'Influencer strategy call — Jamie, Maya, Lucas', date: '2026-05-01', time: '11:00', endTime: '12:00', kind: 'meeting', description: 'Q2 trip pipeline review and social content calendar.' },
  { id: 'cal_4', title: 'Quote deadline — Atlas Riads (Marrakech)', date: '2026-05-02', kind: 'deadline', tripId: 'trip_marrakech', description: 'Final day to receive a quote from Atlas Riads before moving to backup operators.' },
  { id: 'cal_5', title: 'Call with Sara — Mara safari debrief', date: '2026-05-05', time: '15:00', endTime: '15:30', kind: 'meeting', customerId: 'cus_sara', tripId: 'trip_mara', description: 'Post-booking check-in: confirm logistics, visas, family packing list.' },
  { id: 'cal_6', title: 'Patagonia operator selection due', date: '2026-05-08', kind: 'deadline', tripId: 'trip_patagonia', description: 'Negotiator must have accepted or rejected all quotes.' },
  { id: 'cal_7', title: 'Nosara brief kickoff — Dev Patel', date: '2026-05-10', time: '09:00', endTime: '09:45', kind: 'meeting', customerId: 'cus_dev', tripId: 'trip_nosara', description: 'First call with Dev to walk through the Nosara Surf & Sauna itinerary draft.' },
  { id: 'cal_8', title: 'Monthly influencer performance review', date: '2026-05-15', time: '10:00', endTime: '11:30', kind: 'meeting', description: 'Revenue, bookings, and lead pipeline review for all three influencers.' },
  { id: 'cal_9', title: 'Call with Yuki — Annapurna logistics', date: '2026-05-18', time: '16:00', endTime: '16:30', kind: 'meeting', customerId: 'cus_yuki', tripId: 'trip_annapurna', description: 'Confirm gear list, visa application status, insurance.' },
  { id: 'cal_10', title: 'Marrakech proposal sent to Aisha', date: '2026-05-20', kind: 'task', tripId: 'trip_marrakech', customerId: 'cus_aisha', description: 'Proposal reviewed and emailed via Concierge agent.' },
  { id: 'cal_11', title: 'Maasai Mara Safari — DEPARTS', date: '2026-07-18', kind: 'departure', tripId: 'trip_mara', influencerId: 'inf_maya', description: 'Sara Lindqvist group. Charter from JKIA → Mara airstrip.' },
  { id: 'cal_12', title: 'Maasai Mara Safari — RETURNS', date: '2026-07-28', kind: 'return', tripId: 'trip_mara', influencerId: 'inf_maya' },
  { id: 'cal_13', title: 'Annapurna Circuit — DEPARTS', date: '2026-10-12', kind: 'departure', tripId: 'trip_annapurna', influencerId: 'inf_jamie', description: 'Priya + Yuki group. KTM arrival day.' },
  { id: 'cal_14', title: 'Annapurna Circuit — RETURNS', date: '2026-10-24', kind: 'return', tripId: 'trip_annapurna', influencerId: 'inf_jamie' },
  { id: 'cal_15', title: 'Marrakech Culinary Trail — DEPARTS', date: '2026-11-04', kind: 'departure', tripId: 'trip_marrakech', influencerId: 'inf_maya' },
  { id: 'cal_16', title: 'Patagonia W-Trek — DEPARTS', date: '2026-11-20', kind: 'departure', tripId: 'trip_patagonia', influencerId: 'inf_jamie' },
  { id: 'cal_17', title: 'Nosara Surf & Sauna — DEPARTS', date: '2026-12-14', kind: 'departure', tripId: 'trip_nosara', influencerId: 'inf_lucas' },
  { id: 'cal_18', title: 'Q3 travel trends review', date: '2026-05-22', time: '14:00', endTime: '15:00', kind: 'meeting', description: 'Discuss destination trends, emerging markets, competitor analysis.' },
  { id: 'cal_19', title: 'Operator vetting — new Bali partner', date: '2026-05-06', time: '11:00', endTime: '11:45', kind: 'meeting', description: 'Video call with Ubud Collective to discuss exclusive pricing.' },
  { id: 'cal_20', title: 'Aisha passport check reminder', date: '2026-05-12', kind: 'task', customerId: 'cus_aisha', description: 'Passport expires Sep 2027 — confirm validity for Morocco entry.' },
];

// ─── Forum Posts ─────────────────────────────────────────────────────────────

export interface ForumPost {
  id: string;
  category: 'general' | 'destinations' | 'planning' | 'gear' | 'operators' | 'announcements';
  title: string;
  body: string;
  authorName: string;
  authorRole: 'influencer' | 'customer' | 'operator' | 'team';
  createdAt: string;
  replies: number;
  views: number;
  pinned?: boolean;
  tags?: string[];
}

export const forumPosts: ForumPost[] = [
  { id: 'post_1', category: 'announcements', title: 'Welcome to the Wanderkit Community — how it works', body: 'This is your space to share trip intel, ask questions, and connect with other travelers and creators on the platform. Here\'s a quick guide to how the community works...', authorName: 'Wanderkit Team', authorRole: 'team', createdAt: '2026-04-01T09:00:00Z', replies: 12, views: 340, pinned: true, tags: ['welcome', 'guide'] },
  { id: 'post_2', category: 'destinations', title: 'Annapurna in October — what to expect (teahouse edition)', body: 'Just got back from scouting the Annapurna Circuit in October. The rhododendron forests are bare but the mountain views are stunning. Teahouse availability is good but book Manang early...', authorName: 'Jamie Chen', authorRole: 'influencer', createdAt: '2026-04-15T14:22:00Z', replies: 28, views: 512, tags: ['nepal', 'hiking', 'annapurna'] },
  { id: 'post_3', category: 'destinations', title: 'Maasai Mara river crossings — July vs August?', body: 'Sara\'s trip is in late July. Our operator says crossings usually peak late July/early August. Anyone have recent intel on whether the herds are moving earlier this year?', authorName: 'Maya Okafor', authorRole: 'influencer', createdAt: '2026-04-18T11:05:00Z', replies: 15, views: 287, tags: ['kenya', 'safari', 'migration'] },
  { id: 'post_4', category: 'operators', title: 'Atlas Riads — anyone worked with them in Marrakech?', body: 'Yasmine at Atlas Riads quoted us for the culinary trail but hasn\'t responded in 3 days. Has anyone used them before? Looking for a backup riad operator if needed.', authorName: 'Wanderkit Team', authorRole: 'team', createdAt: '2026-04-22T16:30:00Z', replies: 7, views: 143, tags: ['morocco', 'operators', 'culinary'] },
  { id: 'post_5', category: 'planning', title: 'Packing list for 13-day Nepal teahouse trek', body: 'After 3 Annapurna trips, here\'s what I always bring and what I always leave behind. Key lesson: no cotton, ever. Also teahouses in Manang now have phone charging but no wifi above 3500m...', authorName: 'Jamie Chen', authorRole: 'influencer', createdAt: '2026-04-10T08:00:00Z', replies: 41, views: 892, tags: ['nepal', 'gear', 'packing'] },
  { id: 'post_6', category: 'gear', title: 'Best travel insurance for multi-country safari trips?', body: 'Looking for recommendations that cover emergency evacuation from the Mara + Kenya/Tanzania border crossings. WorldNomads vs SafetyWing for a family of 4?', authorName: 'Sara Lindqvist', authorRole: 'customer', createdAt: '2026-04-20T19:45:00Z', replies: 9, views: 178, tags: ['insurance', 'safari', 'family'] },
  { id: 'post_7', category: 'destinations', title: 'Nosara surf scene — December report', body: 'December is shoulder season at Guiones but the waves are actually more consistent than high season. Fewer crowds, same quality surf coaching at Pura Vida. Recommend going this year.', authorName: 'Lucas Brandt', authorRole: 'influencer', createdAt: '2026-04-25T12:00:00Z', replies: 19, views: 334, tags: ['costa rica', 'surf', 'nosara'] },
  { id: 'post_8', category: 'planning', title: 'Visa timelines for Nepal in 2026 — updated requirements', body: 'Nepal visa on arrival is still available for most nationalities but the new digital form takes 48h to process. Apply online before you fly. Also TIMS card is now combined with the permit...', authorName: 'Jamie Chen', authorRole: 'influencer', createdAt: '2026-04-26T10:00:00Z', replies: 6, views: 219, tags: ['nepal', 'visa', 'planning'] },
  { id: 'post_9', category: 'general', title: 'How do the AI agents decide which operator to recommend?', body: 'Curious how the Matchmaker agent works. Is it just based on price? I noticed it recommended Nepal Vision Treks over another operator with similar ratings — what factors went into that?', authorName: 'Priya Shah', authorRole: 'customer', createdAt: '2026-04-23T15:20:00Z', replies: 4, views: 98, tags: ['agents', 'how-it-works'] },
  { id: 'post_10', category: 'operators', title: 'AndesTours Patagonia — 5-star experience, Sofía is incredible', body: 'Just returned from a scouting trip with AndesTours. Sofía\'s team runs the W-Trek like clockwork. She upgraded our refugio nights at no charge and the camp food was better than expected.', authorName: 'Jamie Chen', authorRole: 'influencer', createdAt: '2026-04-14T09:30:00Z', replies: 11, views: 267, tags: ['patagonia', 'operators', 'review'] },
];

// ─── Booking Search Mock Results ──────────────────────────────────────────────

export interface FlightResult {
  id: string;
  airline: string;
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  duration: string;
  stops: number;
  priceUsd: number;
  class: 'economy' | 'premium' | 'business';
}

export interface HotelResult {
  id: string;
  name: string;
  location: string;
  stars: number;
  rating: number;
  reviewCount: number;
  pricePerNightUsd: number;
  amenities: string[];
  style: string;
}

export const mockFlights: FlightResult[] = [
  { id: 'fl_1', airline: 'Turkish Airlines', origin: 'JFK', destination: 'KTM', departDate: '2026-10-11', returnDate: '2026-10-25', duration: '17h 30m', stops: 1, priceUsd: 890, class: 'economy' },
  { id: 'fl_2', airline: 'Qatar Airways', origin: 'JFK', destination: 'KTM', departDate: '2026-10-11', returnDate: '2026-10-25', duration: '19h 10m', stops: 1, priceUsd: 1040, class: 'economy' },
  { id: 'fl_3', airline: 'Emirates', origin: 'JFK', destination: 'KTM', departDate: '2026-10-11', returnDate: '2026-10-25', duration: '20h 45m', stops: 1, priceUsd: 1180, class: 'economy' },
  { id: 'fl_4', airline: 'Turkish Airlines', origin: 'JFK', destination: 'KTM', departDate: '2026-10-11', returnDate: '2026-10-25', duration: '17h 30m', stops: 1, priceUsd: 2340, class: 'business' },
  { id: 'fl_5', airline: 'Kenya Airways', origin: 'LHR', destination: 'NBO', departDate: '2026-07-17', returnDate: '2026-07-28', duration: '8h 20m', stops: 0, priceUsd: 720, class: 'economy' },
  { id: 'fl_6', airline: 'British Airways', origin: 'LHR', destination: 'NBO', departDate: '2026-07-17', returnDate: '2026-07-28', duration: '8h 50m', stops: 0, priceUsd: 890, class: 'economy' },
];

export const mockHotels: HotelResult[] = [
  { id: 'ht_1', name: 'Fish Tail Lodge', location: 'Pokhara, Nepal', stars: 4, rating: 4.8, reviewCount: 1240, pricePerNightUsd: 185, amenities: ['Pool', 'Lake view', 'Spa', 'Mountain views'], style: 'Boutique resort' },
  { id: 'ht_2', name: 'Hotel Yak & Yeti', location: 'Kathmandu, Nepal', stars: 5, rating: 4.6, reviewCount: 2180, pricePerNightUsd: 220, amenities: ['Pool', 'Multiple restaurants', 'Gym', 'Cultural tours'], style: 'Heritage hotel' },
  { id: 'ht_3', name: 'Savana Mara Camp', location: 'Olare Motorogi, Kenya', stars: 5, rating: 4.9, reviewCount: 618, pricePerNightUsd: 680, amenities: ['Private tents', 'Game drives', 'All meals', 'Naturalist guide'], style: 'Luxury tented camp' },
  { id: 'ht_4', name: 'Heure Bleue Palais', location: 'Essaouira, Morocco', stars: 5, rating: 4.7, reviewCount: 892, pricePerNightUsd: 290, amenities: ['Rooftop pool', 'Hammam', 'Restaurant', 'Ocean views'], style: 'Riad palace' },
  { id: 'ht_5', name: 'Playa Guiones Villa', location: 'Nosara, Costa Rica', stars: 4, rating: 4.9, reviewCount: 142, pricePerNightUsd: 420, amenities: ['Private pool', 'Beachfront', '8 beds', 'Surf storage'], style: 'Private villa' },
  { id: 'ht_6', name: 'The Emakoko', location: 'Karen, Nairobi', stars: 5, rating: 4.8, reviewCount: 430, pricePerNightUsd: 310, amenities: ['Bush views', 'Pool', 'Fine dining', 'Wildlife walks'], style: 'Boutique lodge' },
];
