import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Users,
  Building,
  RefreshCw,
  SlidersHorizontal,
  Download,
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';
import { Organizer, EventItem, OrderItem } from '../data/mockData';
import { exportSalesReportPDF } from '../utils/pdfExport';
import { Language, translations } from '../utils/i18n';

interface SuperAdminDashboardProps {
  organizers: Organizer[];
  onAddOrganizer: (newOrg: Omit<Organizer, 'id' | 'createdAt'>) => void;
  events: EventItem[];
  orders: OrderItem[];
  language: Language;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  organizers,
  onAddOrganizer,
  events,
  orders,
  language,
}) => {
  const t = translations[language];

  // 60-Second Auto-refresh timer
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date().toLocaleTimeString());

  // Date range filter
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days' | 'thisMonth'>('all');

  // Customization tools: Toggle specific metrics visibility
  const [visibleMetrics, setVisibleMetrics] = useState({
    grossSales: true,
    netPayout: true,
    gatewayCommission: true,
    ticketsSold: true,
    avgOrderValue: true,
    occupancyRate: true,
  });

  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);

  // New Organizer form
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCompany, setNewOrgCompany] = useState('');
  const [newOrgEmail, setNewOrgEmail] = useState('');
  const [newOrgPhone, setNewOrgPhone] = useState('');
  const [newOrgCommission, setNewOrgCommission] = useState(2.6);

  // 60-second timer countdown
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Trigger simulated refresh
          setLastRefreshedAt(new Date().toLocaleTimeString());
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled]);

  const handleManualRefresh = () => {
    setSecondsRemaining(60);
    setLastRefreshedAt(new Date().toLocaleTimeString());
  };

  // Filter orders by date range
  const filteredOrders = orders.filter((order) => {
    if (dateFilter === 'all') return true;
    const orderDate = new Date(order.createdAt);
    const now = new Date('2026-10-22T01:14:00'); // current mock time

    if (dateFilter === 'today') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (dateFilter === '7days') {
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (dateFilter === '30days') {
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }
    if (dateFilter === 'thisMonth') {
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Aggregations
  const totalGrossSales = filteredOrders.reduce((sum, ord) => sum + ord.finalTotal, 0);
  const totalGatewayCommission = filteredOrders.reduce((sum, ord) => sum + ord.gatewayCommission, 0);
  const totalNetPayout = filteredOrders.reduce((sum, ord) => sum + ord.organizerNetPayout, 0);
  const totalTicketsSold = filteredOrders.reduce(
    (sum, ord) => sum + ord.ticketItems.reduce((acc, t) => acc + t.quantity, 0),
    0
  );
  const avgOrderValue = filteredOrders.length > 0 ? Math.round(totalGrossSales / filteredOrders.length) : 0;

  // Total capacity and booked seats
  const totalSeatsAcrossPlatform = events.reduce((sum, e) => sum + e.seats.length, 0);
  const bookedSeatsAcrossPlatform = events.reduce(
    (sum, e) => sum + e.seats.filter((s) => s.status === 'sold').length,
    0
  );
  const occupancyRate =
    totalSeatsAcrossPlatform > 0
      ? Math.round((bookedSeatsAcrossPlatform / totalSeatsAcrossPlatform) * 100)
      : 0;

  // Chart data: by event
  const eventBreakdowns = events.map((evt) => {
    const eventOrders = filteredOrders.filter((o) => o.eventId === evt.id);
    const gross = eventOrders.reduce((s, o) => s + o.finalTotal, 0);
    const commission = eventOrders.reduce((s, o) => s + o.gatewayCommission, 0);
    const net = eventOrders.reduce((s, o) => s + o.organizerNetPayout, 0);
    const tickets = eventOrders.reduce(
      (s, o) => s + o.ticketItems.reduce((acc, t) => acc + t.quantity, 0),
      0
    );

    return {
      eventId: evt.id,
      title: evt.title,
      gross,
      commission,
      net,
      tickets,
    };
  });

  const maxGross = Math.max(...eventBreakdowns.map((b) => b.gross), 10000);

  const handleExportPDF = () => {
    exportSalesReportPDF(
      'Super Admin Platform Master Ledger',
      `Date Range: ${dateFilter.toUpperCase()}`,
      {
        grossSales: totalGrossSales,
        netPayout: totalNetPayout,
        gatewayCommission: totalGatewayCommission,
        ticketsSold: totalTicketsSold,
        ordersCount: filteredOrders.length,
      },
      filteredOrders
    );
  };

  const handleCreateOrganizerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgCompany || !newOrgEmail) return;

    onAddOrganizer({
      name: newOrgName,
      company: newOrgCompany,
      email: newOrgEmail,
      phone: newOrgPhone || '+94 77 000 0000',
      commissionRate: Number(newOrgCommission) || 2.6,
      status: 'active',
    });

    setNewOrgName('');
    setNewOrgCompany('');
    setNewOrgEmail('');
    setNewOrgPhone('');
    setShowAddOrgModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with 60s Auto-refresh, Customizer, and PDF Export */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Super Admin Financial Command & Analytics
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE PRODUCTION
              </span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
              <span>Last synced: <strong className="text-neutral-200 font-mono">{lastRefreshedAt}</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isAutoRefreshEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                Auto-refreshes in <strong className="text-amber-400 font-mono">{secondsRemaining}s</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Auto-Refresh */}
          <button
            onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              isAutoRefreshEnabled
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/40'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800'
            }`}
          >
            {isAutoRefreshEnabled ? '60s Auto-Sync: ON' : 'Auto-Sync: PAUSED'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Refresh now"
            aria-label="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Metric Customizer Modal Trigger */}
          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Customize</span>
          </button>

          {/* Export PDF Report */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Metric Customization Drawer / Panel */}
      {showCustomizer && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-800">
            <span className="font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              Toggle Screen Metric Cards
            </span>
            <button
              onClick={() => setShowCustomizer(false)}
              className="text-neutral-400 hover:text-white text-[11px]"
            >
              Done
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(visibleMetrics).map(([key, isVis]) => (
              <button
                key={key}
                onClick={() =>
                  setVisibleMetrics((prev) => ({
                    ...prev,
                    [key]: !isVis,
                  }))
                }
                className={`p-2 rounded-lg border text-left transition-colors flex items-center justify-between ${
                  isVis
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                }`}
              >
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                {isVis ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-600" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date Range Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/60 border border-neutral-800 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="font-medium text-neutral-300">View By Date Range:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-1 text-xs">
          {(['all', 'today', '7days', '30days', 'thisMonth'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateFilter(range)}
              className={`px-3 py-1 rounded-md transition-colors capitalize ${
                dateFilter === range
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {range === 'all'
                ? 'All Time'
                : range === '7days'
                ? 'Last 7 Days'
                : range === '30days'
                ? 'Last 30 Days'
                : range === 'thisMonth'
                ? 'This Month'
                : 'Today'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid (with customizer toggles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleMetrics.grossSales && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              Total Gross Ticket Sales
            </span>
            <div className="text-2xl font-bold font-mono text-white">
              LKR {totalGrossSales.toLocaleString()}
            </div>
            <p className="text-[11px] text-neutral-500">
              From {filteredOrders.length} successful Payments.lk orders
            </p>
          </div>
        )}

        {visibleMetrics.gatewayCommission && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                Payments.lk Commission
              </span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              LKR {totalGatewayCommission.toLocaleString()}
            </div>
            <p className="text-[11px] text-neutral-500">
              Formula: 2.6% fee + LKR 30 fixed per ticket order
            </p>
          </div>
        )}

        {visibleMetrics.netPayout && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
              Net Organizers Payout
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              LKR {totalNetPayout.toLocaleString()}
            </div>
            <p className="text-[11px] text-neutral-500">
              Disbursable to verified event organizer bank accounts
            </p>
          </div>
        )}

        {visibleMetrics.ticketsSold && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              Total Tickets Issued
            </span>
            <div className="text-2xl font-bold font-mono text-white">
              {totalTicketsSold}
            </div>
            <p className="text-[11px] text-neutral-500">
              Avg ticket price: LKR {totalTicketsSold > 0 ? Math.round(totalGrossSales / totalTicketsSold).toLocaleString() : 0}
            </p>
          </div>
        )}
      </div>

      {/* Visual Payments.lk Commission & Financial Transparency Breakdown Chart */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Event Revenue & Payments.lk Gateway Fee Breakdown
            </h3>
            <p className="text-xs text-neutral-400">
              Transparent side-by-side comparison of Gross Sales vs Payments.lk 2.6% Fee vs Net Payout
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-3 h-3 rounded bg-blue-500"></span> Gross
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-3 rounded bg-amber-500"></span> Fee (2.6%+30)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded bg-emerald-500"></span> Net Payout
            </span>
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="space-y-4 pt-2">
          {eventBreakdowns.map((item) => {
            const grossWidth = Math.max(4, Math.round((item.gross / maxGross) * 100));
            const commWidth = Math.max(2, Math.round((item.commission / maxGross) * 100));
            const netWidth = Math.max(4, Math.round((item.net / maxGross) * 100));

            return (
              <div key={item.eventId} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white truncate max-w-sm">{item.title}</span>
                  <div className="font-mono text-neutral-300 space-x-3 text-[11px]">
                    <span>Gross: <strong className="text-white">LKR {item.gross.toLocaleString()}</strong></span>
                    <span>Fee: <strong className="text-amber-400">LKR {item.commission.toLocaleString()}</strong></span>
                    <span>Net: <strong className="text-emerald-400">LKR {item.net.toLocaleString()}</strong></span>
                  </div>
                </div>

                <div className="h-4 w-full bg-neutral-950 rounded overflow-hidden flex gap-0.5">
                  <div
                    style={{ width: `${grossWidth}%` }}
                    className="h-full bg-blue-600 rounded-sm"
                    title={`Gross: LKR ${item.gross.toLocaleString()}`}
                  ></div>
                  <div
                    style={{ width: `${commWidth * 3}%` }} // slight optical scale for tiny fee visibility
                    className="h-full bg-amber-500 rounded-sm"
                    title={`Payments.lk Commission: LKR ${item.commission.toLocaleString()}`}
                  ></div>
                  <div
                    style={{ width: `${netWidth}%` }}
                    className="h-full bg-emerald-600 rounded-sm"
                    title={`Net Payout: LKR ${item.net.toLocaleString()}`}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Organizers Management Table & "Add Organizer" Button */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Event Organizers Management (Tenant Administration)
            </h3>
            <p className="text-xs text-neutral-400">
              Super Admin can provision new organizers and regulate Payments.lk gateway commission rates.
            </p>
          </div>
          <button
            onClick={() => setShowAddOrgModal(true)}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event Organizer</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 font-mono uppercase text-[10px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Organization & Contact</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Active Events</th>
                <th className="py-3 px-4">Gateway Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Tenant ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {organizers.map((org) => {
                const orgEvents = events.filter((e) => e.organizerId === org.id);

                return (
                  <tr key={org.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{org.company}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">{org.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{org.name}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">{org.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {orgEvents.length} Event{orgEvents.length !== 1 ? 's' : ''}
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-400">
                      {org.commissionRate}% + 30 LKR
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-2.5 h-2.5" /> {org.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-neutral-500 text-[11px]">
                      {org.id}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Event Organizer */}
      {showAddOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Add New Event Organizer
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Create an isolated tenant account. Organizers only have visibility into their own events.
            </p>

            <form onSubmit={handleCreateOrganizerSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={newOrgCompany}
                  onChange={(e) => setNewOrgCompany(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Colombo Symphony Trust"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Representative Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Dr. Kanishka Weerasinghe"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newOrgEmail}
                    onChange={(e) => setNewOrgEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="organizer@domain.lk"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newOrgPhone}
                    onChange={(e) => setNewOrgPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="+94 77 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Payments.lk Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newOrgCommission}
                  onChange={(e) => setNewOrgCommission(parseFloat(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Standard national rate is 2.6% + LKR 30 fixed per transaction.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddOrgModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
                >
                  Save Organizer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
