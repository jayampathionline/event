/**
 * Pure business logic and calculation engines for ticketing, discounts,
 * Payments.lk commission calculations, and multi-tenant isolation.
 */

export interface TicketTier {
  id: string;
  name: string;
  priceLKR: number;
  available: number;
  total: number;
  perks: string[];
  color: string;
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  tierId: string;
  status: 'available' | 'reserved' | 'sold';
  bookedBy?: string;
}

export interface Coupon {
  code: string;
  organizerId: string; // If 'all', usable across; otherwise organizer specific
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseLKR: number;
  expiryDate: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
}

export interface CalculationResult {
  ticketSubtotal: number;
  ticketCount: number;
  groupDiscountPercent: number;
  groupDiscountAmount: number;
  couponDiscountAmount: number;
  subtotalAfterDiscounts: number;
  gatewayCommission: number;
  gatewayCommissionRate: number;
  gatewayFixedFee: number;
  finalTotal: number;
  organizerNetPayout: number;
}

// Payments.lk standard fee structure: 2.6% + 30 LKR per successful transaction
export const PAYMENTS_LK_RATE = 0.026;
export const PAYMENTS_LK_FIXED_FEE = 30; // LKR

/**
 * Calculates group discount percentage based on quantity.
 * 4-7 tickets: 10% discount
 * 8+ tickets: 15% discount
 */
export function getGroupDiscountPercent(ticketCount: number): number {
  if (ticketCount >= 8) return 15;
  if (ticketCount >= 4) return 10;
  return 0;
}

/**
 * Validates and applies coupon code.
 */
export function validateCoupon(
  coupon: Coupon | undefined,
  subtotalAfterGroupDiscount: number,
  organizerId: string,
  currentDateStr: string = '2026-10-22'
): { isValid: boolean; discountAmount: number; error?: string } {
  if (!coupon) {
    return { isValid: false, discountAmount: 0, error: 'Coupon code not found' };
  }
  if (!coupon.isActive) {
    return { isValid: false, discountAmount: 0, error: 'Coupon is inactive' };
  }
  if (coupon.usedCount >= coupon.maxUses) {
    return { isValid: false, discountAmount: 0, error: 'Coupon usage limit reached' };
  }
  if (coupon.expiryDate < currentDateStr) {
    return { isValid: false, discountAmount: 0, error: 'Coupon has expired' };
  }
  if (coupon.organizerId !== 'all' && coupon.organizerId !== organizerId) {
    return { isValid: false, discountAmount: 0, error: 'Coupon not valid for this organizer’s events' };
  }
  if (subtotalAfterGroupDiscount < coupon.minPurchaseLKR) {
    return {
      isValid: false,
      discountAmount: 0,
      error: `Minimum order amount of LKR ${coupon.minPurchaseLKR.toLocaleString()} required`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((subtotalAfterGroupDiscount * coupon.discountValue) / 100);
  } else {
    discountAmount = Math.min(coupon.discountValue, subtotalAfterGroupDiscount);
  }

  return { isValid: true, discountAmount };
}

/**
 * Calculates complete transparent financial breakdown including Payments.lk commission.
 */
export function calculateOrderSummary(
  ticketItems: { priceLKR: number; count: number }[],
  coupon?: Coupon,
  organizerId: string = 'org-1'
): CalculationResult {
  const ticketCount = ticketItems.reduce((acc, item) => acc + item.count, 0);
  const ticketSubtotal = ticketItems.reduce((acc, item) => acc + item.priceLKR * item.count, 0);

  const groupDiscountPercent = getGroupDiscountPercent(ticketCount);
  const groupDiscountAmount = Math.round((ticketSubtotal * groupDiscountPercent) / 100);
  const subtotalAfterGroup = Math.max(0, ticketSubtotal - groupDiscountAmount);

  let couponDiscountAmount = 0;
  if (coupon) {
    const couponValidation = validateCoupon(coupon, subtotalAfterGroup, organizerId);
    if (couponValidation.isValid) {
      couponDiscountAmount = couponValidation.discountAmount;
    }
  }

  const subtotalAfterDiscounts = Math.max(0, subtotalAfterGroup - couponDiscountAmount);

  // Payments.lk commission calculation: 2.6% of customer pay amount + 30 LKR fixed
  const gatewayCommission = subtotalAfterDiscounts > 0
    ? Math.round(subtotalAfterDiscounts * PAYMENTS_LK_RATE + PAYMENTS_LK_FIXED_FEE)
    : 0;

  const finalTotal = subtotalAfterDiscounts;
  const organizerNetPayout = Math.max(0, finalTotal - gatewayCommission);

  return {
    ticketSubtotal,
    ticketCount,
    groupDiscountPercent,
    groupDiscountAmount,
    couponDiscountAmount,
    subtotalAfterDiscounts,
    gatewayCommission,
    gatewayCommissionRate: PAYMENTS_LK_RATE,
    gatewayFixedFee: PAYMENTS_LK_FIXED_FEE,
    finalTotal,
    organizerNetPayout,
  };
}

/**
 * Filter events by organizer role (tenant isolation).
 * Super admins can see all events.
 * Organizers can only see their own events.
 */
export function filterEventsByRole<T extends { organizerId: string }>(
  events: T[],
  role: 'attendee' | 'organizer' | 'superadmin',
  currentOrganizerId?: string
): T[] {
  if (role === 'superadmin' || role === 'attendee') {
    return events;
  }
  return events.filter(e => e.organizerId === currentOrganizerId);
}

export interface WaitlistEntry {
  id: string;
  eventId: string;
  eventTitle: string;
  organizerId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  preferredTierId: string;
  preferredTierName: string;
  ticketCount: number;
  status: 'waiting' | 'notified' | 'claimed' | 'cancelled';
  position: number;
  createdAt: string;
  notifiedAt?: string;
}

/**
 * Checks whether an event is fully booked / sold out across all ticket tiers
 * or seats.
 */
export function isEventSoldOut(event: {
  tiers: { available: number }[];
  seats?: { status: string }[];
  hasAssignedSeating?: boolean;
}): boolean {
  if (!event.tiers || event.tiers.length === 0) return true;
  const allTiersSoldOut = event.tiers.every(t => t.available <= 0);
  if (allTiersSoldOut) return true;

  if (event.hasAssignedSeating && event.seats && event.seats.length > 0) {
    const hasAvailableSeats = event.seats.some(s => s.status === 'available');
    if (!hasAvailableSeats) return true;
  }

  return false;
}

/**
 * Returns the next queue position for a new waitlist entry for a given event.
 */
export function getWaitlistQueuePosition(
  entries: WaitlistEntry[],
  eventId: string
): number {
  const activeEventEntries = entries.filter(
    e => e.eventId === eventId && e.status !== 'cancelled'
  );
  return activeEventEntries.length + 1;
}

/**
 * Filter waitlist entries strictly by organizer ID to enforce tenant isolation.
 */
export function filterWaitlistByOrganizer(
  entries: WaitlistEntry[],
  organizerId: string
): WaitlistEntry[] {
  return entries.filter(entry => entry.organizerId === organizerId);
}

