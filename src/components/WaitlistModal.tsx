import React, { useState } from 'react';
import {
  X,
  Clock,
  Mail,
  User,
  Phone,
  Ticket,
  CheckCircle,
  AlertCircle,
  Bell,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { EventItem } from '../data/mockData';
import { WaitlistEntry, getWaitlistQueuePosition } from '../utils/ticketing';
import { Language, translations } from '../utils/i18n';
import { AppTheme } from '../utils/theme';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  existingWaitlist: WaitlistEntry[];
  onJoinWaitlist: (entry: WaitlistEntry) => void;
  language: Language;
  theme?: AppTheme;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  isOpen,
  onClose,
  event,
  existingWaitlist,
  onJoinWaitlist,
  language,
  theme = 'bw-dark',
}) => {
  const t = translations[language];
  const isLight = theme === 'bw-light';

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [preferredTierId, setPreferredTierId] = useState(
    event.tiers[0]?.id || 'tier-gen'
  );
  const [ticketCount, setTicketCount] = useState<number>(2);

  const [submittedEntry, setSubmittedEntry] = useState<WaitlistEntry | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const queuePosition = getWaitlistQueuePosition(existingWaitlist, event.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!userEmail.trim() || !userEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    const selectedTier = event.tiers.find((t) => t.id === preferredTierId) || event.tiers[0];

    const newEntry: WaitlistEntry = {
      id: `wl-${Date.now()}`,
      eventId: event.id,
      eventTitle: event.title,
      organizerId: event.organizerId,
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      userPhone: userPhone.trim() || '+94 77 000 0000',
      preferredTierId: selectedTier.id,
      preferredTierName: selectedTier.name,
      ticketCount,
      status: 'waiting',
      position: queuePosition,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onJoinWaitlist(newEntry);
    setSubmittedEntry(newEntry);
    setErrorMsg('');
  };

  const modalBg = isLight
    ? 'bg-white border-neutral-300 text-neutral-900 shadow-2xl'
    : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-2xl';

  const inputBg = isLight
    ? 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-950'
    : 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-500 focus:border-neutral-400';

  const cardSubBg = isLight
    ? 'bg-neutral-100 border-neutral-200'
    : 'bg-neutral-950 border-neutral-800';

  const buttonClass = isLight
    ? 'bg-neutral-950 hover:bg-neutral-800 text-white'
    : theme === 'bw-dark'
    ? 'bg-white hover:bg-neutral-200 text-neutral-950'
    : 'bg-amber-500 hover:bg-amber-400 text-neutral-950';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className={`relative w-full max-w-lg rounded-2xl border p-6 md:p-8 space-y-6 ${modalBg}`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close waitlist modal"
          className="absolute top-5 right-5 p-1 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!submittedEntry ? (
          <>
            {/* Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-neutral-800 text-neutral-200 border border-neutral-700">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.soldOut} · {t.joinWaitlist}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Join Event Waitlist
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {event.title} is currently fully booked. Sign up below to get immediately notified if seats are released or ticket holds expire.
              </p>
            </div>

            {/* Queue Forecast Box */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${cardSubBg}`}>
              <div>
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">
                  Projected Queue Position
                </span>
                <span className="text-2xl font-extrabold font-mono tracking-tight text-white">
                  #{queuePosition} <span className="text-xs font-normal text-neutral-400">in priority line</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-neutral-400 block">
                  Claim Window
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3.5 h-3.5" /> 24 Hours
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Anura Wickramasinghe"
                    className={`w-full rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm border transition-colors outline-none ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="name@example.lk"
                      className={`w-full rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm border transition-colors outline-none ${inputBg}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Phone (SMS Alert)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      className={`w-full rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm border transition-colors outline-none ${inputBg}`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Preferred Ticket Tier
                  </label>
                  <select
                    value={preferredTierId}
                    onChange={(e) => setPreferredTierId(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs sm:text-sm border transition-colors outline-none ${inputBg}`}
                  >
                    {event.tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (LKR {t.priceLKR.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Number of Tickets
                  </label>
                  <select
                    value={ticketCount}
                    onChange={(e) => setTicketCount(Number(e.target.value))}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs sm:text-sm border transition-colors outline-none ${inputBg}`}
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} Ticket{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 leading-relaxed pt-1">
                By joining, you agree to receive an automated notification email with a secure Payments.lk reservation link if tickets become available.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-neutral-700 hover:border-neutral-500 text-xs text-neutral-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${buttonClass}`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Confirm Waitlist Registration</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Confirmation Success Screen */
          <div className="space-y-6 text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold">You are on the Priority Waitlist!</h3>
              <p className="text-xs text-neutral-400">
                Waitlist Reference: <span className="font-mono text-white font-bold">{submittedEntry.id}</span>
              </p>
            </div>

            {/* Ticket Card Summary */}
            <div className={`p-4 rounded-xl border text-left space-y-2.5 text-xs ${cardSubBg}`}>
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Event</span>
                <span className="font-bold text-white truncate max-w-[220px]">{event.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Queue Position</span>
                <span className="font-mono font-bold text-white text-sm">#{submittedEntry.position}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Attendee</span>
                <span className="font-medium text-white">{submittedEntry.userName} ({submittedEntry.userEmail})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Requested</span>
                <span className="font-medium text-white">
                  {submittedEntry.ticketCount}x {submittedEntry.preferredTierName}
                </span>
              </div>
            </div>

            {/* Email Confirmation Simulated Banner */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 text-left text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-mono">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulated Automated Dispatch</span>
              </div>
              <p className="text-neutral-300 text-[11px]">
                Confirmation email sent to <strong className="text-white">{submittedEntry.userEmail}</strong>. If an attendee cancels, you will receive an instant 24-hour private purchase window via Payments.lk.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${buttonClass}`}
            >
              Done & Return to Events
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
