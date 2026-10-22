import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { EventItem } from '../data/mockData';

interface SocialShareModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({ event, isOpen, onClose }) => {
  if (!isOpen || !event) return null;

  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ticketpulse.lk';
  const shareText = `Check out "${event.title}" happening on ${event.date} at ${event.venueName}! Get your tickets with real-time seat reservation on TicketPulse.`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareLinkedIn = () => {
    const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(liUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Share Event</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
            aria-label="Close share dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <p className="text-xs text-neutral-300">
            Share <strong className="text-white">{event.title}</strong> with your community to boost visibility and invite friends.
          </p>

          {/* Social Platforms Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
            >
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleShareTwitter}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
            >
              <span>X (Twitter)</span>
            </button>

            <button
              onClick={handleShareFacebook}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-colors"
            >
              <span>Facebook</span>
            </button>

            <button
              onClick={handleShareLinkedIn}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600/10 hover:bg-sky-600/20 border border-sky-500/30 text-sky-300 text-xs font-semibold transition-colors"
            >
              <span>LinkedIn</span>
            </button>
          </div>

          {/* Direct Link Copier */}
          <div className="pt-2">
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
              Direct Event Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
