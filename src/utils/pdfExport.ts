import { jsPDF } from 'jspdf';
import { OrderItem } from '../data/mockData';

export function exportSalesReportPDF(
  title: string,
  subtitle: string,
  metrics: {
    grossSales: number;
    netPayout: number;
    gatewayCommission: number;
    ticketsSold: number;
    ordersCount: number;
  },
  orders: OrderItem[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const amberColor = [217, 119, 6]; // Amber 600
  const mutedColor = [100, 116, 139]; // Slate 500

  // Brand Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('TicketPulse Financial Report', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(`Generated: ${new Date().toLocaleString()} · Payments.lk Settlement Statement`, 14, 26);
  doc.text(`Scope: ${title} (${subtitle})`, 14, 31);

  // Line Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35);

  // Executive Summary Cards
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 40, 42, 22, 'F');
  doc.rect(60, 40, 42, 22, 'F');
  doc.rect(106, 40, 42, 22, 'F');
  doc.rect(152, 40, 44, 22, 'F');

  doc.setFontSize(8);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('GROSS SALES', 18, 46);
  doc.text('NET ORGANIZER PAYOUT', 64, 46);
  doc.text('GATEWAY COMMISSION (2.6%+30)', 110, 46);
  doc.text('TICKETS SOLD', 156, 46);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`LKR ${metrics.grossSales.toLocaleString()}`, 18, 54);
  doc.text(`LKR ${metrics.netPayout.toLocaleString()}`, 64, 54);

  doc.setTextColor(amberColor[0], amberColor[1], amberColor[2]);
  doc.text(`LKR ${metrics.gatewayCommission.toLocaleString()}`, 110, 54);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${metrics.ticketsSold} (${metrics.ordersCount} orders)`, 156, 54);

  // Section Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Verified Transaction Ledger', 14, 72);

  // Table Header
  let y = 78;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Ref / Date', 16, y + 5.5);
  doc.text('Attendee & Event', 52, y + 5.5);
  doc.text('Gross (LKR)', 120, y + 5.5);
  doc.text('Gateway Fee', 150, y + 5.5);
  doc.text('Net Payout', 174, y + 5.5);

  y += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  orders.slice(0, 18).forEach((ord) => {
    doc.setTextColor(51, 65, 85);
    doc.text(ord.bookingRef, 16, y + 4);

    const dateStr = ord.createdAt.split('T')[0];
    doc.setFontSize(7);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(dateStr, 16, y + 7.5);

    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const eventNameShort = ord.eventTitle.length > 32 ? ord.eventTitle.substring(0, 32) + '...' : ord.eventTitle;
    doc.text(eventNameShort, 52, y + 4);

    doc.setFontSize(7);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`${ord.customerName} (${ord.ticketItems.reduce((a, b) => a + b.quantity, 0)} tix)`, 52, y + 7.5);

    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(ord.finalTotal.toLocaleString(), 120, y + 5.5);

    doc.setTextColor(amberColor[0], amberColor[1], amberColor[2]);
    doc.text(ord.gatewayCommission.toLocaleString(), 150, y + 5.5);

    doc.setTextColor(16, 185, 129); // Green
    doc.text(ord.organizerNetPayout.toLocaleString(), 174, y + 5.5);

    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 9.5, 196, y + 9.5);
    y += 10;
  });

  // Footer Disclaimer
  doc.setFontSize(7);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Payments.lk Transparent Settlement Notice: Standard merchant gateway fee (2.6% + LKR 30 fixed) calculated in real time.', 14, 280);
  doc.text('TicketPulse Multi-Tenant Platform · Powered by Payments.lk Gateway', 14, 284);

  doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
}

export function exportSingleTicketPDF(order: OrderItem, qrDataUrl: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const primary = [15, 23, 42];
  const amber = [217, 119, 6];

  // Header banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 148, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('TicketPulse Official E-Pass', 12, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Booking Ref: ${order.bookingRef} · Entrance Pass`, 12, 21);

  // Event Details
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(order.eventTitle, 12, 38, { maxWidth: 124 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date & Time: ${order.eventDate}`, 12, 48);

  // QR Code Image
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', 44, 54, 60, 60);
  }

  // Attendee Info
  doc.setFillColor(248, 250, 252);
  doc.rect(12, 118, 124, 40, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(12, 118, 124, 40, 'D');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('ATTENDEE NAME', 16, 125);
  doc.text('TOTAL TICKETS', 80, 125);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text(order.customerName, 16, 131);
  doc.text(`${order.ticketItems.reduce((s, t) => s + t.quantity, 0)} Person(s)`, 80, 131);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('ASSIGNED SEATS', 16, 140);
  doc.text('PAYMENT VERIFICATION', 80, 140);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const seatsStr = order.seats.length > 0 ? order.seats.map(s => `${s.row}${s.number}`).join(', ') : 'Open Arena / General';
  doc.text(seatsStr, 16, 146);
  doc.setTextColor(amber[0], amber[1], amber[2]);
  doc.text(`PAID LKR ${order.finalTotal.toLocaleString()}`, 80, 146);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Present this digital pass or printed copy at the entrance scanner.', 12, 172);
  doc.text('Processed securely via Payments.lk Gateway · Non-transferable ticket.', 12, 177);

  doc.save(`TicketPass_${order.bookingRef}.pdf`);
}
