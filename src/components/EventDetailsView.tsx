import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Share2,
  ShieldCheck,
  Tag,
  Check,
  Users,
  CreditCard,
  Sparkles,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import { EventItem, Organizer } from '../data/mockData';
import { SeatMap } from './SeatMap';
import { SocialShareModal } from './SocialShareModal';
import { WaitlistModal } from './WaitlistModal';
import { Language, translations } from '../utils/i18n';
import { getGroupDiscountPercent, isEventSoldOut, WaitlistEntry } from '../utils/ticketing';
import { AppTheme } from '../utils/theme';

interface EventDetailsViewProps {
  event: EventItem;
  organizer: Organizer;
  onBack: () => void;
  onProceedToCheckout: (
    selectedSeats: { row: string; number: number; tierId: string; id: string }[],
    quantities: { [tierId: string]: number }
  ) => void;
  existingWaitlist?: WaitlistEntry[];
  onJoinWaitlist?: (entry: WaitlistEntry) => void;
  language: Language;
  theme?: AppTheme;
}


export const EventDetailsView: React.FC<EventDetailsViewProps> = ({
  event,
  organizer,
  onBack,
  onProceedToCheckout,
  existingWaitlist = [],
  onJoinWaitlist = () => {},
  language,
  theme = 'bw-dark',
}) => {
  const t = translations[language];
  const soldOut = isEventSoldOut(event);

  // Waitlist modal state
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  // Seating selection state
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  // Quantity mode if not using seat map or for general
  const [ticketQuantities, setTicketQuantities] = useState<{ [tierId: string]: number }>({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'seats' | 'simple'>('seats');

  const handleToggleSeat = (seatId: string) => {
    if (soldOut) return;
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else {
        if (prev.length >= 10) return prev; // max 10
        return [...prev, seatId];
      }
    });
  };

  const selectedSeatsDetailed = event.seats.filter((s) => selectedSeatIds.includes(s.id));

  // Calculate subtotal
  let totalTicketCount = 0;
  let subtotal = 0;

  if (activeMode === 'seats') {
    totalTicketCount = selectedSeatsDetailed.length;
    subtotal = selectedSeatsDetailed.reduce((sum, seat) => {
      const tier = event.tiers.find((t) => t.id === seat.tierId) || event.tiers[0];
      return sum + tier.priceLKR;
    }, 0);
  } else {
    Object.entries(ticketQuantities).forEach(([tierId, qty]) => {
      const tier = event.tiers.find((t) => t.id === tierId);
      if (tier && qty > 0) {
        totalTicketCount += qty;
        subtotal += qty * tier.priceLKR;
      }
    });
  }

  const groupDiscountPercent = getGroupDiscountPercent(totalTicketCount);
  const groupDiscountAmount = Math.round((subtotal * groupDiscountPercent) / 100);
  const finalEstimate = subtotal - groupDiscountAmount;

  const handleCheckoutClick = () => {
    onProceedToCheckout(selectedSeatsDetailed, ticketQuantities);
  };

  return (
    <div className="space-y-6">
      {/* Top back navigation and share */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </button>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white transition-colors"
        >
          <Share2 className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.shareEvent}</span>
        </button>
      </div>

      {/* Hero Banner Section */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 aspect-[21/9] max-h-[380px]">
        <img
          src={event.bannerUrl}
          alt={event.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent"></div>

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-0.5 rounded bg-amber-500 text-neutral-950 font-bold uppercase">
              {event.category}
            </span>
            <span className="text-neutral-300">
              Organized by {organizer.company}
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight text-balance">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-300">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {event.date}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {event.time} GMT+5:30
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {event.venueName}, {event.city}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Seating Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Description & Interactive Seat Map (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Group discount or Sold-out waitlist banner */}
          {soldOut ? (
            <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Event Is Fully Booked</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {t.soldOut}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {t.waitlistNotice}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWaitlistOpen(true)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer ${
                  theme === 'bw-light'
                    ? 'bg-neutral-950 hover:bg-neutral-800 text-white'
                    : 'bg-white hover:bg-neutral-200 text-neutral-950'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{t.joinWaitlist}</span>
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-300">Group Discounts Automatically Applied!</p>
                <p className="text-neutral-400">
                  Book 4 to 7 tickets to save 10% instantly. Book 8 or more tickets for 15% off total order.
                </p>
              </div>
            </div>
          )}

          {/* Interactive Seat Map */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                {t.selectSeats}
              </h3>
              <span className="text-xs text-neutral-400 font-mono">
                Click any open seat to reserve
              </span>
            </div>

            <SeatMap
              seats={event.seats}
              tiers={event.tiers}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={handleToggleSeat}
              maxSeats={10}
              theme={theme}
            />
          </div>

          {/* About Event Description */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white">About This Event</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {event.description}
            </p>
            <div className="pt-3 border-t border-neutral-800 text-xs text-neutral-400 flex items-center gap-4">
              <span>Venue: <strong className="text-white">{event.address}</strong></span>
              <span>·</span>
              <span>Electronic Gate QR entry enabled</span>
            </div>
          </div>
        </div>

        {/* Right Column: Ticket Tiers & Checkout Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Available Ticket Tiers */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Ticket Tiers & Perks</h3>

            <div className="space-y-3">
              {event.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-white">{tier.name}</span>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      LKR {tier.priceLKR.toLocaleString()}
                    </span>
                  </div>

                  <ul className="text-[11px] text-neutral-400 space-y-1">
                    {tier.perks.map((perk, pIdx) => (
                      <li key={pIdx} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-1 text-[10px] text-neutral-500 font-mono">
                    Availability: {tier.available} of {tier.total} tickets left
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Order Summary Card or Waitlist Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 sticky top-20">
            {soldOut ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Priority Waitlist</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700 font-bold uppercase">
                    {t.soldOut}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-neutral-400">
                    <span>Queue Status:</span>
                    <span className="font-mono font-bold text-white">
                      {existingWaitlist.filter((w) => w.eventId === event.id && w.status !== 'cancelled').length} in line
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-400">
                    <span>Release Dispatch:</span>
                    <span className="text-emerald-400 font-semibold">Instant Email Alert</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-400">
                    <span>Reservation Window:</span>
                    <span className="font-mono text-white">24h Priority Link</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  Join the queue to receive an automated notification email via Payments.lk the moment a ticket or seat is released.
                </p>

                <button
                  type="button"
                  onClick={() => setIsWaitlistOpen(true)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                    theme === 'bw-light'
                      ? 'bg-neutral-950 hover:bg-neutral-800 text-white shadow-neutral-900/20'
                      : theme === 'bw-dark'
                      ? 'bg-white hover:bg-neutral-200 text-neutral-950 shadow-white/10'
                      : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>{t.joinWaitlist}</span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>No upfront payment · Instant email delivery</span>
                </div>
              </div>
            ) : totalTicketCount === 0 ? (
              <p className="text-xs text-neutral-400">
                Please select your preferred seats on the interactive map above to proceed.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-neutral-400 block text-[11px] mb-1">Seats Reserved:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedSeatsDetailed.map((seat) => (
                      <span
                        key={seat.id}
                        className="font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px]"
                      >
                        {seat.row}{seat.number}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800 space-y-1">
                  <div className="flex justify-between text-neutral-400">
                    <span>{t.subtotal} ({totalTicketCount} tickets)</span>
                    <span className="font-mono text-white">
                      LKR {subtotal.toLocaleString()}
                    </span>
                  </div>

                  {groupDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Group Discount ({groupDiscountPercent}%)</span>
                      <span className="font-mono">
                        -LKR {groupDiscountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-400 text-[11px]">
                    <span>Payments.lk Fee (2.6%+30):</span>
                    <span className="font-mono text-amber-400">
                      ~LKR {Math.round(finalEstimate * 0.026 + 30).toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline">
                    <span className="font-bold text-white">{t.totalPayable}</span>
                    <span className="text-lg font-bold font-mono text-amber-400">
                      LKR {finalEstimate.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-colors shadow-lg cursor-pointer ${
                    theme === 'bw-light'
                      ? 'bg-neutral-950 hover:bg-neutral-800 text-white shadow-neutral-900/20'
                      : theme === 'bw-dark'
                      ? 'bg-white hover:bg-neutral-200 text-neutral-950 shadow-white/10'
                      : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20'
                  }`}
                >
                  Continue to Payments.lk Checkout
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Payments.lk 256-bit SSL encrypted checkout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SocialShareModal
        event={event}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {isWaitlistOpen && (
        <WaitlistModal
          isOpen={isWaitlistOpen}
          onClose={() => setIsWaitlistOpen(false)}
          event={event}
          existingWaitlist={existingWaitlist}
          onJoinWaitlist={(entry) => {
            onJoinWaitlist(entry);
          }}
          language={language}
          theme={theme}
        />
      )}
    </div>
  );
};
