import React, { useState } from 'react';
import { Ticket, Calendar, MapPin, Download, QrCode, CheckCircle2 } from 'lucide-react';
import { OrderItem } from '../data/mockData';
import { exportSingleTicketPDF } from '../utils/pdfExport';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { Language, translations } from '../utils/i18n';

interface MyTicketsViewProps {
  orders: OrderItem[];
  language: Language;
}

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({ orders, language }) => {
  const t = translations[language];
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">My Confirmed Tickets & Passes</h2>
            <p className="text-xs text-neutral-400">
              Access your digital entrance QR passes, seats, and Payments.lk receipts.
            </p>
          </div>
        </div>

        <span className="font-mono text-xs text-amber-400 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg">
          {orders.length} Active Booking{orders.length !== 1 ? 's' : ''}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center space-y-3">
          <Ticket className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No tickets booked yet</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Browse our upcoming concerts, summits, and sporting tournaments to reserve your seats.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((ord) => {
            const seatsStr =
              ord.seats.length > 0
                ? ord.seats.map((s) => `${s.row}${s.number}`).join(', ')
                : 'General / Unassigned';

            const totalTickets = ord.ticketItems.reduce((acc, t) => acc + t.quantity, 0);

            return (
              <div
                key={ord.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                        REF: {ord.bookingRef}
                      </span>
                      <h3 className="text-base font-bold text-white line-clamp-1">
                        {ord.eventTitle}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        ord.checkInStatus === 'checked_in'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ord.checkInStatus === 'checked_in' ? 'Verified / Checked In' : 'Valid Entrance Pass'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 pt-1">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase block">Event Date</span>
                      <span className="font-medium text-white">{ord.eventDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase block">Attendee</span>
                      <span className="font-medium text-white">{ord.customerName}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase block">Reserved Seats</span>
                      <span className="font-mono text-amber-400 font-bold">{seatsStr}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase block">Total Amount</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        LKR {ord.finalTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedOrder(ord)}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR & E-Ticket</span>
                  </button>

                  <button
                    onClick={() => exportSingleTicketPDF(ord, '')}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <OrderConfirmationModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onViewMyTickets={() => setSelectedOrder(null)}
          language={language}
        />
      )}
    </div>
  );
};
