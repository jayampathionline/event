import React, { useState } from 'react';
import {
  Search,
  Calendar,
  MapPin,
  Tag,
  ArrowRight,
  Sparkles,
  Shield,
  QrCode,
  CreditCard,
  Bell,
  Clock,
} from 'lucide-react';
import { EventItem, Organizer } from '../data/mockData';
import { isEventSoldOut } from '../utils/ticketing';
import { Language, translations } from '../utils/i18n';
import { AppTheme } from '../utils/theme';

interface EventDiscoveryViewProps {
  events: EventItem[];
  organizers: Organizer[];
  onSelectEvent: (event: EventItem) => void;
  onOpenWaitlist?: (event: EventItem) => void;
  language: Language;
  theme?: AppTheme;
}


export const EventDiscoveryView: React.FC<EventDiscoveryViewProps> = ({
  events,
  organizers,
  onSelectEvent,
  language,
  theme = 'bw-dark',
}) => {
  const t = translations[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Music', 'Technology', 'Arts & Culture', 'Sports'];

  const filteredEvents = events.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (searchTerm) {
      const matchTitle = e.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchVenue = e.venueName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCity = e.city.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchTitle && !matchVenue && !matchCity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-10">
      {/* Hero Showcase Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900 px-6 py-12 md:px-12 md:py-16">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl"></div>
        </div>

        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Payments.lk Certified Ticketing Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight text-balance leading-tight">
            Discover and Book Unforgettable Events Across Sri Lanka & Beyond
          </h1>

          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-2xl">
            Live interactive seat maps, group bulk discounts, transparent Payments.lk gateway fee reporting, and automated instant QR entrance passes.
          </p>

          {/* Search Bar */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchEventsPlaceholder}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Feature Pills Strip */}
        <div className="relative mt-8 pt-6 border-t border-neutral-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-neutral-300 font-mono">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Payments.lk Gateway</span>
          </div>
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Instant Entrance QR</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Group Bulk Discounts</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Multi-Tenant Isolation</span>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div
          className={`flex flex-wrap items-center gap-1.5 p-1 rounded-xl border ${
            theme === 'bw-light'
              ? 'bg-neutral-100 border-neutral-300'
              : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          {categories.map((cat) => {
            let activeClass = '';
            if (theme === 'bw-light') {
              activeClass =
                selectedCategory === cat
                  ? 'bg-neutral-950 text-white font-bold shadow-md'
                  : 'text-neutral-600 hover:text-neutral-950';
            } else if (theme === 'bw-dark') {
              activeClass =
                selectedCategory === cat
                  ? 'bg-white text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white';
            } else {
              activeClass =
                selectedCategory === cat
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white';
            }

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeClass}`}
              >
                {cat === 'all' ? t.allCategories : cat}
              </button>
            );
          })}
        </div>

        <span className="text-xs font-mono text-neutral-500">
          Showing {filteredEvents.length} of {events.length} events
        </span>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredEvents.map((event) => {
          const org = organizers.find((o) => o.id === event.organizerId);
          const minPrice = Math.min(...event.tiers.map((t) => t.priceLKR));

          const cardBg =
            theme === 'bw-light'
              ? 'bg-white border-neutral-300 text-neutral-900 shadow-sm hover:border-neutral-400'
              : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-lg hover:border-neutral-700';

          const footerBg =
            theme === 'bw-light'
              ? 'bg-neutral-50 border-neutral-200'
              : 'bg-neutral-950/60 border-neutral-800';

          const priceColor =
            theme === 'bw-light'
              ? 'text-neutral-950 font-bold'
              : theme === 'bw-dark'
              ? 'text-white font-bold'
              : 'text-amber-400 font-bold';

          const buttonClass =
            theme === 'bw-light'
              ? 'bg-neutral-950 hover:bg-neutral-800 text-white shadow-neutral-900/10'
              : theme === 'bw-dark'
              ? 'bg-white hover:bg-neutral-200 text-neutral-950 shadow-white/10'
              : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/10';

          const soldOut = isEventSoldOut(event);

          return (
            <div
              key={event.id}
              className={`group border rounded-2xl overflow-hidden transition-all flex flex-col justify-between ${cardBg}`}
            >
              <div>
                {/* Image Aspect Box */}
                <div className="relative aspect-[16/9] overflow-hidden bg-neutral-950">
                  <img
                    src={event.bannerUrl}
                    alt={event.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent"></div>

                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md text-[11px] font-mono text-white font-semibold border border-neutral-800">
                      {event.category}
                    </span>
                  </div>

                  {soldOut && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-md bg-neutral-950/90 backdrop-blur-md text-[11px] font-mono text-amber-400 font-bold border border-amber-500/40 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{t.soldOut}</span>
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-neutral-200">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      {event.date} · {event.time}
                    </span>
                    <span className="text-[11px] text-neutral-300">
                      by {org?.company || 'Verified Organizer'}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-3">
                  <h3 className="text-base font-bold transition-colors line-clamp-1">
                    {event.title}
                  </h3>

                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 truncate pt-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{event.venueName}, {event.city}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className={`px-5 py-4 border-t flex items-center justify-between ${footerBg}`}>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block font-mono">
                    {soldOut ? t.soldOut : t.fromPrice}
                  </span>
                  <span className={`text-base font-mono ${priceColor}`}>
                    {soldOut ? 'LKR 0 (Waitlist)' : `LKR ${minPrice.toLocaleString()}`}
                  </span>
                </div>

                {soldOut ? (
                  <button
                    type="button"
                    onClick={() => (onOpenWaitlist ? onOpenWaitlist(event) : onSelectEvent(event))}
                    className={`flex items-center gap-1.5 py-2 px-4 rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer ${
                      theme === 'bw-light'
                        ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                        : 'bg-neutral-800 text-amber-300 hover:bg-neutral-750 border border-amber-500/30'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{t.joinWaitlist}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className={`flex items-center gap-1.5 py-2 px-4 rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer ${buttonClass}`}
                  >
                    <span>{t.selectSeats}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
