import type {
  Customer,
  Influencer,
  Operator,
  TripBrief,
  Quote,
  Message,
  AgentEvent,
  TripLink,
  JoinQuestion,
  JoinQuestionKey,
  WaitlistEntry,
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
    activeTrips: 1,
  },
];

export const operators: Operator[] = [
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
    starred: true,
  },
];

export const customers: Customer[] = [
  {
    id: 'cus_jonathan',
    name: 'Jonathan',
    email: 'jonathan@example.com',
    avatarColor: c(3),
    city: 'New York',
    country: 'USA',
    age: 31,
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
    id: 'cus_ariji',
    name: 'Ariji',
    email: 'arijitchakma79@gmail.com',
    avatarColor: c(1),
    city: 'Toronto',
    country: 'Canada',
    age: 27,
    joinedAt: '2026-03-22',
    influencerId: 'inf_jamie',
    interests: ['expedition', 'hiking'],
    budgetMin: 450_000,
    budgetMax: 800_000,
    groupSize: 1,
    availability: ['fall'],
    status: 'briefed',
    nationality: 'Canada',
    passportExpiry: '2028-11-30',
    documents: [],
  },
  {
    id: 'cus_kai',
    name: 'Kai',
    email: 'kai@example.com',
    avatarColor: c(2),
    city: 'Berlin',
    country: 'Germany',
    age: 29,
    joinedAt: '2026-04-01',
    influencerId: 'inf_jamie',
    interests: ['hiking', 'wellness'],
    budgetMin: 300_000,
    budgetMax: 500_000,
    groupSize: 2,
    availability: ['fall'],
    status: 'lead',
    nationality: 'Germany',
    passportExpiry: '2031-01-19',
    documents: [],
  },
];

export const trips: TripBrief[] = [
  {
    id: 'trip_annapurna',
    title: 'Annapurna Base Camp — Oct 2026',
    influencerId: 'inf_jamie',
    customerIds: ['cus_jonathan', 'cus_ariji', 'cus_kai'],
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
];

export const messages: Message[] = [
  {
    id: 'msg_1',
    tripId: 'trip_annapurna',
    operatorId: 'op_himalaya',
    customerId: null,
    channel: 'whatsapp',
    direction: 'out',
    body: "Hi Pemba — Jamie Chen is putting together an Annapurna Base Camp trip Oct 12-25 for 8. Budget ~$380/pp/day. Can you send a quote with teahouse stays and a vegetarian-friendly option?",
    sentAt: '2026-04-19T15:02:00Z',
    fromAgent: 'scout',
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
];

export const agentEvents: AgentEvent[] = [
  {
    id: 'evt_1',
    agent: 'scout',
    tripId: 'trip_annapurna',
    kind: 'tool_call',
    summary: 'Searched operators in Nepal + web',
    detail: 'Found Nepal Vision Treks — added to shortlist',
    at: '2026-04-19T15:00:00Z',
  },
  {
    id: 'evt_2',
    agent: 'itinerary',
    tripId: 'trip_annapurna',
    kind: 'completed',
    summary: 'Saved 13-day Annapurna Base Camp itinerary',
    detail: 'Altitude days flagged · Permit notes added',
    at: '2026-04-20T08:16:00Z',
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
  date: string;
  time?: string;
  endTime?: string;
  kind: 'meeting' | 'departure' | 'deadline' | 'task' | 'return';
  tripId?: string;
  customerId?: string;
  influencerId?: string;
  description?: string;
}

export const calendarEvents: CalendarEvent[] = [
  { id: 'cal_1', title: 'Call with Jonathan — trip brief review', date: '2026-04-28', time: '10:00', endTime: '10:30', kind: 'meeting', customerId: 'cus_jonathan', tripId: 'trip_annapurna', description: 'Review Annapurna itinerary draft and confirm must-haves.' },
  { id: 'cal_2', title: 'Call with Ariji — gear and visa check', date: '2026-05-05', time: '15:00', endTime: '15:30', kind: 'meeting', customerId: 'cus_ariji', tripId: 'trip_annapurna', description: 'Confirm gear list, visa application status, insurance.' },
  { id: 'cal_3', title: 'Call with Kai — Annapurna logistics', date: '2026-05-18', time: '16:00', endTime: '16:30', kind: 'meeting', customerId: 'cus_kai', tripId: 'trip_annapurna', description: 'Walk through itinerary and confirm group size.' },
  { id: 'cal_4', title: 'Quote review — Nepal Vision Treks', date: '2026-04-30', kind: 'deadline', tripId: 'trip_annapurna', description: 'Review Pemba\'s quote and decide on lodge upgrade option.' },
  { id: 'cal_5', title: 'Annapurna Base Camp — DEPARTS', date: '2026-10-12', kind: 'departure', tripId: 'trip_annapurna', influencerId: 'inf_jamie', description: 'Jonathan, Ariji, Kai group. KTM arrival day.' },
  { id: 'cal_6', title: 'Annapurna Base Camp — RETURNS', date: '2026-10-24', kind: 'return', tripId: 'trip_annapurna', influencerId: 'inf_jamie' },
  { id: 'cal_7', title: 'Nepal visa deadline reminder', date: '2026-05-08', kind: 'task', tripId: 'trip_annapurna', description: 'All travelers must apply online before this date. TIMS card now combined with permit.' },
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
  { id: 'post_1', category: 'announcements', title: 'Welcome to the Noma Community — how it works', body: 'This is your space to share trip intel, ask questions, and connect with other travelers and creators on the platform. Here\'s a quick guide to how the community works...', authorName: 'Noma Team', authorRole: 'team', createdAt: '2026-04-01T09:00:00Z', replies: 12, views: 340, pinned: true, tags: ['welcome', 'guide'] },
  { id: 'post_2', category: 'destinations', title: 'Annapurna in October — what to expect (teahouse edition)', body: 'Just got back from scouting the Annapurna Base Camp route in October. The rhododendron forests are bare but the mountain views are stunning. Teahouse availability is good but book Manang early...', authorName: 'Jamie Chen', authorRole: 'influencer', createdAt: '2026-04-15T14:22:00Z', replies: 28, views: 512, tags: ['nepal', 'hiking', 'annapurna'] },
  { id: 'post_3', category: 'planning', title: 'Packing list for 13-day Nepal teahouse trek', body: 'After 3 Annapurna trips, here\'s what I always bring and what I always leave behind. Key lesson: no cotton, ever. Also teahouses in Manang now have phone charging but no wifi above 3500m...', authorName: 'Jamie Chen', authorRole: 'influencer', createdAt: '2026-04-10T08:00:00Z', replies: 41, views: 892, tags: ['nepal', 'gear', 'packing'] },
  { id: 'post_4', category: 'planning', title: 'Visa timelines for Nepal in 2026 — updated requirements', body: 'Nepal visa on arrival is still available for most nationalities but the new digital form takes 48h to process. Apply online before you fly. Also TIMS card is now combined with the permit...', authorName: 'Jamie Chen', authorRole: 'influencer', createdAt: '2026-04-26T10:00:00Z', replies: 6, views: 219, tags: ['nepal', 'visa', 'planning'] },
  { id: 'post_5', category: 'general', title: 'How do the AI agents decide which operator to recommend?', body: 'Curious how the Scout agent works. Is it just based on price? I noticed it recommended Nepal Vision Treks — what factors went into that?', authorName: 'Jonathan', authorRole: 'customer', createdAt: '2026-04-23T15:20:00Z', replies: 4, views: 98, tags: ['agents', 'how-it-works'] },
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
];

export const mockHotels: HotelResult[] = [
  { id: 'ht_1', name: 'Fish Tail Lodge', location: 'Pokhara, Nepal', stars: 4, rating: 4.8, reviewCount: 1240, pricePerNightUsd: 185, amenities: ['Pool', 'Lake view', 'Spa', 'Mountain views'], style: 'Boutique resort' },
  { id: 'ht_2', name: 'Hotel Yak & Yeti', location: 'Kathmandu, Nepal', stars: 5, rating: 4.6, reviewCount: 2180, pricePerNightUsd: 220, amenities: ['Pool', 'Multiple restaurants', 'Gym', 'Cultural tours'], style: 'Heritage hotel' },
];

function joinQ(
  key: JoinQuestionKey,
  enabled: boolean,
  required: boolean
): JoinQuestion {
  return { key, enabled, required };
}

const ALWAYS_ON: JoinQuestion[] = [
  joinQ('partySize', true, true),
  joinQ('roomPreference', true, true),
  joinQ('roommateName', true, false),
  joinQ('dietaryRestrictions', true, true),
  joinQ('allergies', true, false),
  joinQ('mobilityNeeds', true, false),
  joinQ('emergencyContact', true, true),
  joinQ('whyInterested', true, true),
];

const HIKING_EXTRAS: JoinQuestion[] = [
  joinQ('fitnessLevel', true, true),
  joinQ('priorExperience', true, false),
  joinQ('surfLevel', false, false),
  joinQ('nationality', false, false),
  joinQ('phone', true, false),
  joinQ('dateOfBirth', false, false),
  joinQ('passport', false, false),
  joinQ('travelInsurance', true, false),
  joinQ('heardAboutUs', true, false),
  joinQ('tshirtSize', false, false),
  joinQ('specialRequests', true, false),
];

export const tripLinks: TripLink[] = [
  {
    id: 'lnk_nepal',
    slug: 'nepal-expedition-2026',
    influencerId: 'inf_jamie',
    title: 'Nepal Expedition — Oct 2026',
    destination: 'Pokhara & Kathmandu, Nepal',
    startDate: '2026-10-12',
    endDate: '2026-10-24',
    style: ['hiking', 'expedition'],
    capacity: 8,
    audienceDescription: "Join me for 12 days in the Himalayas. We'll trek to Annapurna Base Camp, stay in teahouses, and finish with two nights in Kathmandu. Limited to 8 people — serious hikers only.\n\nThis is a real expedition. Expect 6–8 hours of trekking per day, altitude above 4,000 m, and cold nights. What you'll get: unreal views, a small tight-knit group, and a guide team I trust completely.",
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1571770096658-4fa9e1b0de27?w=800&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
      'https://images.unsplash.com/photo-1573408259524-e5e0bb46f46e?w=800&q=80',
    ],
    itinerary: [
      { day: 1, date: '2026-10-12', location: 'Kathmandu', activities: ['Arrive at Tribhuvan International', 'Transfer to Thamel hotel', 'Gear check and briefing with guide', 'Welcome dinner at a rooftop restaurant'], transit: 'International flight', lodging: 'Hotel Yak & Yeti, Kathmandu' },
      { day: 2, date: '2026-10-13', location: 'Pokhara', activities: ['Morning flight to Pokhara', 'Lakeside stroll and gear top-up', 'Trek briefing and team dinner'], transit: 'Domestic flight (35 min)', lodging: 'Butterfly Lodge, Pokhara' },
      { day: 3, date: '2026-10-14', location: 'Tikhedhunga (1,540 m)', activities: ['Drive to Nayapul trailhead', 'Trek through terraced fields and rhododendron forest', 'Cross Bhurungdi Khola suspension bridge'], transit: 'Drive 1.5 h then trek 5 h', lodging: 'Mountain Tea House' },
      { day: 4, date: '2026-10-15', location: 'Ghorepani (2,860 m)', activities: ['Trek through stone-paved trail and dense forest', 'Arrive at Ghorepani village', 'Explore Poon Hill viewpoint'], transit: 'Trek 6 h', lodging: 'Himalaya Inn' },
      { day: 5, date: '2026-10-16', location: 'Tadapani (2,630 m)', activities: ['Pre-dawn hike to Poon Hill summit (3,210 m) for sunrise', 'Panoramic views of Annapurna, Dhaulagiri, Machhapuchhre', 'Trek down through rhododendron forest to Tadapani'], transit: 'Trek 7 h', lodging: 'Forest Camp Lodge' },
      { day: 6, date: '2026-10-17', location: 'Chhomrong (2,170 m)', activities: ['Descend through Modi Khola valley', 'Cross Kimrong Khola river', 'Chhomrong village exploration and acclimatisation walk'], transit: 'Trek 6 h', lodging: 'Chhomrong Guest House' },
      { day: 7, date: '2026-10-18', location: 'Dovan (2,580 m)', activities: ['Enter Annapurna Sanctuary', 'Trek through bamboo and rhododendron', 'Crossing several snow bridges'], transit: 'Trek 5 h', lodging: 'Dovan Tea House' },
      { day: 8, date: '2026-10-19', location: 'ABC — Annapurna Base Camp (4,130 m)', activities: ['Early start, cold and thrilling ascent to ABC', 'Circle of massive peaks: Annapurna I, South, Machhapuchhre', 'Afternoon at camp — photography, reflection, hot tea'], transit: 'Trek 7 h', lodging: 'Annapurna Base Camp Lodge' },
      { day: 9, date: '2026-10-20', location: 'Bamboo (2,310 m)', activities: ['Long descent via Machhapuchhre Base Camp', 'Knees-testing but rewarding trail', 'River crossing and lunch stop'], transit: 'Trek 7 h', lodging: 'Bamboo Lodge' },
      { day: 10, date: '2026-10-21', location: 'Jhinu Danda (1,780 m)', activities: ['Descent through Chhomrong', 'Hot spring soak at Jhinu Danda — a well-earned reward', 'Celebratory team dinner'], transit: 'Trek 5 h', lodging: 'Jhinu Hot Spring Lodge' },
      { day: 11, date: '2026-10-22', location: 'Pokhara', activities: ['Final trek out to Siwai and drive to Pokhara', 'Lakeside evening, last gear pack-down', 'Team dinner and awards ceremony'], transit: 'Trek 3 h + drive 1.5 h', lodging: 'Butterfly Lodge, Pokhara' },
      { day: 12, date: '2026-10-23', location: 'Kathmandu', activities: ['Morning flight back to Kathmandu', 'Boudhanath Stupa visit', 'Thamel shopping, souvenir hunting', 'Group farewell dinner'], transit: 'Domestic flight (35 min)', lodging: 'Hotel Yak & Yeti, Kathmandu' },
      { day: 13, date: '2026-10-24', location: 'Kathmandu → Home', activities: ['Early hotel checkout', 'Transfer to TIA Airport', 'Departures'], transit: 'International flight', lodging: '' },
    ],
    itinerarySource: 'ai',
    joinQuestions: [...ALWAYS_ON, ...HIKING_EXTRAS],
    status: 'live',
    createdAt: '2026-03-10',
    responseCount: 24,
  },
];

export const waitlist: WaitlistEntry[] = [
  { id: 'wl_1', tripId: 'trip_annapurna', name: 'Elena Kozlov', email: 'elena.k@proton.me', partySize: 2, joinedAt: '2026-04-20', notes: 'Flexible on dates if a spot opens up' },
  { id: 'wl_2', tripId: 'trip_annapurna', name: 'James Okonkwo', email: 'j.okonkwo@gmail.com', partySize: 1, joinedAt: '2026-04-22' },
  { id: 'wl_3', tripId: 'trip_annapurna', name: 'Lucia Ferreira', email: 'lucia.f@outlook.com', partySize: 2, joinedAt: '2026-04-23', notes: 'Solo traveller OK if party required' },
];
