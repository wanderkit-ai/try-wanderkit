export type TripStyle = 'expedition' | 'hiking' | 'beach' | 'cultural' | 'safari' | 'culinary' | 'wellness';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type TripStatus = 'brief' | 'sourcing' | 'quoting' | 'approved' | 'booked' | 'completed' | 'cancelled';
export type QuoteStatus = 'requested' | 'received' | 'accepted' | 'rejected' | 'expired';
export type ChannelType = 'whatsapp' | 'email' | 'portal' | 'sms';

export interface Document {
  docType: string;
  filename: string;
  url: string;
  uploadedAt: string;
  status: 'uploaded' | 'missing';
}

export interface ItineraryDay {
  day: number;
  date: string;
  location: string;
  activities: string[];
  transit: string;
  lodging: string;
  // Premium workflow fields
  weather_note?: string;
  morning?: string;
  afternoon?: string;
  evening?: string;
  featured_activity?: string | null;
}

export interface Invoice {
  id: string;
  customerId: string;
  tripId: string;
  amountUsd: number;
  lineItems: { description: string; amountUsd: number }[];
  status: 'open' | 'paid' | 'refunded';
  url: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  city: string;
  country: string;
  age: number;
  joinedAt: string;
  influencerId: string | null;
  interests: TripStyle[];
  budgetMin: number;
  budgetMax: number;
  groupSize: number;
  availability: Season[];
  status: 'lead' | 'briefed' | 'matched' | 'paid' | 'travelling' | 'returned';
  notes?: string;
  nationality?: string;
  passportExpiry?: string;
  documents?: Document[];
}

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatarColor: string;
  followers: number;
  niches: TripStyle[];
  regions: string[];
  bio: string;
  activeTrips: number;
}

export interface Operator {
  id: string;
  company: string;
  contactName: string;
  whatsapp: string;
  email: string;
  country: string;
  region: string;
  specialties: TripStyle[];
  rating: number;
  responseHours: number;
  priceTier: '$' | '$$' | '$$$';
  notes?: string;
  starred?: boolean;
}

export interface TripBrief {
  id: string;
  title: string;
  influencerId: string;
  customerIds: string[];
  destination: string;
  region: string;
  style: TripStyle[];
  season: Season;
  startDate: string;
  endDate: string;
  groupSize: number;
  budgetPerPerson: number;
  mustHaves: string[];
  status: TripStatus;
  createdAt: string;
  acceptedQuoteId?: string;
  itinerary?: ItineraryDay[];
}

export interface Quote {
  id: string;
  tripId: string;
  operatorId: string;
  status: QuoteStatus;
  totalCents: number;
  perPersonCents: number;
  currency: string;
  includes: string[];
  excludes: string[];
  receivedAt: string | null;
  notes?: string;
}

export interface Message {
  id: string;
  tripId: string | null;
  operatorId: string | null;
  customerId: string | null;
  channel: ChannelType;
  direction: 'in' | 'out';
  body: string;
  sentAt: string;
  fromAgent?: AgentName;
}

export type JoinQuestionKey =
  | 'phone' | 'dateOfBirth' | 'nationality' | 'passport'
  | 'partySize' | 'roomPreference' | 'roommateName'
  | 'dietaryRestrictions' | 'allergies' | 'mobilityNeeds'
  | 'fitnessLevel' | 'priorExperience' | 'surfLevel'
  | 'emergencyContact' | 'travelInsurance'
  | 'whyInterested' | 'heardAboutUs' | 'tshirtSize' | 'specialRequests';

export interface JoinQuestion {
  key: JoinQuestionKey;
  enabled: boolean;
  required: boolean;
}

export interface TripLink {
  id: string;
  slug: string;
  influencerId: string;

  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  style: TripStyle[];
  capacity: number;

  audienceDescription: string;
  coverImage?: string;
  galleryImages?: string[];

  itinerary: ItineraryDay[];
  itinerarySource: 'manual' | 'ai' | 'mixed';

  joinQuestions: JoinQuestion[];

  status: 'draft' | 'live' | 'closed';
  createdAt: string;
  responseCount: number;
}

export interface WaitlistEntry {
  id: string;
  tripId: string;
  name: string;
  email: string;
  partySize: number;
  joinedAt: string;
  notes?: string;
}

export type AgentName = 'itinerary' | 'scout';

// ── Itinerary planning enrichment types ──────────────────────────────────────

export interface FlightOption {
  airline: string;
  flight_number?: string;
  origin?: string;
  destination?: string;
  departure_time?: string;
  arrival_time?: string;
  duration_hours?: number;
  per_pax_usd?: number;
  total_usd?: number;
  layovers?: number;
  ai_score?: number;
  ai_reason?: string;
  recommended?: boolean;
}

export interface HotelOption {
  id?: string;
  name: string;
  category?: string;
  stars?: number;
  rating?: number;
  price_per_night_usd?: number;
  total_usd?: number;
  total_nights?: number;
  check_in?: string;
  check_out?: string;
  amenities?: string[];
  ai_score?: number;
  ai_reason?: string;
  recommended?: boolean;
  style_tags?: string[];
}

export interface CostBreakdown {
  flights_usd?: number;
  hotel_usd?: number;
  activities_usd?: number;
  meals_usd?: number;
  total_usd?: number;
}

export interface EnhancedItineraryResult {
  tripId?: string;
  destination?: string;
  origin?: string;
  totalDays?: number;
  itinerary: ItineraryDay[];
  outbound_flight?: FlightOption;
  return_flight?: FlightOption;
  hotel?: HotelOption;
  cost_breakdown?: CostBreakdown;
  ai_summary?: string;
  status?: 'draft' | 'saved';
  preview?: boolean;
  saved?: boolean;
}

export interface AgentEvent {
  id: string;
  agent: AgentName;
  tripId?: string;
  kind: 'thinking' | 'tool_call' | 'tool_result' | 'message' | 'handoff' | 'completed';
  summary: string;
  detail?: string;
  at: string;
}
