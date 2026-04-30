"""Seed fixtures for the Noma CRM. Mirrors lib/mock-data.ts on the Next.js side."""

from typing import Any

COLORS = [
    "#e07a5f", "#81b29a", "#f2cc8f", "#3d405b",
    "#a8dadc", "#e76f51", "#a6b1e1", "#cdb4db",
]
def _c(i: int) -> str: return COLORS[i % len(COLORS)]

INFLUENCERS: list[dict[str, Any]] = [
    {
        "id": "inf_jamie", "name": "Jamie Chen", "handle": "@travelwithjamie",
        "email": "jamie@travelwithjamie.co", "avatarColor": _c(0), "followers": 184_000,
        "niches": ["hiking", "expedition", "cultural"],
        "regions": ["Nepal", "Patagonia", "Iceland"],
        "bio": "Mountain trips with substance. Small groups, big country.", "activeTrips": 3,
    },
    {
        "id": "inf_maya", "name": "Maya Okafor", "handle": "@maya.wanders",
        "email": "maya@mayawanders.com", "avatarColor": _c(1), "followers": 92_400,
        "niches": ["safari", "cultural", "culinary"],
        "regions": ["Kenya", "Morocco", "Senegal"],
        "bio": "Slow travel across Africa. Food, family, stories.", "activeTrips": 2,
    },
    {
        "id": "inf_lucas", "name": "Lucas Brandt", "handle": "@lucas.surf",
        "email": "lucas@lucasbrandt.surf", "avatarColor": _c(2), "followers": 56_900,
        "niches": ["beach", "wellness"],
        "regions": ["Costa Rica", "Portugal", "Bali"],
        "bio": "Surf + sauna. Nothing else.", "activeTrips": 1,
    },
]

OPERATORS: list[dict[str, Any]] = [
    {
        "id": "op_andes", "company": "AndesTours Patagonia", "contactName": "Sofía Ramírez",
        "whatsapp": "+54 9 2944 555 010", "email": "sofia@andestours.ar",
        "country": "Argentina", "region": "Patagonia",
        "specialties": ["expedition", "hiking"], "rating": 4.8, "responseHours": 4,
        "priceTier": "$$",
        "notes": "Reliable. Speaks fluent English. Owns mountain lodge.",
    },
    {
        "id": "op_himalaya", "company": "Nepal Vision Treks", "contactName": "Pemba Sherpa",
        "whatsapp": "+977 98 1234 5678", "email": "pemba@nepalvision.np",
        "country": "Nepal", "region": "Annapurna",
        "specialties": ["hiking", "expedition", "cultural"],
        "rating": 4.9, "responseHours": 6, "priceTier": "$$",
    },
    {
        "id": "op_savana", "company": "Savana Camps", "contactName": "Daniel Otieno",
        "whatsapp": "+254 712 880 220", "email": "daniel@savanacamps.ke",
        "country": "Kenya", "region": "Maasai Mara",
        "specialties": ["safari", "cultural"],
        "rating": 4.7, "responseHours": 8, "priceTier": "$$$",
    },
    {
        "id": "op_atlas", "company": "Atlas Riads", "contactName": "Yasmine El Idrissi",
        "whatsapp": "+212 661 700 130", "email": "yasmine@atlasriads.ma",
        "country": "Morocco", "region": "Marrakech",
        "specialties": ["cultural", "culinary"],
        "rating": 4.6, "responseHours": 12, "priceTier": "$$",
    },
    {
        "id": "op_pura", "company": "Pura Vida Surf", "contactName": "Ana Quirós",
        "whatsapp": "+506 8888 4422", "email": "ana@puravidasurf.cr",
        "country": "Costa Rica", "region": "Nosara",
        "specialties": ["beach", "wellness"],
        "rating": 4.8, "responseHours": 3, "priceTier": "$$",
    },
    {
        "id": "op_bali", "company": "Ubud Collective", "contactName": "Wayan Sutrisna",
        "whatsapp": "+62 812 3700 9001", "email": "wayan@ubudcollective.id",
        "country": "Indonesia", "region": "Bali",
        "specialties": ["wellness", "cultural", "culinary"],
        "rating": 4.5, "responseHours": 10, "priceTier": "$",
    },
]

CUSTOMERS: list[dict[str, Any]] = [
    {
        "id": "cus_priya", "name": "Priya Shah", "email": "priya.shah@gmail.com",
        "avatarColor": _c(3), "city": "Brooklyn", "country": "USA", "age": 29,
        "nationality": "USA", "passportExpiry": "2029-08-14",
        "joinedAt": "2026-03-12", "influencerId": "inf_jamie",
        "interests": ["hiking", "cultural"],
        "budgetMin": 280_000, "budgetMax": 450_000,
        "groupSize": 2, "availability": ["fall"], "status": "matched",
        "notes": "First international hike. Wants moderate difficulty.",
        "documents": [],
    },
    {
        "id": "cus_marcus", "name": "Marcus Reilly", "email": "marcus.r@hey.com",
        "avatarColor": _c(4), "city": "London", "country": "UK", "age": 34,
        "nationality": "UK", "passportExpiry": "2027-03-02",
        "joinedAt": "2026-03-22", "influencerId": "inf_jamie",
        "interests": ["expedition"],
        "budgetMin": 450_000, "budgetMax": 800_000,
        "groupSize": 1, "availability": ["summer", "fall"], "status": "briefed",
        "documents": [],
    },
    {
        "id": "cus_sara", "name": "Sara Lindqvist", "email": "sara.lindqvist@proton.me",
        "avatarColor": _c(5), "city": "Stockholm", "country": "Sweden", "age": 31,
        "nationality": "Sweden", "passportExpiry": "2031-01-19",
        "joinedAt": "2026-04-01", "influencerId": "inf_maya",
        "interests": ["safari", "cultural"],
        "budgetMin": 600_000, "budgetMax": 900_000,
        "groupSize": 4, "availability": ["summer"], "status": "paid",
        "notes": "Family of 4. Two kids ages 9 and 12.",
        "documents": [],
    },
    {
        "id": "cus_dev", "name": "Dev Patel", "email": "dev@devpatel.dev",
        "avatarColor": _c(6), "city": "Toronto", "country": "Canada", "age": 27,
        "nationality": "Canada", "passportExpiry": "2028-11-30",
        "joinedAt": "2026-04-08", "influencerId": "inf_lucas",
        "interests": ["beach", "wellness"],
        "budgetMin": 200_000, "budgetMax": 350_000,
        "groupSize": 3, "availability": ["winter"], "status": "lead",
        "documents": [],
    },
    {
        "id": "cus_aisha", "name": "Aisha Bello", "email": "aisha.bello@outlook.com",
        "avatarColor": _c(7), "city": "Lagos", "country": "Nigeria", "age": 26,
        "nationality": "Nigeria", "passportExpiry": "2027-09-05",
        "joinedAt": "2026-04-14", "influencerId": "inf_maya",
        "interests": ["culinary", "cultural"],
        "budgetMin": 180_000, "budgetMax": 320_000,
        "groupSize": 2, "availability": ["fall", "winter"], "status": "briefed",
        "documents": [],
    },
    {
        "id": "cus_yuki", "name": "Yuki Tanaka", "email": "yuki.t@icloud.com",
        "avatarColor": _c(0), "city": "Osaka", "country": "Japan", "age": 38,
        "nationality": "Japan", "passportExpiry": "2030-06-22",
        "joinedAt": "2026-04-19", "influencerId": "inf_jamie",
        "interests": ["hiking", "wellness"],
        "budgetMin": 350_000, "budgetMax": 500_000,
        "groupSize": 2, "availability": ["spring"], "status": "matched",
        "documents": [],
    },
]

TRIPS: list[dict[str, Any]] = [
    {
        "id": "trip_annapurna", "title": "Annapurna Circuit — Oct 2026",
        "influencerId": "inf_jamie", "customerIds": ["cus_priya", "cus_yuki"],
        "destination": "Annapurna, Nepal", "region": "Annapurna",
        "style": ["hiking", "cultural"], "season": "fall",
        "startDate": "2026-10-12", "endDate": "2026-10-25",
        "groupSize": 8, "budgetPerPerson": 380_000,
        "mustHaves": ["Teahouse stays", "Local guide", "Vegetarian-friendly"],
        "status": "quoting", "createdAt": "2026-04-02",
        "itinerary": [],
    },
    {
        "id": "trip_mara", "title": "Maasai Mara Family Safari",
        "influencerId": "inf_maya", "customerIds": ["cus_sara"],
        "destination": "Maasai Mara, Kenya", "region": "Maasai Mara",
        "style": ["safari", "cultural"], "season": "summer",
        "startDate": "2026-07-18", "endDate": "2026-07-28",
        "groupSize": 4, "budgetPerPerson": 750_000,
        "mustHaves": ["Kid-friendly camp", "Private vehicle", "Cultural visit"],
        "status": "booked", "createdAt": "2026-03-08",
        "acceptedQuoteId": "q_savana_1",
        "itinerary": [],
    },
    {
        "id": "trip_marrakech", "title": "Marrakech to Fez — Culinary Trail",
        "influencerId": "inf_maya", "customerIds": ["cus_aisha"],
        "destination": "Morocco", "region": "Marrakech",
        "style": ["cultural", "culinary"], "season": "fall",
        "startDate": "2026-11-04", "endDate": "2026-11-13",
        "groupSize": 6, "budgetPerPerson": 290_000,
        "mustHaves": ["Cooking class", "Riad stays", "Train between cities"],
        "status": "sourcing", "createdAt": "2026-04-18",
        "itinerary": [],
    },
    {
        "id": "trip_patagonia", "title": "Patagonia W-Trek",
        "influencerId": "inf_jamie", "customerIds": ["cus_marcus"],
        "destination": "Torres del Paine, Chile", "region": "Patagonia",
        "style": ["expedition", "hiking"], "season": "fall",
        "startDate": "2026-11-20", "endDate": "2026-11-30",
        "groupSize": 6, "budgetPerPerson": 620_000,
        "mustHaves": ["Camp + refugio mix", "English-speaking guide"],
        "status": "brief", "createdAt": "2026-04-22",
        "itinerary": [],
    },
    {
        "id": "trip_nosara", "title": "Nosara Surf & Sauna",
        "influencerId": "inf_lucas", "customerIds": ["cus_dev"],
        "destination": "Nosara, Costa Rica", "region": "Nosara",
        "style": ["beach", "wellness"], "season": "winter",
        "startDate": "2026-12-14", "endDate": "2026-12-21",
        "groupSize": 8, "budgetPerPerson": 280_000,
        "mustHaves": ["Beachfront villa", "Daily yoga", "2x surf coaching"],
        "status": "brief", "createdAt": "2026-04-24",
        "itinerary": [],
    },
]

QUOTES: list[dict[str, Any]] = [
    {
        "id": "q_himalaya_1", "tripId": "trip_annapurna", "operatorId": "op_himalaya",
        "status": "received", "totalCents": 8 * 360_000, "perPersonCents": 360_000,
        "currency": "USD",
        "includes": ["Guide", "Porters", "Teahouse stays", "All meals on trail", "Permits"],
        "excludes": ["Flights", "Travel insurance"],
        "receivedAt": "2026-04-20T08:14:00Z",
        "notes": "Can swap teahouse for boutique lodge in Manang for +$140 pp.",
    },
    {
        "id": "q_savana_1", "tripId": "trip_mara", "operatorId": "op_savana",
        "status": "accepted", "totalCents": 4 * 720_000, "perPersonCents": 720_000,
        "currency": "USD",
        "includes": ["Tented camp (private)", "Game drives", "Cultural visit", "All meals"],
        "excludes": ["International flights", "Tips"],
        "receivedAt": "2026-03-15T11:00:00Z",
    },
    {
        "id": "q_atlas_1", "tripId": "trip_marrakech", "operatorId": "op_atlas",
        "status": "requested", "totalCents": 0, "perPersonCents": 0,
        "currency": "USD", "includes": [], "excludes": [], "receivedAt": None,
    },
]


def find_by_id(arr: list[dict], _id: str | None) -> dict | None:
    if not _id:
        return None
    return next((x for x in arr if x["id"] == _id), None)


# ── Visa & vaccination requirements ───────────────────────────────────────────
# Keyed by (nationality, destination_country). The Compliance agent looks up
# this table; missing corridors fall back to a "research required" stub.

VISA_REQUIREMENTS: dict[tuple[str, str], dict[str, Any]] = {
    ("USA", "Nepal"): {
        "visaRequired": True, "visaType": "Visa on arrival (15/30/90 day)",
        "processingDays": 0, "passportValidity": "6 months past entry",
        "vaccinations": ["Hepatitis A", "Typhoid recommended"],
        "notes": "Carry 2 passport photos and USD cash for visa fee.",
    },
    ("UK", "Nepal"): {
        "visaRequired": True, "visaType": "Visa on arrival",
        "processingDays": 0, "passportValidity": "6 months past entry",
        "vaccinations": ["Hepatitis A", "Typhoid recommended"],
        "notes": "Same as US travellers.",
    },
    ("Canada", "Nepal"): {
        "visaRequired": True, "visaType": "Visa on arrival",
        "processingDays": 0, "passportValidity": "6 months past entry",
        "vaccinations": ["Hepatitis A", "Typhoid recommended"],
        "notes": "",
    },
    ("USA", "Morocco"): {
        "visaRequired": False, "visaType": "Visa-free up to 90 days",
        "processingDays": 0, "passportValidity": "Valid for entire stay",
        "vaccinations": ["Routine vaccines current"],
        "notes": "",
    },
    ("UK", "Morocco"): {
        "visaRequired": False, "visaType": "Visa-free up to 90 days",
        "processingDays": 0, "passportValidity": "Valid for entire stay",
        "vaccinations": ["Routine vaccines current"], "notes": "",
    },
    ("Nigeria", "Morocco"): {
        "visaRequired": True, "visaType": "Tourist visa (e-visa available)",
        "processingDays": 5, "passportValidity": "6 months past entry",
        "vaccinations": ["Yellow fever certificate required"],
        "notes": "Yellow fever certificate is mandatory at border for Nigerian passport holders.",
    },
    ("USA", "Kenya"): {
        "visaRequired": True, "visaType": "eTA (electronic travel authorisation)",
        "processingDays": 3, "passportValidity": "6 months past entry",
        "vaccinations": ["Yellow fever (if transiting)", "Typhoid recommended", "Malaria prophylaxis"],
        "notes": "Apply via etakenya.go.ke at least a week before travel.",
    },
    ("Sweden", "Kenya"): {
        "visaRequired": True, "visaType": "eTA",
        "processingDays": 3, "passportValidity": "6 months past entry",
        "vaccinations": ["Yellow fever (if transiting)", "Malaria prophylaxis"],
        "notes": "",
    },
    ("USA", "Indonesia"): {
        "visaRequired": True, "visaType": "Visa on arrival (B1)",
        "processingDays": 0, "passportValidity": "6 months past entry",
        "vaccinations": ["Hepatitis A", "Typhoid recommended"],
        "notes": "USD 35 fee, payable in cash on arrival.",
    },
    ("Canada", "Costa Rica"): {
        "visaRequired": False, "visaType": "Visa-free up to 90 days",
        "processingDays": 0, "passportValidity": "Valid for entire stay",
        "vaccinations": ["Routine vaccines current"],
        "notes": "",
    },
    ("Canada", "Chile"): {
        "visaRequired": False, "visaType": "Visa-free up to 90 days",
        "processingDays": 0, "passportValidity": "Valid for entire stay",
        "vaccinations": ["Routine vaccines current"],
        "notes": "Reciprocity fee no longer charged for Canadians.",
    },
    ("UK", "Chile"): {
        "visaRequired": False, "visaType": "Visa-free up to 90 days",
        "processingDays": 0, "passportValidity": "Valid for entire stay",
        "vaccinations": ["Routine vaccines current"],
        "notes": "",
    },
    ("Japan", "Indonesia"): {
        "visaRequired": False, "visaType": "Visa-free up to 30 days",
        "processingDays": 0, "passportValidity": "6 months past entry",
        "vaccinations": ["Hepatitis A", "Typhoid recommended"],
        "notes": "",
    },
}


# ── Invoices ──────────────────────────────────────────────────────────────────
# Mutable in-memory store. The Payments agent appends here when create_invoice
# runs, and updates entries on charge/refund. Real implementation would hit
# Stripe + a database.

INVOICES: list[dict[str, Any]] = []


# ── Document checklists ──────────────────────────────────────────────────────
# Keyed by (customer_id, trip_id). Compliance agent populates these by
# combining VISA_REQUIREMENTS with trip details. Each item: {docType, status,
# uploadedFilename?, uploadedUrl?}.

DOC_CHECKLISTS: dict[tuple[str, str], list[dict[str, Any]]] = {}
