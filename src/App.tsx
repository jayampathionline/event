/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { EventDiscoveryView } from './components/EventDiscoveryView';
import { EventDetailsView } from './components/EventDetailsView';
import { CalendarView } from './components/CalendarView';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { MyTicketsView } from './components/MyTicketsView';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';

import {
  initialEvents,
  initialOrganizers,
  initialCoupons,
  initialOrders,
  EventItem,
  Organizer,
  OrderItem,
} from './data/mockData';
import { Coupon, Seat } from './utils/ticketing';
import { Language, translations } from './utils/i18n';
import { AppTheme } from './utils/theme';
import { ShieldCheck, Heart, Sparkles, Globe } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ticketpulse_theme') as AppTheme;
      if (saved && ['bw-dark', 'bw-light', 'classic'].includes(saved)) {
        return saved;
      }
    }
    return 'bw-dark'; // Default to Black and White Noir
  });

  // Apply theme to document root
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-bw-dark', 'theme-bw-light', 'theme-classic');
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('ticketpulse_theme', theme);
  }, [theme]);

  const isLight = theme === 'bw-light';
  const isBW = theme === 'bw-dark' || theme === 'bw-light';

  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  // Core Application Data State
  const [organizers, setOrganizers] = useState<Organizer[]>(initialOrganizers);
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<
    'events' | 'calendar' | 'my-tickets' | 'organizer' | 'superadmin'
  >('events');

  // Currently viewed event in EventDetails
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Currently logged-in organizer for the organizer tenant view
  const [currentOrganizerId, setCurrentOrganizerId] = useState<string>('org-1');

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutEvent, setCheckoutEvent] = useState<EventItem | null>(null);
  const [checkoutSelectedSeats, setCheckoutSelectedSeats] = useState<
    { row: string; number: number; tierId: string; id: string }[]
  >([]);
  const [checkoutTicketQuantities, setCheckoutTicketQuantities] = useState<{
    [tierId: string]: number;
  }>({});

  // Confirmation modal state
  const [confirmedOrder, setConfirmedOrder] = useState<OrderItem | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // Handlers
  const handleSelectEvent = (event: EventItem) => {
    setSelectedEventId(event.id);
  };

  const handleBackToEvents = () => {
    setSelectedEventId(null);
  };

  const handleProceedToCheckout = (
    selectedSeats: { row: string; number: number; tierId: string; id: string }[],
    quantities: { [tierId: string]: number }
  ) => {
    const currentEvent = events.find((e) => e.id === selectedEventId);
    if (!currentEvent) return;

    setCheckoutEvent(currentEvent);
    setCheckoutSelectedSeats(selectedSeats);
    setCheckoutTicketQuantities(quantities);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (newOrder: OrderItem) => {
    // 1. Add order to order ledger
    setOrders((prev) => [newOrder, ...prev]);

    // 2. Mark seats as sold in the corresponding event
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === newOrder.eventId) {
          const updatedSeats = e.seats.map((seat) => {
            const isJustBooked = newOrder.seats.some(
              (s) => s.row === seat.row && s.number === seat.number
            );
            if (isJustBooked) {
              return { ...seat, status: 'sold' as const, bookedBy: newOrder.customerName };
            }
            return seat;
          });

          // Decrement tier availability
          const updatedTiers = e.tiers.map((tier) => {
            const purchasedTier = newOrder.ticketItems.find((ti) => ti.tierId === tier.id);
            if (purchasedTier) {
              return {
                ...tier,
                available: Math.max(0, tier.available - purchasedTier.quantity),
              };
            }
            return tier;
          });

          return { ...e, seats: updatedSeats, tiers: updatedTiers };
        }
        return e;
      })
    );

    // 3. Increment coupon usage if used
    if (newOrder.couponCode) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.code.toUpperCase() === newOrder.couponCode?.toUpperCase()
            ? { ...c, usedCount: c.usedCount + 1 }
            : c
        )
      );
    }

    // 4. Close checkout, open confirmation modal
    setIsCheckoutOpen(false);
    setConfirmedOrder(newOrder);
    setIsConfirmationOpen(true);
  };

  const handleAddOrganizer = (newOrg: Omit<Organizer, 'id' | 'createdAt'>) => {
    const orgId = `org-${organizers.length + 1}`;
    const fullOrg: Organizer = {
      ...newOrg,
      id: orgId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setOrganizers((prev) => [...prev, fullOrg]);
  };

  const handleAddEvent = (newEvent: EventItem) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleAddCoupon = (newCoupon: Coupon) => {
    setCoupons((prev) => [newCoupon, ...prev]);
  };

  const handleCheckInOrder = (bookingRef: string) => {
    const cleaned = bookingRef.trim().toUpperCase();
    const orderIndex = orders.findIndex((o) => o.bookingRef.toUpperCase() === cleaned);

    if (orderIndex === -1) {
      return { success: false, message: `Booking Reference "${cleaned}" not found in system.` };
    }

    const order = orders[orderIndex];

    if (order.checkInStatus === 'checked_in') {
      return {
        success: false,
        message: `Ticket "${order.bookingRef}" has ALREADY been checked in at ${order.checkInTimestamp || 'entrance gate'}. Duplicate entry rejected!`,
        order,
      };
    }

    // Mark as checked in
    const updatedOrder: OrderItem = {
      ...order,
      checkInStatus: 'checked_in',
      checkInTimestamp: new Date().toLocaleTimeString(),
    };

    setOrders((prev) => {
      const copy = [...prev];
      copy[orderIndex] = updatedOrder;
      return copy;
    });

    return {
      success: true,
      message: `Verified! Welcome ${order.customerName} (${order.eventTitle} - Seats: ${
        order.seats.length > 0 ? order.seats.map((s) => `${s.row}${s.number}`).join(', ') : 'General'
      }).`,
      order: updatedOrder,
    };
  };

  const currentOrganizer =
    organizers.find((o) => o.id === currentOrganizerId) || organizers[0];

  const selectedEvent = selectedEventId
    ? events.find((e) => e.id === selectedEventId) || null
    : null;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isLight ? 'bg-neutral-50 text-neutral-900' : 'bg-neutral-950 text-neutral-100'
      }`}
    >
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setSelectedEventId(null); // Reset single event view on tab click
        }}
        language={language}
        setLanguage={setLanguage}
        organizers={organizers}
        currentOrganizerId={currentOrganizerId}
        setCurrentOrganizerId={setCurrentOrganizerId}
        bookedCount={orders.length}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'events' && (
          <>
            {selectedEvent ? (
              <EventDetailsView
                event={selectedEvent}
                organizer={
                  organizers.find((o) => o.id === selectedEvent.organizerId) || organizers[0]
                }
                onBack={handleBackToEvents}
                onProceedToCheckout={handleProceedToCheckout}
                language={language}
                theme={theme}
              />
            ) : (
              <EventDiscoveryView
                events={events}
                organizers={organizers}
                onSelectEvent={handleSelectEvent}
                language={language}
                theme={theme}
              />
            )}
          </>
        )}

        {currentTab === 'calendar' && (
          <CalendarView
            events={events}
            onSelectEvent={(evt) => {
              setSelectedEventId(evt.id);
              setCurrentTab('events');
            }}
            language={language}
          />
        )}

        {currentTab === 'my-tickets' && (
          <MyTicketsView orders={orders} language={language} />
        )}

        {currentTab === 'organizer' && (
          <OrganizerDashboard
            currentOrganizer={currentOrganizer}
            events={events}
            orders={orders}
            coupons={coupons}
            onAddEvent={handleAddEvent}
            onAddCoupon={handleAddCoupon}
            onCheckInOrder={handleCheckInOrder}
            language={language}
          />
        )}

        {currentTab === 'superadmin' && (
          <SuperAdminDashboard
            organizers={organizers}
            onAddOrganizer={handleAddOrganizer}
            events={events}
            orders={orders}
            language={language}
          />
        )}
      </main>

      {/* Checkout Modal */}
      {isCheckoutOpen && checkoutEvent && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          event={checkoutEvent}
          selectedSeats={checkoutSelectedSeats}
          ticketQuantities={checkoutTicketQuantities}
          coupons={coupons}
          onOrderSuccess={handleOrderSuccess}
          language={language}
        />
      )}

      {/* Order Confirmation Modal */}
      {isConfirmationOpen && confirmedOrder && (
        <OrderConfirmationModal
          order={confirmedOrder}
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          onViewMyTickets={() => {
            setCurrentTab('my-tickets');
            setSelectedEventId(null);
          }}
          language={language}
        />
      )}

      {/* Production Footer (Clean, quiet, compliant with Frontend Design rules) */}
      <footer
        className={`border-t py-8 text-xs transition-colors ${
          isLight
            ? 'border-neutral-300 bg-white text-neutral-600'
            : 'border-neutral-800/80 bg-neutral-950 text-neutral-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isLight ? 'text-neutral-950' : 'text-neutral-300'}`}>
              TicketPulse
            </span>
            <span>·</span>
            <span>Payments.lk Certified Gateway</span>
            <span>·</span>
            <span className="font-mono text-[11px]">2.6% + 30 LKR transparent commission</span>
            <span>·</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-neutral-500/30">
              {isBW ? (isLight ? 'B&W Paper Edition' : 'B&W Noir Edition') : 'Classic Edition'}
            </span>
          </div>

          <div className={`flex items-center gap-4 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
            <span className="hover:underline transition-colors cursor-pointer">Security Policy</span>
            <span className="hover:underline transition-colors cursor-pointer">Organizer Terms</span>
            <span className="hover:underline transition-colors cursor-pointer">API Integration</span>
            <span>© 2026 TicketPulse Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
