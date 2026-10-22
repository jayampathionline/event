import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getGroupDiscountPercent,
  validateCoupon,
  calculateOrderSummary,
  filterEventsByRole,
  isEventSoldOut,
  getWaitlistQueuePosition,
  filterWaitlistByOrganizer,
  type Coupon,
  type WaitlistEntry
} from './ticketing.js';


test('Group discount rules apply accurately', () => {
  assert.equal(getGroupDiscountPercent(1), 0);
  assert.equal(getGroupDiscountPercent(3), 0);
  assert.equal(getGroupDiscountPercent(4), 10);
  assert.equal(getGroupDiscountPercent(7), 10);
  assert.equal(getGroupDiscountPercent(8), 15);
  assert.equal(getGroupDiscountPercent(12), 15);
});

test('Payments.lk commission and order summary calculation', () => {
  // 4 tickets of 2500 LKR = 10,000 LKR
  // Group discount (4 tickets) = 10% = 1,000 LKR
  // Subtotal after group = 9,000 LKR
  // Gateway commission = 9000 * 0.026 + 30 = 234 + 30 = 264 LKR
  const result = calculateOrderSummary([{ priceLKR: 2500, count: 4 }]);
  assert.equal(result.ticketSubtotal, 10000);
  assert.equal(result.ticketCount, 4);
  assert.equal(result.groupDiscountPercent, 10);
  assert.equal(result.groupDiscountAmount, 1000);
  assert.equal(result.subtotalAfterDiscounts, 9000);
  assert.equal(result.gatewayCommission, 264);
  assert.equal(result.finalTotal, 9000);
  assert.equal(result.organizerNetPayout, 9000 - 264);
});

test('Coupon validation logic enforces limits, organizers, and minimum spend', () => {
  const coupon: Coupon = {
    code: 'PROMO20',
    organizerId: 'org-1',
    discountType: 'percentage',
    discountValue: 20,
    minPurchaseLKR: 5000,
    expiryDate: '2026-12-31',
    maxUses: 100,
    usedCount: 10,
    isActive: true,
  };

  // Valid usage
  const valid = validateCoupon(coupon, 10000, 'org-1');
  assert.equal(valid.isValid, true);
  assert.equal(valid.discountAmount, 2000);

  // Wrong organizer isolation
  const wrongOrg = validateCoupon(coupon, 10000, 'org-2');
  assert.equal(wrongOrg.isValid, false);
  assert.match(wrongOrg.error || '', /organizer/);

  // Below minimum spend
  const belowMin = validateCoupon(coupon, 3000, 'org-1');
  assert.equal(belowMin.isValid, false);
});

test('Event isolation strictly shields organizer events from other organizers', () => {
  const sampleEvents = [
    { id: 'ev-1', title: 'Tech Expo', organizerId: 'org-1' },
    { id: 'ev-2', title: 'Music Fest', organizerId: 'org-2' },
    { id: 'ev-3', title: 'Design Meetup', organizerId: 'org-1' },
  ];

  const org1Events = filterEventsByRole(sampleEvents, 'organizer', 'org-1');
  assert.equal(org1Events.length, 2);
  assert.ok(org1Events.every(e => e.organizerId === 'org-1'));

  const org2Events = filterEventsByRole(sampleEvents, 'organizer', 'org-2');
  assert.equal(org2Events.length, 1);
  assert.equal(org2Events[0].id, 'ev-2');

  const superAdminEvents = filterEventsByRole(sampleEvents, 'superadmin');
  assert.equal(superAdminEvents.length, 3);
});

test('isEventSoldOut correctly detects fully booked events and open events', () => {
  const soldOutEvent = {
    tiers: [
      { available: 0, total: 20 },
      { available: 0, total: 40 },
    ],
    seats: [
      { status: 'sold' },
      { status: 'sold' },
    ],
    hasAssignedSeating: true,
  };
  assert.equal(isEventSoldOut(soldOutEvent), true);

  const availableEvent = {
    tiers: [
      { available: 5, total: 20 },
      { available: 0, total: 40 },
    ],
    hasAssignedSeating: false,
  };
  assert.equal(isEventSoldOut(availableEvent), false);
});

test('Waitlist queue position calculation and organizer isolation', () => {
  const sampleWaitlist: WaitlistEntry[] = [
    {
      id: 'wl-1',
      eventId: 'ev-100',
      eventTitle: 'Symphony',
      organizerId: 'org-1',
      userName: 'Alice',
      userEmail: 'alice@example.com',
      userPhone: '+94 77 111 2222',
      preferredTierId: 'tier-vip',
      preferredTierName: 'VIP',
      ticketCount: 2,
      status: 'waiting',
      position: 1,
      createdAt: '2026-10-22',
    },
    {
      id: 'wl-2',
      eventId: 'ev-100',
      eventTitle: 'Symphony',
      organizerId: 'org-1',
      userName: 'Bob',
      userEmail: 'bob@example.com',
      userPhone: '+94 77 333 4444',
      preferredTierId: 'tier-gen',
      preferredTierName: 'General',
      ticketCount: 1,
      status: 'waiting',
      position: 2,
      createdAt: '2026-10-22',
    },
    {
      id: 'wl-3',
      eventId: 'ev-200',
      eventTitle: 'Tech Summit',
      organizerId: 'org-2',
      userName: 'Charlie',
      userEmail: 'charlie@example.com',
      userPhone: '+94 77 555 6666',
      preferredTierId: 'tier-vip',
      preferredTierName: 'VIP Pass',
      ticketCount: 3,
      status: 'waiting',
      position: 1,
      createdAt: '2026-10-22',
    },
  ];

  // Next position for ev-100 is 3
  assert.equal(getWaitlistQueuePosition(sampleWaitlist, 'ev-100'), 3);
  // Next position for ev-200 is 2
  assert.equal(getWaitlistQueuePosition(sampleWaitlist, 'ev-200'), 2);
  // Next position for a new event with no waitlist is 1
  assert.equal(getWaitlistQueuePosition(sampleWaitlist, 'ev-300'), 1);

  // Tenant isolation check
  const org1Waitlist = filterWaitlistByOrganizer(sampleWaitlist, 'org-1');
  assert.equal(org1Waitlist.length, 2);
  assert.ok(org1Waitlist.every(w => w.organizerId === 'org-1'));

  const org2Waitlist = filterWaitlistByOrganizer(sampleWaitlist, 'org-2');
  assert.equal(org2Waitlist.length, 1);
  assert.equal(org2Waitlist[0].userName, 'Charlie');

  const org3Waitlist = filterWaitlistByOrganizer(sampleWaitlist, 'org-3');
  assert.equal(org3Waitlist.length, 0);
});

