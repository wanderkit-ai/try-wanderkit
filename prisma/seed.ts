import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clean existing seed data
  await prisma.application.deleteMany({});
  await prisma.drop.deleteMany({});
  await prisma.creator.deleteMany({});
  await prisma.operator.deleteMany({});

  // Create operator
  const operator = await prisma.operator.create({
    data: {
      name: 'Nepal Vision Treks',
      region: 'Nepal · Himalaya',
      country: 'Nepal',
      description: 'TAAN-licensed trekking operator with 18 years of experience in the Annapurna and Everest regions.',
      license: 'TAAN-licensed',
      yearsActive: 18,
      contactName: 'Ramesh Tamang',
      contactEmail: 'info@nepalvisiontreks.com',
      verified: true,
    },
  });

  // Create creator (Jamie) — userId would normally come from Supabase Auth
  // For seeding, we use a placeholder UUID
  const creator = await prisma.creator.create({
    data: {
      userId: 'seed-user-jamie-chen-2026',
      slug: 'jamie',
      name: 'Jamie Chen',
      handle: 'jamieexplores',
      bio: 'Travel photographer and filmmaker. I\'ve spent the last decade chasing light in the world\'s most remote corners. From the Himalayas to Patagonia, I believe the best stories are found off the beaten path — and I want to share them with you.',
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
      followerCount: 284000,
      primaryPlatform: 'instagram',
      email: 'jamie@tripdrop.co',
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  const itinerary = [
    {
      dayNumber: 1,
      date: 'Oct 12',
      title: 'Arrival in Kathmandu',
      location: 'Kathmandu, Nepal (1,400m)',
      altitude: '1,400m',
      description: 'We land in Kathmandu and transfer to our boutique hotel in Thamel. This evening we share our first meal together — a proper Nepali dal bhat — and run through the final logistics.',
      highlights: ['Welcome dinner', 'Meet the team', 'Kit check'],
      tag: 'Welcome dinner',
      type: 'travel',
    },
    {
      dayNumber: 2,
      date: 'Oct 13',
      title: 'Fly to Pokhara, Drive to Nayapul',
      location: 'Pokhara → Nayapul (1,070m)',
      altitude: '1,070m',
      description: 'A short scenic flight over the Annapurna massif and we\'re in Pokhara. We take in the lakeside before driving to Nayapul, where the trek officially begins. The first steps on the trail.',
      highlights: ['Scenic mountain flight', 'Phewa Lake', 'Trek begins at Nayapul'],
      tag: 'Trek begins',
      type: 'travel',
    },
    {
      dayNumber: 3,
      date: 'Oct 14',
      title: 'Nayapul to Tikhedhunga',
      location: 'Tikhedhunga (1,540m)',
      altitude: '1,540m',
      description: 'An easy first day through rhododendron forests and terraced rice paddies. We cross the Modi Khola suspension bridge and follow the river up to Tikhedhunga — a small village with a teahouse that does the best lemon honey ginger tea we\'ve ever tasted.',
      highlights: ['Rhododendron forest', 'Suspension bridge crossing', 'Modi Khola river'],
      tag: null,
      type: 'trek',
    },
    {
      dayNumber: 4,
      date: 'Oct 15',
      title: 'The Big Climb: Tikhedhunga to Ghorepani',
      location: 'Ghorepani (2,860m)',
      altitude: '2,860m',
      description: 'Today is a proper test. We climb 3,500+ stone steps through misty forest to reach Ghorepani. The effort is real but the payoff is immediate — our teahouse sits right below the Poon Hill ridge with jaw-dropping views of Annapurna South.',
      highlights: ['3,500 stone steps', 'Misty rhododendron forest', 'First Annapurna views'],
      tag: null,
      type: 'trek',
    },
    {
      dayNumber: 5,
      date: 'Oct 16',
      title: 'Poon Hill Sunrise + Descent to Tadapani',
      location: 'Poon Hill (3,210m) → Tadapani (2,620m)',
      altitude: '3,210m summit',
      description: 'We wake at 5am and hike 45 minutes to Poon Hill in the dark. Then the sun rises behind Dhaulagiri and Annapurna South and the entire sky turns orange. No photograph does it justice. We hike down to Tadapani for lunch with forest views all afternoon.',
      highlights: ['Poon Hill sunrise at 3,210m', 'Dhaulagiri and Annapurna panorama', 'Forest descent'],
      tag: 'Summit day',
      type: 'trek',
    },
    {
      dayNumber: 6,
      date: 'Oct 17',
      title: 'Rest and Acclimatize at Tadapani',
      location: 'Tadapani (2,620m)',
      altitude: '2,620m',
      description: 'We take a deliberate rest day to let our bodies catch up. Short walk to a viewpoint above the village, afternoon photography session with Ramesh our guide, and time to journal or simply sit with the mountains.',
      highlights: ['Optional viewpoint hike', 'Photography session', 'Rest and recovery'],
      tag: 'Rest day',
      type: 'acclimatize',
    },
    {
      dayNumber: 7,
      date: 'Oct 18',
      title: 'Tadapani to Chhomrong',
      location: 'Chhomrong (2,170m)',
      altitude: '2,170m',
      description: 'A classic Himalayan up-down day. We lose 800m and gain it back on the way to Chhomrong, the gateway village to the Annapurna Sanctuary. The views of Hiunchuli and Annapurna South grow clearer with every step.',
      highlights: ['Chhomrong village terrace cafes', 'Annapurna South views', 'Gateway to the Sanctuary'],
      tag: null,
      type: 'trek',
    },
    {
      dayNumber: 8,
      date: 'Oct 19',
      title: 'Into the Sanctuary: Chhomrong to Dovan',
      location: 'Dovan (2,600m)',
      altitude: '2,600m',
      description: 'We descend through bamboo forest and cross the Chhomrong Khola before entering the bamboo and rhododendron zone that marks the entrance to the Annapurna Sanctuary. The landscape transforms dramatically.',
      highlights: ['Bamboo forest', 'Sanctuary entrance', 'Dramatic landscape shift'],
      tag: null,
      type: 'trek',
    },
    {
      dayNumber: 9,
      date: 'Oct 20',
      title: 'Dovan to Annapurna Base Camp',
      location: 'Annapurna Base Camp (4,130m)',
      altitude: '4,130m',
      description: 'The day we\'ve been building toward. We pass through Machapuchare Base Camp and arrive at Annapurna Base Camp surrounded by a 360° amphitheater of mountains. Six of the world\'s fourteen 8,000m peaks visible from one place.',
      highlights: ['Machapuchare Base Camp', 'Annapurna Base Camp arrival', '360° mountain amphitheater'],
      tag: 'Summit day',
      type: 'trek',
    },
    {
      dayNumber: 10,
      date: 'Oct 21',
      title: 'Base Camp Morning + Descent to Bamboo',
      location: 'ABC (4,130m) → Bamboo (2,310m)',
      altitude: '4,130m → 2,310m',
      description: 'One more sunrise at base camp before the long descent. We lose 1,800m today — knees will earn their pay — but we move fast through territory we know. Dinner at Bamboo feels celebratory.',
      highlights: ['Final ABC sunrise', 'Long descent', 'Celebratory dinner'],
      tag: null,
      type: 'trek',
    },
    {
      dayNumber: 11,
      date: 'Oct 22',
      title: 'Bamboo to Jhinu Danda + Hot Springs',
      location: 'Jhinu Danda (1,780m)',
      altitude: '1,780m',
      description: 'Our last full trekking day ends at the natural hot springs above the Modi Khola. We soak tired legs in the river pools, share stories from the past ten days, and sleep deeply.',
      highlights: ['Natural hot springs', 'Modi Khola river pools', 'Reflection evening'],
      tag: 'Rest day',
      type: 'rest',
    },
    {
      dayNumber: 12,
      date: 'Oct 23',
      title: 'Drive to Pokhara + Farewell Dinner',
      location: 'Pokhara (827m)',
      altitude: '827m',
      description: 'We drive back to Pokhara, check into a lakeside hotel, and spend the afternoon at leisure — some swim in Phewa Lake, some catch up on the photos. Our farewell dinner is the best meal of the trip.',
      highlights: ['Phewa Lake', 'Free afternoon', 'Farewell dinner'],
      tag: 'Farewell',
      type: 'cultural',
    },
    {
      dayNumber: 13,
      date: 'Oct 24',
      title: 'Depart Kathmandu',
      location: 'Kathmandu (1,400m) → Home',
      altitude: null,
      description: 'Early flight to Kathmandu and onwards home. Or stay a few days — we\'d understand.',
      highlights: ['Transfer to Kathmandu', 'International departures'],
      tag: 'Farewell',
      type: 'departure',
    },
  ];

  const included = [
    { index: 'I', title: 'Accommodation', description: 'All teahouse accommodation on trek, boutique hotel nights in Kathmandu and Pokhara.', included: true },
    { index: 'II', title: 'All meals on trek', description: 'Breakfast, lunch, and dinner every day on the trail. Kathmandu/Pokhara dinners included except day 1 and farewell.', included: true },
    { index: 'III', title: 'TIMS + ACAP permits', description: 'All trekking permits and national park entry fees.', included: true },
    { index: 'IV', title: 'Licensed guide + porter', description: 'TAAN-licensed guide Ramesh and one porter per two trekkers.', included: true },
    { index: 'V', title: 'KTM–Pokhara flights', description: 'Round-trip flights Kathmandu ↔ Pokhara (or bus if preferred).', included: true },
    { index: 'VI', title: 'Airport transfers', description: 'All in-country transfers throughout the itinerary.', included: true },
    { index: 'VII', title: 'International flights', description: 'You book your own flights to Kathmandu.', included: false },
    { index: 'VIII', title: 'Travel insurance', description: 'Required. Must cover trekking at altitude and emergency evacuation.', included: false },
    { index: 'IX', title: 'Personal spending', description: 'Tips, souvenirs, extra drinks, optional activities.', included: false },
    { index: 'X', title: 'Visa', description: 'Nepal visa on arrival ($50 USD). You handle this.', included: false },
  ];

  const faqs = [
    {
      question: 'How fit do I need to be?',
      answer: 'Honestly fit. We\'re hiking 6–8 hours a day at altitude for 10 consecutive days. You don\'t need to be an athlete, but you should be comfortable with long hikes and have no significant knee issues. We recommend training with weighted day hikes for 8+ weeks before the trip.',
    },
    {
      question: 'What does the deposit secure?',
      answer: 'The $800 deposit secures your spot in the group. The remaining balance is due 90 days before departure. The deposit is fully refundable up to 120 days before departure, and 50% refundable between 60–120 days.',
    },
    {
      question: 'How many people on this trip?',
      answer: 'Maximum 12. We keep it small intentionally — smaller groups move more efficiently, stay in better accommodation, and actually become friends.',
    },
    {
      question: 'What gear do I need?',
      answer: 'We\'ll send a full gear list to confirmed travelers. The essentials: good trekking boots (broken in!), a layering system, a down jacket, and trekking poles. You can rent almost everything in Kathmandu for cheap if you prefer not to bring it.',
    },
    {
      question: 'Will Jamie be there the whole time?',
      answer: 'Yes. This isn\'t a "Jamie-branded trip run by someone else." I\'m on the trail every day, eating every meal with you, watching every sunrise.',
    },
    {
      question: 'What\'s the altitude sickness risk?',
      answer: 'Real, but manageable. We acclimatize carefully and have a dedicated rest day built in. Our guide carries a pulse oximeter and supplemental oxygen. If someone struggles, we descend. No summit is worth your health.',
    },
  ];

  const drop = await prisma.drop.create({
    data: {
      slug: 'annapurna-oct-2026',
      creatorId: creator.id,
      operatorId: operator.id,
      title: 'Annapurna Circuit',
      subtitle: 'Twelve days, twelve people, one mountain.',
      description: 'The Annapurna Circuit is one of the world\'s great treks — and we\'re doing it right. Small group, expert guide, real food, and a pace that lets you actually be present.',
      creatorNote: 'I first walked the Annapurna Circuit in 2019, alone, with a disposable camera and no plan. I cried on Poon Hill. Not because it was hard — though it was — but because I had never stood in the middle of something so much bigger than myself and felt so completely okay with my own smallness.\n\nI\'ve been trying to get back ever since. This time, I want to go with people who understand why this matters. Not thrill-seekers. Not box-checkers. People who want to move through the mountains slowly enough to actually see them.\n\nWe\'ll spend twelve days walking. We\'ll eat in teahouses run by families who\'ve been doing this for generations. We\'ll watch the sun rise over Dhaulagiri from Poon Hill at 5am and none of us will be able to speak. We\'ll reach Annapurna Base Camp at 4,130 meters and stand in a ring of 8,000-meter peaks and understand, briefly, what it means to be a small animal on a large planet.\n\nI review every application personally. I\'m not looking for the most experienced trekkers — I\'m looking for people who are genuinely ready to be present for twelve days. People who will put their phones down occasionally. People who will talk to our guide. People who might become actual friends.\n\nIf that sounds like you, apply. The mountain doesn\'t care about your follower count. Neither do I.',
      destination: 'Annapurna Circuit',
      country: 'Nepal',
      heroImageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=2000&q=85',
      galleryImages: [
        'https://images.unsplash.com/photo-1553701006-6b8f5b87c9eb?w=1200&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
      ],
      departureDate: new Date('2026-10-12'),
      returnDate: new Date('2026-10-24'),
      applicationDeadline: new Date('2026-08-01'),
      totalSpots: 12,
      pricePerPerson: 380000, // $3,800 in cents
      depositAmount: 80000,  // $800 in cents
      depositDeadline: new Date('2026-06-01'),
      singleSupplement: 60000, // $600 in cents
      itinerary: itinerary as any,
      included: included as any,
      excluded: ['International flights to Kathmandu', 'Nepal visa ($50 on arrival)', 'Travel insurance (required)', 'Personal expenses'],
      faqs: faqs as any,
      status: 'LIVE',
      publishedAt: new Date(),
      metaTitle: 'Annapurna Circuit with Jamie Chen — Tripdrop',
      metaDescription: 'Twelve days in the Himalayas with Jamie Chen. 12 spots. Apply by August 1.',
    },
  });

  // Seed a few applications
  await prisma.application.createMany({
    data: [
      {
        dropId: drop.id,
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'alex.rivera@example.com',
        nationality: 'United States',
        passportCountry: 'United States',
        roomPreference: 'TWIN_SHARE',
        emergencyName: 'Maria Rivera',
        emergencyPhone: '+1 555 001 0001',
        motivation: 'I\'ve been following Jamie for three years, ever since I watched the Patagonia series during a particularly bad winter in Chicago. I\'m a landscape architect by day and I spend every vacation trying to get to places that remind me why I chose this career. The Himalayas have been on my list since I was 22. I\'m 34 now and I think this is finally the year. I\'m a strong hiker — I do 20-mile days in Colorado regularly — and I promise I\'m not going to be the person who complains about the teahouse food.',
        heardAbout: 'Instagram',
        status: 'SUBMITTED',
      },
      {
        dropId: drop.id,
        firstName: 'Sarah',
        lastName: 'Kim',
        email: 'sarah.kim@example.com',
        nationality: 'Canada',
        passportCountry: 'Canada',
        roomPreference: 'TWIN_SHARE',
        emergencyName: 'John Kim',
        emergencyPhone: '+1 604 555 0002',
        motivation: 'As a travel nurse, I spend most of my life in environments of controlled urgency. The mountains represent the opposite of that for me. I\'m not a beginner — I summited Kilimanjaro two years ago and spent a week trekking in Peru last spring. What draws me to this trip specifically is the group size and Jamie\'s application of the word "present." That word does something to me. I want twelve days of being present.',
        heardAbout: 'Newsletter',
        status: 'APPROVED',
      },
      {
        dropId: drop.id,
        firstName: 'Marcus',
        lastName: 'Thompson',
        email: 'marcus.t@example.com',
        nationality: 'United Kingdom',
        passportCountry: 'United Kingdom',
        roomPreference: 'SINGLE_SUPPLEMENT',
        emergencyName: 'Claire Thompson',
        emergencyPhone: '+44 7700 900003',
        motivation: 'I run a small architecture practice in London and I took my first real holiday in six years last winter — two weeks solo in Japan. It changed something. I started looking for ways to travel more slowly. I found Jamie\'s account through a photographer friend and spent an entire Sunday evening watching the Nepal footage. I\'m not a social media person by nature but I felt like I understood how Jamie sees the world. That\'s who I want to walk with.',
        heardAbout: 'From a friend',
        status: 'DEPOSIT_PAID',
        depositPaid: true,
        depositAmount: 80000,
        depositPaidAt: new Date('2026-01-15'),
      },
    ],
  });

  console.log('✓ Seed complete');
  console.log(`  Creator: ${creator.name} (slug: ${creator.slug})`);
  console.log(`  Operator: ${operator.name}`);
  console.log(`  Drop: ${drop.title} (slug: ${drop.slug})`);
  console.log(`  URL: /jamie/annapurna-oct-2026`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
