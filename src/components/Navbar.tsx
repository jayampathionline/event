import React from 'react';
import { Calendar, Ticket, ShieldCheck, Briefcase, Globe, Moon, Sun, Contrast } from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { Organizer } from '../data/mockData';
import { AppTheme } from '../utils/theme';

interface NavbarProps {
  currentTab: 'events' | 'calendar' | 'my-tickets' | 'organizer' | 'superadmin';
  setCurrentTab: (tab: 'events' | 'calendar' | 'my-tickets' | 'organizer' | 'superadmin') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  organizers: Organizer[];
  currentOrganizerId: string;
  setCurrentOrganizerId: (id: string) => void;
  bookedCount: number;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  organizers,
  currentOrganizerId,
  setCurrentOrganizerId,
  bookedCount,
  theme,
  setTheme,
}) => {
  const t = translations[language];
  const isLight = theme === 'bw-light';
  const isBW = theme === 'bw-dark' || theme === 'bw-light';

  const headerBg = isLight
    ? 'bg-white/95 border-neutral-300 text-neutral-900'
    : 'bg-neutral-950/95 border-neutral-800 text-neutral-100';

  const activeTabClass = isLight
    ? 'text-neutral-950 font-bold border-b-2 border-neutral-950'
    : isBW
    ? 'text-white font-bold border-b-2 border-white'
    : 'text-amber-400 font-bold border-b-2 border-amber-400';

  const inactiveTabClass = isLight
    ? 'text-neutral-600 hover:text-neutral-950'
    : 'text-neutral-400 hover:text-neutral-200';

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentTab('events')}
            className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
            aria-label="TicketPulse Home"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                isLight
                  ? 'bg-neutral-900 text-white'
                  : isBW
                  ? 'bg-white text-neutral-950'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
              }`}
            >
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight whitespace-nowrap">
                Ticket<span className={isBW ? (isLight ? 'text-neutral-600' : 'text-neutral-400') : 'text-amber-400'}>Pulse</span>
              </span>
              <span
                className={`hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded border ${
                  isLight
                    ? 'border-neutral-300 text-neutral-600'
                    : 'border-neutral-800 text-neutral-400'
                }`}
              >
                Payments.lk verified
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setCurrentTab('events')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'events' ? activeTabClass : inactiveTabClass
            }`}
          >
            {t.browseEvents}
          </button>

          <button
            onClick={() => setCurrentTab('calendar')}
            className={`flex items-center gap-1.5 whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'calendar' ? activeTabClass : inactiveTabClass
            }`}
          >
            <Calendar className="w-4 h-4" />
            {t.calendarView}
          </button>

          <button
            onClick={() => setCurrentTab('my-tickets')}
            className={`flex items-center gap-1.5 whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'my-tickets' ? activeTabClass : inactiveTabClass
            }`}
          >
            <Ticket className="w-4 h-4" />
            My Tickets
            {bookedCount > 0 && (
              <span
                className={`ml-1 text-xs px-1.5 py-0.2 rounded-full font-mono ${
                  isLight
                    ? 'bg-neutral-200 text-neutral-900'
                    : isBW
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {bookedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('organizer')}
            className={`flex items-center gap-1.5 whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'organizer' ? activeTabClass : inactiveTabClass
            }`}
          >
            <Briefcase className="w-4 h-4" />
            {t.organizerPortal}
          </button>

          <button
            onClick={() => setCurrentTab('superadmin')}
            className={`flex items-center gap-1.5 whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'superadmin' ? activeTabClass : inactiveTabClass
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {t.superAdmin}
          </button>
        </nav>

        {/* Zone 3: Controls, B&W Theme Selector, and Language */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Dedicated B&W Theme Selector */}
          <div
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs border ${
              isLight
                ? 'bg-neutral-100 border-neutral-300'
                : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <Contrast className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as AppTheme)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer text-xs"
              aria-label="Select Theme Version"
            >
              <option value="bw-dark" className="bg-neutral-900 text-white">B&W Noir (Dark)</option>
              <option value="bw-light" className="bg-white text-neutral-900">B&W Paper (Light)</option>
              <option value="classic" className="bg-neutral-900 text-amber-400">Classic Color</option>
            </select>
          </div>

          {/* If on organizer portal, organizer selector */}
          {currentTab === 'organizer' && (
            <div
              className={`hidden sm:flex items-center gap-1.5 text-xs rounded-md px-2 py-1 border ${
                isLight
                  ? 'bg-neutral-100 border-neutral-300'
                  : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <span className="text-neutral-500">Tenant:</span>
              <select
                value={currentOrganizerId}
                onChange={(e) => setCurrentOrganizerId(e.target.value)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer text-xs"
                aria-label="Select Event Organizer"
              >
                {organizers.map((org) => (
                  <option
                    key={org.id}
                    value={org.id}
                    className={isLight ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'}
                  >
                    {org.company}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Language Selector */}
          <div
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs border ${
              isLight
                ? 'bg-neutral-100 border-neutral-300'
                : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <Globe className="w-3 h-3 text-neutral-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer text-xs"
              aria-label="Select Language"
            >
              <option value="en" className={isLight ? 'bg-white text-black' : 'bg-neutral-900 text-white'}>EN</option>
              <option value="si" className={isLight ? 'bg-white text-black' : 'bg-neutral-900 text-white'}>සිං</option>
              <option value="ta" className={isLight ? 'bg-white text-black' : 'bg-neutral-900 text-white'}>தமிழ்</option>
              <option value="fr" className={isLight ? 'bg-white text-black' : 'bg-neutral-900 text-white'}>FR</option>
              <option value="es" className={isLight ? 'bg-white text-black' : 'bg-neutral-900 text-white'}>ES</option>
            </select>
          </div>

          {/* Mobile Tab Select Dropdown */}
          <div className="lg:hidden">
            <select
              value={currentTab}
              onChange={(e) => setCurrentTab(e.target.value as any)}
              className={`border text-xs rounded-lg px-2 py-1 focus:outline-none ${
                isLight
                  ? 'bg-neutral-100 border-neutral-300 text-neutral-900'
                  : 'bg-neutral-900 border-neutral-800 text-white'
              }`}
              aria-label="Navigation View"
            >
              <option value="events">{t.browseEvents}</option>
              <option value="calendar">{t.calendarView}</option>
              <option value="my-tickets">My Tickets ({bookedCount})</option>
              <option value="organizer">{t.organizerPortal}</option>
              <option value="superadmin">{t.superAdmin}</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
