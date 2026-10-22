import { TicketTier, Seat, Coupon, WaitlistEntry } from '../utils/ticketing';

export interface Organizer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  commissionRate: number; // e.g. 2.6
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface EventItem {
  id: string;
  organizerId: string;
  title: string;
  slug: string;
  category: 'Music' | 'Technology' | 'Arts & Culture' | 'Sports' | 'Business';
  date: string;
  time: string;
  venueName: string;
  address: string;
  city: string;
  description: string;
  bannerUrl: string;
  tiers: TicketTier[];
  seats: Seat[];
  hasAssignedSeating: boolean;
  status: 'published' | 'draft' | 'completed';
}

export interface OrderItem {
  id: string;
  bookingRef: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  organizerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  ticketItems: { tierId: string; tierName: string; quantity: number; unitPriceLKR: number }[];
  seats: { row: string; number: number; tierId: string }[];
  couponCode?: string;
  ticketSubtotal: number;
  groupDiscountAmount: number;
  couponDiscountAmount: number;
  gatewayCommission: number;
  finalTotal: number;
  organizerNetPayout: number;
  paymentMethod: 'card' | 'bank_transfer' | 'mobile_wallet';
  paymentStatus: 'successful' | 'pending' | 'failed';
  paymentGatewayRef: string;
  checkInStatus: 'not_checked_in' | 'checked_in';
  checkInTimestamp?: string;
  createdAt: string;
}

export const initialOrganizers: Organizer[] = [
  {
    id: 'org-1',
    name: 'Kasun Jayawardena',
    company: 'Colombo Arts & Sound',
    email: 'events@colomboarts.lk',
    phone: '+94 77 123 4567',
    commissionRate: 2.6,
    status: 'active',
    createdAt: '2026-08-15',
  },
  {
    id: 'org-2',
    name: 'Nimesha Perera',
    company: 'Lanka Tech & Venture',
    email: 'hello@lankatech.lk',
    phone: '+94 71 987 6543',
    commissionRate: 2.6,
    status: 'active',
    createdAt: '2026-09-01',
  },
  {
    id: 'org-3',
    name: 'Rohan Wickremasinghe',
    company: 'Global Arena Sports',
    email: 'contact@arenaglobal.lk',
    phone: '+94 76 555 4321',
    commissionRate: 2.6,
    status: 'active',
    createdAt: '2026-09-20',
  },
];

// Helper to generate a realistic seat grid for venue
function generateSeatsForEvent(eventId: string): Seat[] {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seats: Seat[] = [];

  rows.forEach((row, rowIndex) => {
    for (let num = 1; num <= 10; num++) {
      let tierId = 'tier-gen';
      if (rowIndex < 2) {
        tierId = 'tier-vip';
      } else if (rowIndex < 4) {
        tierId = 'tier-prem';
      }

      // Simulate a few pre-booked seats
      const isPreBooked = (rowIndex === 0 && num === 3) || (rowIndex === 1 && num === 6) || (rowIndex === 2 && num === 2);

      seats.push({
        id: `${eventId}-${row}${num}`,
        row,
        number: num,
        tierId,
        status: isPreBooked ? 'sold' : 'available',
      });
    }
  });

  return seats;
}

export const initialEvents: EventItem[] = [
  {
    id: 'ev-1',
    organizerId: 'org-1',
    title: 'Colombo International Music & Lights Fest 2026',
    slug: 'colombo-music-lights-fest-2026',
    category: 'Music',
    date: '2026-11-14',
    time: '19:00',
    venueName: 'Lotus Tower Open Amphitheater',
    address: 'D.R. Wijewardena Mawatha, Colombo 10',
    city: 'Colombo',
    description:
      'Experience a spellbinding evening of global live electronic and acoustic fusion featuring headline international and local artists, immersive laser synchronized lighting, and gourmet food pavilions.',
    bannerUrl: '/src/assets/images/hero_concert_stage_1792656910076.jpg',
    hasAssignedSeating: true,
    status: 'published',
    tiers: [
      {
        id: 'tier-vip',
        name: 'VIP Front Stage & Lounge',
        priceLKR: 12500,
        available: 38,
        total: 40,
        perks: ['Front-stage lounge access', 'Complimentary welcome mocktail', 'Dedicated VIP fast-track entrance'],
        color: '#f59e0b',
      },
      {
        id: 'tier-prem',
        name: 'Premium Golden Circle',
        priceLKR: 7500,
        available: 39,
        total: 40,
        perks: ['Elevated center view', 'Private bar lane access', 'Commemorative event lanyard'],
        color: '#3b82f6',
      },
      {
        id: 'tier-gen',
        name: 'General Admission',
        priceLKR: 3500,
        available: 119,
        total: 120,
        perks: ['Festival grounds access', 'Food festival zone entry', 'Main stage acoustic arena'],
        color: '#10b981',
      },
    ],
    seats: generateSeatsForEvent('ev-1'),
  },
  {
    id: 'ev-2',
    organizerId: 'org-2',
    title: 'Asia-Pacific Tech & AI Summit 2026',
    slug: 'apac-tech-ai-summit-2026',
    category: 'Technology',
    date: '2026-11-28',
    time: '09:00',
    venueName: 'BMICH Convention Center',
    address: 'Bauddhaloka Mawatha, Colombo 07',
    city: 'Colombo',
    description:
      'The landmark gathering for AI architects, founders, enterprise executives, and venture capital partners exploring multi-agent architectures, cloud platforms, and sovereign AI across the Indo-Pacific.',
    bannerUrl: '/src/assets/images/event_tech_summit_1792656910596.jpg',
    hasAssignedSeating: true,
    status: 'published',
    tiers: [
      {
        id: 'tier-vip',
        name: 'Executive All-Access Pass',
        priceLKR: 28000,
        available: 18,
        total: 20,
        perks: ['Closed-door investor roundtables', 'Speaker & VIP banquet dinner', 'Exclusive keynote front rows'],
        color: '#f59e0b',
      },
      {
        id: 'tier-prem',
        name: 'Standard Delegate Pass',
        priceLKR: 14500,
        available: 78,
        total: 80,
        perks: ['Full mainstage access', 'Exhibition tech hall', 'Buffet networking lunch & tea'],
        color: '#3b82f6',
      },
      {
        id: 'tier-gen',
        name: 'Founder & Student Pass',
        priceLKR: 5500,
        available: 40,
        total: 40,
        perks: ['Mainstage afternoon tracks', 'Startup pitching showcase', 'Digital resource pack'],
        color: '#10b981',
      },
    ],
    seats: generateSeatsForEvent('ev-2'),
  },
  {
    id: 'ev-3',
    organizerId: 'org-1',
    title: 'Royal Symphony Orchestra: Masterworks Gala',
    slug: 'royal-symphony-orchestra-gala',
    category: 'Arts & Culture',
    date: '2026-12-05',
    time: '18:30',
    venueName: 'Nelum Pokuna Mahinda Rajapaksa Theatre',
    address: 'Ananda Coomaraswamy Mawatha, Colombo 07',
    city: 'Colombo',
    description:
      'An exquisite evening of classical masterpieces from Dvořák, Beethoven, and celebrated Sri Lankan compositions conducted by Maestro David Hall with the national choir.',
    bannerUrl: '/src/assets/images/event_symphony_hall_1792656910482.jpg',
    hasAssignedSeating: true,
    status: 'published',
    tiers: [
      {
        id: 'tier-vip',
        name: 'Presidential Box / Stalls',
        priceLKR: 15000,
        available: 0,
        total: 20,
        perks: ['Central prime acoustics', 'Champagne/mocktail intermission reception', 'Printed collector’s programme'],
        color: '#f59e0b',
      },
      {
        id: 'tier-prem',
        name: 'Grand Tier Balcony',
        priceLKR: 8500,
        available: 0,
        total: 40,
        perks: ['Unobstructed elevated acoustic perspective', 'Balcony foyer access'],
        color: '#3b82f6',
      },
      {
        id: 'tier-gen',
        name: 'Upper Circle',
        priceLKR: 4000,
        available: 0,
        total: 60,
        perks: ['Great acoustics and sightline', 'Standard theatre seating'],
        color: '#10b981',
      },
    ],
    seats: generateSeatsForEvent('ev-3').map(s => ({ ...s, status: 'sold' as const })),
  },
  {
    id: 'ev-4',
    organizerId: 'org-3',
    title: 'South Asian Basketball Premier Championship',
    slug: 'south-asian-basketball-premier-2026',
    category: 'Sports',
    date: '2026-12-18',
    time: '17:00',
    venueName: 'Sugathadasa Indoor Stadium',
    address: 'Arthur de Silva Mawatha, Colombo 13',
    city: 'Colombo',
    description:
      'High-octane tournament finals featuring national clubs competing for the prestigious South Asian title with halftime performances and youth dunk contests.',
    bannerUrl: '/src/assets/images/event_sports_arena_1792656911058.jpg',
    hasAssignedSeating: true,
    status: 'published',
    tiers: [
      {
        id: 'tier-vip',
        name: 'Courtside Row 1',
        priceLKR: 18000,
        available: 12,
        total: 12,
        perks: ['Feet on the hardwood', 'VIP players tunnel pass', 'Unlimited concessions pass'],
        color: '#f59e0b',
      },
      {
        id: 'tier-prem',
        name: 'Lower Bowl Center',
        priceLKR: 6500,
        available: 60,
        total: 60,
        perks: ['Center court sightlines', 'Numbered reserved seating'],
        color: '#3b82f6',
      },
      {
        id: 'tier-gen',
        name: 'Upper Bleachers',
        priceLKR: 2000,
        available: 150,
        total: 150,
        perks: ['Atmospheric cheering section', 'General stadium entry'],
        color: '#10b981',
      },
    ],
    seats: generateSeatsForEvent('ev-4'),
  },
];

export const initialCoupons: Coupon[] = [
  {
    code: 'WELCOME10',
    organizerId: 'all',
    discountType: 'percentage',
    discountValue: 10,
    minPurchaseLKR: 2000,
    expiryDate: '2026-12-31',
    maxUses: 500,
    usedCount: 84,
    isActive: true,
  },
  {
    code: 'COLOMBO20',
    organizerId: 'org-1',
    discountType: 'percentage',
    discountValue: 20,
    minPurchaseLKR: 7000,
    expiryDate: '2026-11-20',
    maxUses: 100,
    usedCount: 37,
    isActive: true,
  },
  {
    code: 'TECH500',
    organizerId: 'org-2',
    discountType: 'fixed',
    discountValue: 500,
    minPurchaseLKR: 5000,
    expiryDate: '2026-11-30',
    maxUses: 200,
    usedCount: 62,
    isActive: true,
  },
  {
    code: 'SPORTSFAN',
    organizerId: 'org-3',
    discountType: 'percentage',
    discountValue: 15,
    minPurchaseLKR: 4000,
    expiryDate: '2026-12-25',
    maxUses: 150,
    usedCount: 29,
    isActive: true,
  },
];

export const initialOrders: OrderItem[] = [
  {
    id: 'ord-101',
    bookingRef: 'PLK-98124-COL',
    eventId: 'ev-1',
    eventTitle: 'Colombo International Music & Lights Fest 2026',
    eventDate: '2026-11-14',
    organizerId: 'org-1',
    customerName: 'Sanjaya Fernando',
    customerEmail: 'sanjaya.f@gmail.com',
    customerPhone: '+94 77 222 3344',
    ticketItems: [{ tierId: 'tier-vip', tierName: 'VIP Front Stage & Lounge', quantity: 2, unitPriceLKR: 12500 }],
    seats: [
      { row: 'A', number: 3, tierId: 'tier-vip' },
      { row: 'B', number: 6, tierId: 'tier-vip' },
    ],
    couponCode: 'WELCOME10',
    ticketSubtotal: 25000,
    groupDiscountAmount: 0,
    couponDiscountAmount: 2500,
    gatewayCommission: 615, // 22500 * 0.026 + 30
    finalTotal: 22500,
    organizerNetPayout: 21885,
    paymentMethod: 'card',
    paymentStatus: 'successful',
    paymentGatewayRef: 'PAYLK-TXN-90281-OK',
    checkInStatus: 'checked_in',
    checkInTimestamp: '2026-10-21T18:45:00',
    createdAt: '2026-10-21T14:20:00',
  },
  {
    id: 'ord-102',
    bookingRef: 'PLK-65412-TEC',
    eventId: 'ev-2',
    eventTitle: 'Asia-Pacific Tech & AI Summit 2026',
    eventDate: '2026-11-28',
    organizerId: 'org-2',
    customerName: 'Anuki Mendis',
    customerEmail: 'anuki.mendis@techcorp.io',
    customerPhone: '+94 71 888 9911',
    ticketItems: [{ tierId: 'tier-prem', tierName: 'Standard Delegate Pass', quantity: 4, unitPriceLKR: 14500 }],
    seats: [],
    couponCode: undefined,
    ticketSubtotal: 58000,
    groupDiscountAmount: 5800, // 10% group discount for 4
    couponDiscountAmount: 0,
    gatewayCommission: 1387, // 52200 * 0.026 + 30
    finalTotal: 52200,
    organizerNetPayout: 50813,
    paymentMethod: 'bank_transfer',
    paymentStatus: 'successful',
    paymentGatewayRef: 'PAYLK-TXN-88421-OK',
    checkInStatus: 'not_checked_in',
    createdAt: '2026-10-21T16:10:00',
  },
  {
    id: 'ord-103',
    bookingRef: 'PLK-44219-SYM',
    eventId: 'ev-3',
    eventTitle: 'Royal Symphony Orchestra: Masterworks Gala',
    eventDate: '2026-12-05',
    organizerId: 'org-1',
    customerName: 'Dilshan Silva',
    customerEmail: 'dilshan.silva@outlook.com',
    customerPhone: '+94 77 345 6789',
    ticketItems: [{ tierId: 'tier-prem', tierName: 'Grand Tier Balcony', quantity: 1, unitPriceLKR: 8500 }],
    seats: [{ row: 'C', number: 2, tierId: 'tier-prem' }],
    couponCode: undefined,
    ticketSubtotal: 8500,
    groupDiscountAmount: 0,
    couponDiscountAmount: 0,
    gatewayCommission: 251, // 8500 * 0.026 + 30
    finalTotal: 8500,
    organizerNetPayout: 8249,
    paymentMethod: 'card',
    paymentStatus: 'successful',
    paymentGatewayRef: 'PAYLK-TXN-77312-OK',
    checkInStatus: 'not_checked_in',
    createdAt: '2026-10-22T00:30:00',
  },
];

export const initialWaitlist: WaitlistEntry[] = [
  {
    id: 'wl-101',
    eventId: 'ev-3',
    eventTitle: 'Royal Symphony Orchestra: Masterworks Gala',
    organizerId: 'org-1',
    userName: 'Kavindu Senanayake',
    userEmail: 'kavindu.s@gmail.com',
    userPhone: '+94 77 456 7890',
    preferredTierId: 'tier-vip',
    preferredTierName: 'Presidential Box / Stalls',
    ticketCount: 2,
    status: 'waiting',
    position: 1,
    createdAt: '2026-10-21 09:30',
  },
  {
    id: 'wl-102',
    eventId: 'ev-3',
    eventTitle: 'Royal Symphony Orchestra: Masterworks Gala',
    organizerId: 'org-1',
    userName: 'Tharushi Fernando',
    userEmail: 'tharushi.f@outlook.com',
    userPhone: '+94 71 234 5678',
    preferredTierId: 'tier-prem',
    preferredTierName: 'Grand Tier Balcony',
    ticketCount: 4,
    status: 'notified',
    position: 2,
    createdAt: '2026-10-21 11:15',
    notifiedAt: '2026-10-22 08:00',
  },
  {
    id: 'wl-103',
    eventId: 'ev-3',
    eventTitle: 'Royal Symphony Orchestra: Masterworks Gala',
    organizerId: 'org-1',
    userName: 'Malik Al-Hassan',
    userEmail: 'malik.alhassan@ceylonbiz.com',
    userPhone: '+94 76 890 1234',
    preferredTierId: 'tier-gen',
    preferredTierName: 'Upper Circle',
    ticketCount: 2,
    status: 'waiting',
    position: 3,
    createdAt: '2026-10-21 14:40',
  },
];

