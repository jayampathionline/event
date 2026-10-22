import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Building2, Smartphone, CheckCircle, Tag, ArrowRight } from 'lucide-react';
import { EventItem, OrderItem } from '../data/mockData';
import { Coupon, calculateOrderSummary } from '../utils/ticketing';
import { Language, translations } from '../utils/i18n';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  selectedSeats: { row: string; number: number; tierId: string; id: string }[];
  ticketQuantities: { [tierId: string]: number };
  coupons: Coupon[];
  onOrderSuccess: (newOrder: OrderItem) => void;
  language: Language;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  event,
  selectedSeats,
  ticketQuantities,
  coupons,
  onOrderSuccess,
  language,
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  // Prepare ticket items
  const ticketItems: { tierId: string; tierName: string; quantity: number; unitPriceLKR: number }[] = [];

  if (selectedSeats.length > 0) {
    selectedSeats.forEach((seat) => {
      const tier = event.tiers.find((t) => t.id === seat.tierId) || event.tiers[0];
      const existing = ticketItems.find((ti) => ti.tierId === tier.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        ticketItems.push({
          tierId: tier.id,
          tierName: `${tier.name} (Seat ${seat.row}${seat.number})`,
          quantity: 1,
          unitPriceLKR: tier.priceLKR,
        });
      }
    });
  } else {
    // Quantities mode
    Object.entries(ticketQuantities).forEach(([tierId, qty]) => {
      if (qty > 0) {
        const tier = event.tiers.find((t) => t.id === tierId);
        if (tier) {
          ticketItems.push({
            tierId: tier.id,
            tierName: tier.name,
            quantity: qty,
            unitPriceLKR: tier.priceLKR,
          });
        }
      }
    });
  }

  // Attendee form state
  const [customerName, setCustomerName] = useState('Jayampathi Alahakoon');
  const [customerEmail, setCustomerEmail] = useState('jayampathi2@gmail.com');
  const [customerPhone, setCustomerPhone] = useState('+94 77 123 4567');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | undefined>(undefined);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'mobile_wallet'>('card');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8812');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('742');
  const [isProcessing, setIsProcessing] = useState(false);

  // Compute summary using pure ticketing engine
  const summary = calculateOrderSummary(
    ticketItems.map((ti) => ({ priceLKR: ti.unitPriceLKR, count: ti.quantity })),
    appliedCoupon,
    event.organizerId
  );

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const cleaned = couponInput.trim().toUpperCase();
    if (!cleaned) return;

    const found = coupons.find((c) => c.code.toUpperCase() === cleaned);
    if (!found) {
      setCouponError('Invalid coupon code. Try WELCOME10 or COLOMBO20');
      setAppliedCoupon(undefined);
      return;
    }
    if (!found.isActive) {
      setCouponError('This coupon is currently inactive');
      setAppliedCoupon(undefined);
      return;
    }
    if (found.organizerId !== 'all' && found.organizerId !== event.organizerId) {
      setCouponError('This coupon is specific to another organizer’s events.');
      setAppliedCoupon(undefined);
      return;
    }
    if (summary.ticketSubtotal < found.minPurchaseLKR) {
      setCouponError(`Requires minimum order of LKR ${found.minPurchaseLKR.toLocaleString()}`);
      setAppliedCoupon(undefined);
      return;
    }

    setAppliedCoupon(found);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketItems.length === 0 || summary.finalTotal <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);

      // Create new Order record
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const newOrder: OrderItem = {
        id: `ord-${Date.now()}`,
        bookingRef: `PLK-${randomSuffix}-${event.category.substring(0, 3).toUpperCase()}`,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        organizerId: event.organizerId,
        customerName,
        customerEmail,
        customerPhone,
        ticketItems,
        seats: selectedSeats.map((s) => ({ row: s.row, number: s.number, tierId: s.tierId })),
        couponCode: appliedCoupon?.code,
        ticketSubtotal: summary.ticketSubtotal,
        groupDiscountAmount: summary.groupDiscountAmount,
        couponDiscountAmount: summary.couponDiscountAmount,
        gatewayCommission: summary.gatewayCommission,
        finalTotal: summary.finalTotal,
        organizerNetPayout: summary.organizerNetPayout,
        paymentMethod,
        paymentStatus: 'successful',
        paymentGatewayRef: `PAYLK-${Date.now()}-APPROVED`,
        checkInStatus: 'not_checked_in',
        createdAt: new Date().toISOString(),
      };

      onOrderSuccess(newOrder);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-950 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Payments.lk Secure Checkout
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  LKR GATEWAY
                </span>
              </h3>
              <p className="text-xs text-neutral-400 truncate max-w-md">
                {event.title} · {event.venueName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close checkout modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          {/* Left Column: Form & Payment Method (7 cols) */}
          <div className="md:col-span-7 p-6 space-y-6">
            {/* Attendee Details */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3">
                1. Attendee Contact Information
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="Enter attendee legal name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Email for E-Ticket Delivery
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder="name@domain.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Mobile Number (SMS verification)
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder="+94 77 000 0000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payments.lk Payment Method */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3">
                2. Select Payments.lk Payment Gateway
              </h4>

              {/* Gateway Channel Selector */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1.5 ${
                    paymentMethod === 'card'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold leading-tight">Card Payment</span>
                  <span className="text-[10px] text-neutral-400">Visa / Mastercard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1.5 ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold leading-tight">LankaPay Net</span>
                  <span className="text-[10px] text-neutral-400">Direct Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('mobile_wallet')}
                  className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1.5 ${
                    paymentMethod === 'mobile_wallet'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold leading-tight">Mobile Wallet</span>
                  <span className="text-[10px] text-neutral-400">eZ Cash / Genie</span>
                </button>
              </div>

              {/* Card Inputs */}
              {paymentMethod === 'card' && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                        CVC / CVV
                      </label>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-300">
                  <p className="font-medium text-white mb-1">LankaPay National Payment Network:</p>
                  <p className="text-neutral-400 mb-2">
                    Commercial Bank, Sampath Bank, HNB, Seylan, BOC, Peoples Bank.
                  </p>
                  <p className="text-amber-400 text-[11px]">
                    Sandbox mode: Simulated 1-click real-time clearing enabled.
                  </p>
                </div>
              )}

              {paymentMethod === 'mobile_wallet' && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-300">
                  <p className="font-medium text-white mb-1">Dialog eZ Cash / Mobitel mCash / Genie:</p>
                  <p className="text-neutral-400 mb-2">
                    Authorization PIN will be sent to {customerPhone}.
                  </p>
                  <p className="text-emerald-400 text-[11px]">
                    Instant balance deduction via Payments.lk Mobile API.
                  </p>
                </div>
              )}
            </div>

            {/* Promo Code Input */}
            <div>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code (e.g. WELCOME10)"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {t.applyCoupon}
                </button>
              </form>

              {appliedCoupon && (
                <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Coupon <strong className="font-mono">{appliedCoupon.code}</strong> applied (
                  {appliedCoupon.discountType === 'percentage'
                    ? `${appliedCoupon.discountValue}% off`
                    : `LKR ${appliedCoupon.discountValue} off`}
                  )
                </p>
              )}
              {couponError && (
                <p className="mt-1.5 text-xs text-rose-400">
                  {couponError}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Transparent Commission Breakdown (5 cols) */}
          <div className="md:col-span-5 p-6 bg-neutral-950/60 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-4">
                Booking Summary & Fee Transparency
              </h4>

              {/* Items List */}
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                {ticketItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 border-b border-neutral-800/60">
                    <div>
                      <p className="font-medium text-white">{item.tierName}</p>
                      <p className="text-neutral-500 text-[11px]">
                        Qty: {item.quantity} × LKR {item.unitPriceLKR.toLocaleString()}
                      </p>
                    </div>
                    <span className="font-mono text-neutral-300">
                      LKR {(item.quantity * item.unitPriceLKR).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="space-y-2 text-xs pt-2">
                <div className="flex justify-between text-neutral-400">
                  <span>{t.subtotal}</span>
                  <span className="font-mono text-neutral-200">
                    LKR {summary.ticketSubtotal.toLocaleString()}
                  </span>
                </div>

                {summary.groupDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>
                      {t.groupDiscount} ({summary.groupDiscountPercent}%)
                    </span>
                    <span className="font-mono">
                      -LKR {summary.groupDiscountAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {summary.couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>{t.couponDiscount}</span>
                    <span className="font-mono">
                      -LKR {summary.couponDiscountAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Transparent Payments.lk commission box */}
                <div className="mt-3 p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-amber-400/90 font-medium">
                    <span>Payments.lk Gateway Fee:</span>
                    <span className="font-mono font-semibold">
                      LKR {summary.gatewayCommission.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-neutral-500 text-[10px]">
                    Formula: (2.6% × LKR {summary.subtotalAfterDiscounts.toLocaleString()}) + LKR 30 fixed fee.
                  </p>
                  <div className="flex items-center justify-between text-neutral-400 pt-1 border-t border-neutral-800/80">
                    <span>Net to Organizer:</span>
                    <span className="font-mono text-emerald-400">
                      LKR {summary.organizerNetPayout.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-white">{t.totalPayable}</span>
                    <span className="block text-[10px] text-neutral-400">All taxes & fees included</span>
                  </div>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    LKR {summary.finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="mt-6 pt-4 border-t border-neutral-800">
              <button
                type="button"
                disabled={isProcessing || ticketItems.length === 0}
                onClick={handleProcessPayment}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing with Payments.lk...</span>
                  </>
                ) : (
                  <>
                    <span>{t.payWithPaymentsLk} (LKR {summary.finalTotal.toLocaleString()})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-2 text-center">
                <span className="text-[10px] text-neutral-500">
                  {t.securePaymentsBadge}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
