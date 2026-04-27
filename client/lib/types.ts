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

export type AgentName = 'concierge' | 'itinerary' | 'matchmaker' | 'negotiator' | 'booker' | 'compliance' | 'payments' | 'social';

export interface AgentEvent {
  id: string;
  agent: AgentName;
  tripId?: string;
  kind: 'thinking' | 'tool_call' | 'tool_result' | 'message' | 'handoff' | 'completed';
  summary: string;
  detail?: string;
  at: string;
}
