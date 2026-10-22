import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Download, Calendar, Mail, ArrowRight, Ticket, Share2 } from 'lucide-react';
import { OrderItem } from '../data/mockData';
import { exportSingleTicketPDF } from '../utils/pdfExport';
import { Language, translations } from '../utils/i18n';

interface OrderConfirmationModalProps {
  order: OrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onViewMyTickets: () => void;
  language: Language;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  isOpen,
  onClose,
  onViewMyTickets,
  language,
}) => {
  if (!isOpen || !order) return null;

  const t = translations[language];
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [emailSentAlert, setEmailSentAlert] = useState(true);

  useEffect(() => {
    if (order) {
      const qrPayload = JSON.stringify({
        ref: order.bookingRef,
        event: order.eventTitle,
        attendee: order.customerName,
        seats: order.seats.map(s => `${s.row}${s.number}`),
        tix: order.ticketItems.reduce((acc, t) => acc + t.quantity, 0),
        status: 'VALID_ENTRANCE_PASS',
        issued: order.createdAt,
      });

      QRCode.toDataURL(qrPayload, {
        width: 240,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [order]);

  const handleDownloadPDF = () => {
    exportSingleTicketPDF(order, qrDataUrl);
  };

  const handleAddToCalendar = () => {
    // Generate clean ICS calendar event file
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TicketPulse//Events//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${order.eventTitle}`,
      `DESCRIPTION:Your TicketPulse e-Ticket Booking Ref: ${order.bookingRef}`,
      `LOCATION:Sri Lanka`,
      `DTSTART:${order.eventDate.replace(/-/g, '')}T180000Z`,
      `DTEND:${order.eventDate.replace(/-/g, '')}T220000Z`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${order.eventTitle.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSeats = order.seats.length > 0
    ? order.seats.map(s => `${s.row}${s.number}`).join(', ')
    : 'General Admission / Unassigned';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Top Success Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight">
              {t.confirmationTitle}
            </h3>
            <p className="text-xs text-emerald-100 font-mono mt-0.5">
              Booking Ref: {order.bookingRef} · Payments.lk Approved
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Automated Email notification callout */}
          {emailSentAlert && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 flex items-start gap-3">
              <Mail className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-emerald-300">
                  Automated Email Confirmation Sent!
                </p>
                <p className="text-neutral-400 mt-0.5">
                  An electronic pass with receipt and QR check-in voucher was dispatched to{' '}
                  <strong className="text-white font-mono">{order.customerEmail}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Ticket Card with QR Code */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for Ticket ${order.bookingRef}`}
                  className="w-36 h-36"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-neutral-400 text-xs font-mono">
                  Generating QR...
                </div>
              )}
              <div className="text-[10px] text-center font-mono text-neutral-800 mt-1 font-semibold">
                SCAN AT ENTRANCE
              </div>
            </div>

            <div className="flex-1 space-y-2 text-xs w-full">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400">EVENT</span>
                <h4 className="text-sm font-bold text-white line-clamp-2">
                  {order.eventTitle}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-neutral-300 pt-1">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">ATTENDEE</span>
                  <span className="font-medium text-white">{order.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">DATE</span>
                  <span className="font-medium text-white">{order.eventDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-neutral-300 pt-1">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">ASSIGNED SEATS</span>
                  <span className="font-mono font-semibold text-amber-400">{totalSeats}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">TOTAL PAID</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    LKR {order.finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-neutral-400">
                Gate Status:{' '}
                <span className="text-emerald-400 font-semibold uppercase">
                  {order.checkInStatus === 'checked_in' ? 'Checked In' : 'Active Pass (Ready for entrance)'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{t.downloadPdfTicket}</span>
            </button>

            <button
              onClick={handleAddToCalendar}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{t.addToCalendar} (.ics)</span>
            </button>
          </div>

          {/* Bottom dismiss & view my tickets */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800 text-xs">
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Close Window
            </button>

            <button
              onClick={() => {
                onClose();
                onViewMyTickets();
              }}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium"
            >
              <span>View in My Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
