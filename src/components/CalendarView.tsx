import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Tag, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { EventItem } from '../data/mockData';
import { Language, translations } from '../utils/i18n';

interface CalendarViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  language: Language;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events, onSelectEvent, language }) => {
  const t = translations[language];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState<string>('November 2026');

  const categories = ['all', 'Music', 'Technology', 'Arts & Culture', 'Sports'];

  const filteredEvents = events.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Calendar Header with Category Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{t.calendarView}</h2>
            <p className="text-xs text-neutral-400">
              Browse all scheduled events across Colombo & South Asia
            </p>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-lg">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {cat === 'all' ? t.allCategories : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map((evt) => {
          const dateObj = new Date(evt.date);
          const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
          const dayNumber = dateObj.toLocaleDateString('en-US', { day: '2-digit' });
          const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

          const minPrice = Math.min(...evt.tiers.map((t) => t.priceLKR));

          return (
            <div
              key={evt.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                {/* Date badge & Category */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-center min-w-[50px]">
                      <span className="block text-[10px] uppercase font-mono text-amber-400 font-bold">
                        {monthName}
                      </span>
                      <span className="block text-xl font-bold font-mono text-white leading-none my-0.5">
                        {dayNumber}
                      </span>
                      <span className="block text-[9px] uppercase text-neutral-400 font-mono">
                        {weekday}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                        {evt.category}
                      </span>
                      <h3 className="text-sm font-bold text-white line-clamp-1">
                        {evt.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 line-clamp-2">
                  {evt.description}
                </p>

                {/* Venue and Time */}
                <div className="space-y-1 text-xs text-neutral-400 pt-2 border-t border-neutral-800/80">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{evt.time} GMT+5:30</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate">{evt.venueName}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="px-5 py-3 bg-neutral-950/60 border-t border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">{t.fromPrice}</span>
                  <span className="text-sm font-bold font-mono text-amber-400">
                    LKR {minPrice.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => onSelectEvent(evt)}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  <span>{t.bookTickets}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
