import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Ticket,
  Tag,
  QrCode,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Lock,
  Layers,
  Bell,
  Mail,
  UserCheck,
  Send,
  Users,
} from 'lucide-react';
import { Organizer, EventItem, OrderItem } from '../data/mockData';
import { Coupon, TicketTier, Seat, WaitlistEntry } from '../utils/ticketing';
import { exportSalesReportPDF } from '../utils/pdfExport';
import { Language, translations } from '../utils/i18n';

interface OrganizerDashboardProps {
  currentOrganizer: Organizer;
  events: EventItem[];
  orders: OrderItem[];
  coupons: Coupon[];
  waitlist?: WaitlistEntry[];
  onAddEvent: (newEvent: EventItem) => void;
  onAddCoupon: (newCoupon: Coupon) => void;
  onCheckInOrder: (bookingRef: string) => { success: boolean; message: string; order?: OrderItem };
  onUpdateWaitlistStatus?: (id: string, status: 'waiting' | 'notified' | 'claimed' | 'cancelled') => void;
  language: Language;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  currentOrganizer,
  events,
  orders,
  coupons,
  waitlist = [],
  onAddEvent,
  onAddCoupon,
  onCheckInOrder,
  onUpdateWaitlistStatus = () => {},
  language,
}) => {
  const t = translations[language];

  // STRICT MULTI-TENANT ISOLATION
  // The organizer ONLY sees events and waitlists belonging to currentOrganizer.id!
  const myEvents = events.filter((e) => e.organizerId === currentOrganizer.id);
  const myOrders = orders.filter((o) => o.organizerId === currentOrganizer.id);
  const myCoupons = coupons.filter(
    (c) => c.organizerId === currentOrganizer.id || c.organizerId === 'all'
  );
  const myWaitlist = waitlist.filter((w) => w.organizerId === currentOrganizer.id);

  // Active view tab inside organizer portal
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'events' | 'coupons' | 'checkin' | 'waitlist'
  >('overview');

  // Waitlist management state
  const [waitlistEventFilter, setWaitlistEventFilter] = useState<string>('all');
  const [waitlistSearch, setWaitlistSearch] = useState<string>('');
  const [notifiedToast, setNotifiedToast] = useState<{
    name: string;
    email: string;
    tier: string;
  } | null>(null);

  // Modals
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);

  // Check-in search state
  const [checkInSearch, setCheckInSearch] = useState('');
  const [checkInAlert, setCheckInAlert] = useState<{ success: boolean; message: string } | null>(null);

  // Financial calculations for this organizer
  const myGrossSales = myOrders.reduce((sum, ord) => sum + ord.finalTotal, 0);
  const myGatewayFees = myOrders.reduce((sum, ord) => sum + ord.gatewayCommission, 0);
  const myNetPayout = myOrders.reduce((sum, ord) => sum + ord.organizerNetPayout, 0);
  const myTicketsSold = myOrders.reduce(
    (sum, ord) => sum + ord.ticketItems.reduce((acc, t) => acc + t.quantity, 0),
    0
  );

  // Create Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Music' | 'Technology' | 'Arts & Culture' | 'Sports' | 'Business'>('Music');
  const [newDate, setNewDate] = useState('2026-12-15');
  const [newTime, setNewTime] = useState('18:00');
  const [newVenue, setNewVenue] = useState('');
  const [newCity, setNewCity] = useState('Colombo');
  const [newDescription, setNewDescription] = useState('');
  const [tier1Name, setTier1Name] = useState('VIP Pass');
  const [tier1Price, setTier1Price] = useState(10000);
  const [tier1Cap, setTier1Cap] = useState(50);
  const [tier2Name, setTier2Name] = useState('General Admission');
  const [tier2Price, setTier2Price] = useState(3500);
  const [tier2Cap, setTier2Cap] = useState(150);

  // Create Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponVal, setNewCouponVal] = useState(15);
  const [newCouponMin, setNewCouponMin] = useState(3000);
  const [newCouponExpiry, setNewCouponExpiry] = useState('2026-12-31');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState(100);

  const handleExportPDF = () => {
    exportSalesReportPDF(
      `${currentOrganizer.company} - Organizer Sales Ledger`,
      `Tenant ID: ${currentOrganizer.id}`,
      {
        grossSales: myGrossSales,
        netPayout: myNetPayout,
        gatewayCommission: myGatewayFees,
        ticketsSold: myTicketsSold,
        ordersCount: myOrders.length,
      },
      myOrders
    );
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newVenue) return;

    const eventId = `ev-${Date.now()}`;

    // Generate seats
    const rows = ['A', 'B', 'C', 'D'];
    const seats: Seat[] = [];
    rows.forEach((row, rIdx) => {
      for (let num = 1; num <= 8; num++) {
        seats.push({
          id: `${eventId}-${row}${num}`,
          row,
          number: num,
          tierId: rIdx === 0 ? 'tier-vip' : 'tier-gen',
          status: 'available',
        });
      }
    });

    const newEvent: EventItem = {
      id: eventId,
      organizerId: currentOrganizer.id,
      title: newTitle,
      slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: newCategory,
      date: newDate,
      time: newTime,
      venueName: newVenue,
      address: `${newVenue}, ${newCity}`,
      city: newCity,
      description: newDescription || 'Exclusive event hosted by ' + currentOrganizer.company,
      bannerUrl: '/src/assets/images/hero_concert_stage_1792656910076.jpg',
      hasAssignedSeating: true,
      status: 'published',
      tiers: [
        {
          id: 'tier-vip',
          name: tier1Name,
          priceLKR: Number(tier1Price),
          available: Number(tier1Cap),
          total: Number(tier1Cap),
          perks: ['VIP Lounge access', 'Welcome drink', 'Priority entrance'],
          color: '#f59e0b',
        },
        {
          id: 'tier-gen',
          name: tier2Name,
          priceLKR: Number(tier2Price),
          available: Number(tier2Cap),
          total: Number(tier2Cap),
          perks: ['General area access', 'Food court zone entry'],
          color: '#10b981',
        },
      ],
      seats,
    };

    onAddEvent(newEvent);
    setShowCreateEventModal(false);
    setNewTitle('');
    setNewVenue('');
    setNewDescription('');
  };

  const handleCreateCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;

    const newCoupon: Coupon = {
      code: newCouponCode.trim().toUpperCase(),
      organizerId: currentOrganizer.id, // Strictly tied to this organizer!
      discountType: newCouponType,
      discountValue: Number(newCouponVal),
      minPurchaseLKR: Number(newCouponMin),
      expiryDate: newCouponExpiry,
      maxUses: Number(newCouponMaxUses),
      usedCount: 0,
      isActive: true,
    };

    onAddCoupon(newCoupon);
    setShowCreateCouponModal(false);
    setNewCouponCode('');
  };

  const handlePerformCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckInAlert(null);
    if (!checkInSearch.trim()) return;

    const res = onCheckInOrder(checkInSearch.trim());
    setCheckInAlert(res);
    if (res.success) {
      setCheckInSearch('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tenant Isolation Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                {currentOrganizer.company}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Isolated Organizer Tenant
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Representative: {currentOrganizer.name} · {currentOrganizer.email} · Payments.lk Rate: {currentOrganizer.commissionRate}%
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateEventModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Event</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-white text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Sales PDF</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-neutral-800 gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 flex items-center gap-1.5 transition-colors ${
            activeSubTab === 'overview'
              ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Sales & Analytics</span>
        </button>

        <button
          onClick={() => setActiveSubTab('events')}
          className={`pb-3 flex items-center gap-1.5 transition-colors ${
            activeSubTab === 'events'
              ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>My Events ({myEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('coupons')}
          className={`pb-3 flex items-center gap-1.5 transition-colors ${
            activeSubTab === 'coupons'
              ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Coupons & Redemption ({myCoupons.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('checkin')}
          className={`pb-3 flex items-center gap-1.5 transition-colors ${
            activeSubTab === 'checkin'
              ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Entrance Check-In Station</span>
        </button>

        <button
          onClick={() => setActiveSubTab('waitlist')}
          className={`pb-3 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSubTab === 'waitlist'
              ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Manage Waitlist ({myWaitlist.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Organizer KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-neutral-400">
                Gross Ticket Revenue
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                LKR {myGrossSales.toLocaleString()}
              </div>
              <p className="text-[11px] text-neutral-500">From {myOrders.length} ticket orders</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-amber-400">
                Payments.lk Gateway Commission
              </span>
              <div className="text-2xl font-bold font-mono text-amber-400">
                LKR {myGatewayFees.toLocaleString()}
              </div>
              <p className="text-[11px] text-neutral-500">2.6% + 30 LKR transparent processing</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400">
                Net Organizer Payout
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                LKR {myNetPayout.toLocaleString()}
              </div>
              <p className="text-[11px] text-neutral-500">Ready for automated bank disbursement</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-neutral-400">
                Total Attendees Booked
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                {myTicketsSold}
              </div>
              <p className="text-[11px] text-neutral-500">Across {myEvents.length} active events</p>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Recent Ticket Sales for {currentOrganizer.company}
              </h3>
              <span className="text-xs text-neutral-400 font-mono">
                {myOrders.length} transactions recorded
              </span>
            </div>

            {myOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No orders placed for your events yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 font-mono uppercase text-[10px] border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Booking Ref</th>
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Attendee</th>
                      <th className="py-3 px-4">Gross (LKR)</th>
                      <th className="py-3 px-4">Payments.lk Fee</th>
                      <th className="py-3 px-4">Net Payout</th>
                      <th className="py-3 px-4">Gate Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                    {myOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-neutral-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {ord.bookingRef}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">{ord.eventTitle}</td>
                        <td className="py-3 px-4">
                          <div>{ord.customerName}</div>
                          <div className="text-[11px] text-neutral-500">{ord.customerEmail}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          LKR {ord.finalTotal.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-amber-400">
                          -LKR {ord.gatewayCommission.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                          LKR {ord.organizerNetPayout.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                              ord.checkInStatus === 'checked_in'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {ord.checkInStatus === 'checked_in' ? 'Checked In' : 'Not Checked In'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY EVENTS */}
      {activeSubTab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-neutral-400">
              Only you ({currentOrganizer.company}) can access or modify these events.
            </p>
            <button
              onClick={() => setShowCreateEventModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEvents.map((evt) => {
              const evtOrders = myOrders.filter((o) => o.eventId === evt.id);
              const soldSeats = evt.seats.filter((s) => s.status === 'sold').length;
              const totalSeats = evt.seats.length;
              const occupancy = totalSeats > 0 ? Math.round((soldSeats / totalSeats) * 100) : 0;

              return (
                <div
                  key={evt.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-amber-400">
                          {evt.category}
                        </span>
                        <h4 className="text-base font-bold text-white">{evt.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {evt.status}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-400 space-y-1">
                      <p>Date: <strong className="text-neutral-200">{evt.date} at {evt.time}</strong></p>
                      <p>Venue: <strong className="text-neutral-200">{evt.venueName}</strong></p>
                    </div>

                    {/* Seat Occupancy Progress */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-400">Seat Occupancy:</span>
                        <span className="font-mono text-white">
                          {soldSeats} / {totalSeats} seats ({occupancy}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${occupancy}%` }}
                          className="h-full bg-amber-500 rounded-full"
                        ></div>
                      </div>
                    </div>

                    {/* Ticket Tiers */}
                    <div className="pt-2 border-t border-neutral-800 text-xs space-y-1">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase">TIERS CONFIGURED:</span>
                      <div className="flex flex-wrap gap-2">
                        {evt.tiers.map((t) => (
                          <span
                            key={t.id}
                            className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-300 font-mono"
                          >
                            {t.name}: <strong>LKR {t.priceLKR.toLocaleString()}</strong> ({t.available} left)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: COUPONS & REDEMPTION TRACKER */}
      {activeSubTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white">Promotional Coupon Codes</h3>
              <p className="text-xs text-neutral-400">
                Create custom discounts and track redemption stats in real-time.
              </p>
            </div>
            <button
              onClick={() => setShowCreateCouponModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 font-mono uppercase text-[10px] border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Min Spend</th>
                    <th className="py-3 px-4">Redemption Count</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                  {myCoupons.map((c) => {
                    const usagePercent = Math.round((c.usedCount / c.maxUses) * 100);

                    return (
                      <tr key={c.code} className="hover:bg-neutral-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          {c.code}
                        </td>
                        <td className="py-3 px-4">
                          {c.discountType === 'percentage'
                            ? `${c.discountValue}% OFF`
                            : `LKR ${c.discountValue.toLocaleString()} OFF`}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          LKR {c.minPurchaseLKR.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white">
                              {c.usedCount} / {c.maxUses} ({usagePercent}%)
                            </span>
                            <div className="w-16 h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${usagePercent}%` }}
                                className="h-full bg-emerald-500 rounded-full"
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-400">
                          {c.expiryDate}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ENTRANCE CHECK-IN STATION */}
      {activeSubTab === 'checkin' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-400" />
              Event Entrance Gate Verification Station
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Verify attendee tickets by scanning digital QR passes or typing the booking reference (e.g.{' '}
              <span className="font-mono text-amber-300">PLK-98124-COL</span>).
            </p>
          </div>

          <form onSubmit={handlePerformCheckIn} className="flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type="text"
                value={checkInSearch}
                onChange={(e) => setCheckInSearch(e.target.value)}
                placeholder="Scan or enter Booking Ref (e.g. PLK-98124-COL)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shrink-0"
            >
              Verify Pass
            </button>
          </form>

          {checkInAlert && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 max-w-lg text-xs ${
                checkInAlert.success
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}
            >
              {checkInAlert.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <div>
                <p className="font-bold">{checkInAlert.message}</p>
                {checkInAlert.success && (
                  <p className="text-[11px] text-emerald-300 mt-1">
                    Entry approved. Attendee verified in system.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Attendees List */}
          <div className="pt-4 border-t border-neutral-800">
            <h4 className="text-xs font-mono uppercase text-neutral-400 mb-3">
              Registered Attendees for Entrance Verification
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Booking Ref</th>
                    <th className="py-2 px-3">Attendee Name</th>
                    <th className="py-2 px-3">Seats</th>
                    <th className="py-2 px-3">Event</th>
                    <th className="py-2 px-3">Gate Status</th>
                    <th className="py-2 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                  {myOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-800/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        {ord.bookingRef}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-white">{ord.customerName}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-amber-400">
                        {ord.seats.length > 0 ? ord.seats.map(s => `${s.row}${s.number}`).join(', ') : 'General'}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate">{ord.eventTitle}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            ord.checkInStatus === 'checked_in'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {ord.checkInStatus === 'checked_in' ? 'Checked In' : 'Pending Gate Entry'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {ord.checkInStatus !== 'checked_in' ? (
                          <button
                            onClick={() => {
                              const res = onCheckInOrder(ord.bookingRef);
                              setCheckInAlert(res);
                            }}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px]"
                          >
                            Check In
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-mono">
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MANAGE WAITLIST */}
      {activeSubTab === 'waitlist' && (
        <div className="space-y-6">
          {/* Tenant Isolation Header Badge */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-neutral-300">
                <strong>Tenant Privacy Shield:</strong> Showing waitlist entries exclusively for{' '}
                <span className="text-white font-semibold">{currentOrganizer.company}</span> ({currentOrganizer.id}).
              </span>
            </div>
            <span className="px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-400">
              Total Demand: {myWaitlist.reduce((sum, w) => sum + w.ticketCount, 0)} Tickets
            </span>
          </div>

          {/* Notified Toast / Automated Email Alert Confirmation Banner */}
          {notifiedToast && (
            <div className="p-4 rounded-xl border border-emerald-500/50 bg-emerald-950/40 text-emerald-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Automated Notification Email Dispatched:</span>{' '}
                  Sent priority purchase invitation to{' '}
                  <strong className="text-white">{notifiedToast.name}</strong> ({notifiedToast.email}) for{' '}
                  <strong className="text-white">{notifiedToast.tier}</strong>. 24-hour hold activated.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifiedToast(null)}
                className="text-emerald-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded border border-emerald-500/30 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Waitlist KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-neutral-400">Total in Queue</span>
              <div className="text-2xl font-bold font-mono text-white">{myWaitlist.length}</div>
              <p className="text-[11px] text-neutral-500">Across {myEvents.length} events</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-amber-400">Waiting for Release</span>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {myWaitlist.filter((w) => w.status === 'waiting').length}
              </div>
              <p className="text-[11px] text-neutral-500">Pending ticket availability</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-blue-400">Notified (24h Window)</span>
              <div className="text-2xl font-bold font-mono text-blue-400">
                {myWaitlist.filter((w) => w.status === 'notified').length}
              </div>
              <p className="text-[11px] text-neutral-500">Invitation sent, holding seats</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400">Admitted / Claimed</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {myWaitlist.filter((w) => w.status === 'claimed').length}
              </div>
              <p className="text-[11px] text-neutral-500">Converted to ticket holders</p>
            </div>
          </div>

          {/* Filter Bar & Controls */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
              {/* Event Filter */}
              <div className="w-full sm:w-60">
                <select
                  value={waitlistEventFilter}
                  onChange={(e) => setWaitlistEventFilter(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All My Events ({myWaitlist.length})</option>
                  {myEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  value={waitlistSearch}
                  onChange={(e) => setWaitlistSearch(e.target.value)}
                  placeholder="Search attendee, email, phone..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Quick Action: Notify Next In Line */}
            {myWaitlist.some((w) => w.status === 'waiting') && (
              <button
                type="button"
                onClick={() => {
                  const nextEntry = myWaitlist.find((w) => w.status === 'waiting');
                  if (nextEntry) {
                    onUpdateWaitlistStatus(nextEntry.id, 'notified');
                    setNotifiedToast({
                      name: nextEntry.userName,
                      email: nextEntry.userEmail,
                      tier: nextEntry.preferredTierName,
                    });
                  }
                }}
                className="w-full md:w-auto px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Notify Next in Queue</span>
              </button>
            )}
          </div>

          {/* Waitlist Queue Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase text-neutral-400">
                Waitlist Priority Queue ({myWaitlist.filter((w) => {
                  if (waitlistEventFilter !== 'all' && w.eventId !== waitlistEventFilter) return false;
                  if (waitlistSearch.trim()) {
                    const q = waitlistSearch.toLowerCase();
                    return (
                      w.userName.toLowerCase().includes(q) ||
                      w.userEmail.toLowerCase().includes(q) ||
                      w.userPhone.toLowerCase().includes(q)
                    );
                  }
                  return true;
                }).length} entries)
              </h3>
              <span className="text-[11px] text-neutral-500 font-mono">
                Auto-sorts by registration timestamp
              </span>
            </div>

            {myWaitlist.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Clock className="w-8 h-8 mx-auto text-neutral-600" />
                <p className="text-sm font-medium text-neutral-300">No Waitlist Registrations Yet</p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  When one of your events reaches 100% capacity, attendees can register their interest to be prioritized when tickets are released.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Queue #</th>
                      <th className="py-2.5 px-3">Attendee</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">Event</th>
                      <th className="py-2.5 px-3">Requested</th>
                      <th className="py-2.5 px-3">Registered</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                    {myWaitlist
                      .filter((w) => {
                        if (waitlistEventFilter !== 'all' && w.eventId !== waitlistEventFilter) return false;
                        if (waitlistSearch.trim()) {
                          const q = waitlistSearch.toLowerCase();
                          return (
                            w.userName.toLowerCase().includes(q) ||
                            w.userEmail.toLowerCase().includes(q) ||
                            w.userPhone.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((entry) => (
                        <tr key={entry.id} className="hover:bg-neutral-800/30">
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                              #{entry.position}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-white block">{entry.userName}</span>
                            <span className="text-[11px] text-neutral-500 font-mono">{entry.id}</span>
                          </td>
                          <td className="py-3 px-3 text-[11px]">
                            <div className="text-neutral-300">{entry.userEmail}</div>
                            <div className="text-neutral-500 font-mono">{entry.userPhone}</div>
                          </td>
                          <td className="py-3 px-3 max-w-[180px] truncate">
                            <span className="font-medium text-white block truncate">{entry.eventTitle}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-amber-400 font-bold">
                              {entry.ticketCount}x
                            </span>{' '}
                            <span className="text-neutral-300">{entry.preferredTierName}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-neutral-400">
                            {entry.createdAt}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                                entry.status === 'claimed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : entry.status === 'notified'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                  : entry.status === 'cancelled'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {entry.status === 'claimed'
                                ? 'Claimed'
                                : entry.status === 'notified'
                                ? 'Notified (24h)'
                                : entry.status === 'cancelled'
                                ? 'Cancelled'
                                : 'Waiting'}
                            </span>
                            {entry.notifiedAt && (
                              <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                                Sent: {entry.notifiedAt}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {entry.status === 'waiting' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateWaitlistStatus(entry.id, 'notified');
                                    setNotifiedToast({
                                      name: entry.userName,
                                      email: entry.userEmail,
                                      tier: entry.preferredTierName,
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Mail className="w-3 h-3" />
                                  <span>Notify</span>
                                </button>
                              )}

                              {entry.status === 'notified' && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateWaitlistStatus(entry.id, 'claimed')}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Admit</span>
                                </button>
                              )}

                              {entry.status !== 'cancelled' && entry.status !== 'claimed' && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateWaitlistStatus(entry.id, 'cancelled')}
                                  className="px-2 py-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20 text-[11px] transition-colors cursor-pointer"
                                  title="Cancel Registration"
                                >
                                  Cancel
                                </button>
                              )}

                              {entry.status === 'claimed' && (
                                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Admitted
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Event */}
      {showCreateEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-base font-bold text-white mb-1">
              Create New Event
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Configured strictly under tenant: <strong className="text-white">{currentOrganizer.company}</strong>
            </p>

            <form onSubmit={handleCreateEventSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Ceylon Electronic Symphony 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Music">Music</option>
                    <option value="Technology">Technology</option>
                    <option value="Arts & Culture">Arts & Culture</option>
                    <option value="Sports">Sports</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Galle Face Green Auditorium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Provide details about the schedule, artists, and guidelines..."
                />
              </div>

              {/* Multiple Ticket Tiers */}
              <div className="pt-2 border-t border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-white block">
                  Configure Multiple Ticket Tiers
                </span>

                <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Tier 1 Name</label>
                    <input
                      type="text"
                      value={tier1Name}
                      onChange={(e) => setTier1Name(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Price (LKR)</label>
                    <input
                      type="number"
                      value={tier1Price}
                      onChange={(e) => setTier1Price(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Capacity</label>
                    <input
                      type="number"
                      value={tier1Cap}
                      onChange={(e) => setTier1Cap(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Tier 2 Name</label>
                    <input
                      type="text"
                      value={tier2Name}
                      onChange={(e) => setTier2Name(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Price (LKR)</label>
                    <input
                      type="number"
                      value={tier2Price}
                      onChange={(e) => setTier2Price(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Capacity</label>
                    <input
                      type="number"
                      value={tier2Cap}
                      onChange={(e) => setTier2Cap(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Coupon */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Add Promotional Coupon
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Restricted to tickets booked for <strong className="text-white">{currentOrganizer.company}</strong>.
            </p>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                  placeholder="e.g. SPECIAL20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (LKR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    required
                    value={newCouponVal}
                    onChange={(e) => setNewCouponVal(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Minimum Order (LKR)
                  </label>
                  <input
                    type="number"
                    value={newCouponMin}
                    onChange={(e) => setNewCouponMin(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    value={newCouponMaxUses}
                    onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateCouponModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
