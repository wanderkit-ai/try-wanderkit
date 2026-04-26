export type ItineraryDay = {
  dayNumber: number;
  date?: string;
  title: string;
  location: string;
  altitude?: string;
  description: string;
  highlights: string[];
  tag?: string;
  type: 'travel' | 'trek' | 'acclimatize' | 'cultural' | 'rest' | 'departure';
};

export type IncludedItem = {
  index: string;
  title: string;
  description: string;
  included: boolean;
};

export type FAQ = {
  question: string;
  answer: string;
};

export type DropWithRelations = {
  id: string;
  dropNumber: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  creatorNote: string | null;
  destination: string;
  country: string;
  heroImageUrl: string | null;
  galleryImages: string[];
  departureDate: Date;
  returnDate: Date;
  applicationDeadline: Date;
  totalSpots: number;
  pricePerPerson: number;
  depositAmount: number;
  depositDeadline: Date | null;
  singleSupplement: number | null;
  itinerary: ItineraryDay[];
  included: IncludedItem[];
  excluded: string[];
  faqs: FAQ[];
  status: string;
  publishedAt: Date | null;
  creator: {
    id: string;
    slug: string;
    name: string;
    handle: string;
    bio: string | null;
    photoUrl: string | null;
    followerCount: number | null;
    primaryPlatform: string | null;
    websiteUrl: string | null;
  };
  operator: {
    id: string;
    name: string;
    region: string;
    country: string;
    description: string | null;
    license: string | null;
    yearsActive: number | null;
    verified: boolean;
  } | null;
  applications: { id: string }[];
  confirmedBookings: number;
  spotsRemaining: number;
  percentFilled: number;
  isSoldOut: boolean;
  isApplicationOpen: boolean;
};
