import React from 'react';
import { Seat, TicketTier, getGroupDiscountPercent } from '../utils/ticketing';
import { Info, Sparkles, Check } from 'lucide-react';
import { AppTheme } from '../utils/theme';

interface SeatMapProps {
  seats: Seat[];
  tiers: TicketTier[];
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
  maxSeats?: number;
  theme?: AppTheme;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  tiers,
  selectedSeatIds,
  onToggleSeat,
  maxSeats = 10,
  theme = 'bw-dark',
}) => {
  const isLight = theme === 'bw-light';
  const isBW = theme === 'bw-dark' || theme === 'bw-light';

  // Group seats by row
  const rowsMap: { [row: string]: Seat[] } = {};
  seats.forEach((seat) => {
    if (!rowsMap[seat.row]) {
      rowsMap[seat.row] = [];
    }
    rowsMap[seat.row].push(seat);
  });

  const rowKeys = Object.keys(rowsMap).sort();

  const getTier = (tierId: string) => {
    return tiers.find((t) => t.id === tierId) || tiers[0];
  };

  const selectedCount = selectedSeatIds.length;
  const groupDiscount = getGroupDiscountPercent(selectedCount);

  const containerBg = isLight
    ? 'bg-white border-neutral-300 text-neutral-900 shadow-sm'
    : 'bg-neutral-900/90 border-neutral-800 text-white';

  const stageLine = isLight
    ? 'from-neutral-300 via-neutral-900 to-neutral-300'
    : isBW
    ? 'from-neutral-800 via-white to-neutral-800'
    : 'from-neutral-800 via-amber-500/60 to-neutral-800';

  return (
    <div className={`border rounded-xl p-4 sm:p-6 transition-colors ${containerBg}`}>
      {/* Stage Header */}
      <div className="text-center mb-8">
        <div className="relative mx-auto max-w-md">
          <div className={`h-2 w-full bg-gradient-to-r ${stageLine} rounded-full mb-2`}></div>
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
            ▲ STAGE / AUDITORIUM SCREEN FOCUS ▲
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6 text-xs text-neutral-400">
        <div className="flex items-center gap-1.5">
          <div className={`w-3.5 h-3.5 rounded ${isLight ? 'bg-neutral-200 border border-neutral-900' : isBW ? 'bg-white/20 border border-white' : 'bg-amber-500/20 border border-amber-500'}`}></div>
          <span className={isLight ? 'text-neutral-800' : 'text-neutral-300'}>
            VIP (LKR {tiers.find(t => t.id === 'tier-vip')?.priceLKR.toLocaleString() || '12,500'})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-3.5 h-3.5 rounded ${isLight ? 'bg-neutral-100 border border-neutral-500' : isBW ? 'bg-neutral-700 border border-neutral-400' : 'bg-blue-500/20 border border-blue-500'}`}></div>
          <span className={isLight ? 'text-neutral-800' : 'text-neutral-300'}>
            Premium (LKR {tiers.find(t => t.id === 'tier-prem')?.priceLKR.toLocaleString() || '7,500'})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-3.5 h-3.5 rounded ${isLight ? 'bg-neutral-50 border border-neutral-300' : isBW ? 'bg-neutral-900 border border-neutral-700' : 'bg-emerald-500/20 border border-emerald-500'}`}></div>
          <span className={isLight ? 'text-neutral-800' : 'text-neutral-300'}>
            General (LKR {tiers.find(t => t.id === 'tier-gen')?.priceLKR.toLocaleString() || '3,500'})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-3.5 h-3.5 rounded font-bold flex items-center justify-center ${isLight ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950'}`}>
            <Check className="w-2.5 h-2.5" />
          </div>
          <span className={`font-medium ${isLight ? 'text-neutral-950 font-bold' : 'text-white'}`}>Your Selection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-3.5 h-3.5 rounded border opacity-60 ${isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-800/80 border-neutral-700'}`}></div>
          <span className="text-neutral-500">Reserved / Sold</span>
        </div>
      </div>

      {/* Seating Grid */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[480px] flex flex-col items-center gap-3">
          {rowKeys.map((row) => (
            <div key={row} className="flex items-center gap-2">
              <span className={`w-6 text-xs font-mono font-bold text-right pr-1 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                {row}
              </span>

              <div className="flex items-center gap-2">
                {rowsMap[row].map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.id);
                  const isSold = seat.status === 'sold' || seat.status === 'reserved';
                  const tier = getTier(seat.tierId);

                  let colorStyle = '';
                  if (isBW) {
                    if (isLight) {
                      if (seat.tierId === 'tier-vip') {
                        colorStyle = 'border-neutral-900 bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-medium';
                      } else if (seat.tierId === 'tier-prem') {
                        colorStyle = 'border-neutral-500 bg-white hover:bg-neutral-100 text-neutral-800';
                      } else {
                        colorStyle = 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-700';
                      }
                      if (isSelected) {
                        colorStyle = 'bg-neutral-950 text-white border-neutral-950 font-bold ring-2 ring-neutral-950/40 scale-105';
                      } else if (isSold) {
                        colorStyle = 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through opacity-60';
                      }
                    } else {
                      // B&W Dark
                      if (seat.tierId === 'tier-vip') {
                        colorStyle = 'border-white/80 bg-white/10 hover:bg-white/20 text-white font-medium';
                      } else if (seat.tierId === 'tier-prem') {
                        colorStyle = 'border-neutral-500 bg-neutral-800 hover:bg-neutral-700 text-neutral-200';
                      } else {
                        colorStyle = 'border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300';
                      }
                      if (isSelected) {
                        colorStyle = 'bg-white text-neutral-950 border-white font-bold ring-2 ring-white/60 scale-105';
                      } else if (isSold) {
                        colorStyle = 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed line-through opacity-50';
                      }
                    }
                  } else {
                    // Classic Color
                    colorStyle = 'border-neutral-700 bg-neutral-800/60 hover:border-neutral-500 text-neutral-200';
                    if (seat.tierId === 'tier-vip') {
                      colorStyle = 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200';
                    } else if (seat.tierId === 'tier-prem') {
                      colorStyle = 'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 text-blue-200';
                    } else {
                      colorStyle = 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200';
                    }
                    if (isSelected) {
                      colorStyle = 'bg-amber-500 text-neutral-950 border-amber-400 font-bold ring-2 ring-amber-400/50 scale-105';
                    } else if (isSold) {
                      colorStyle = 'bg-neutral-800/60 text-neutral-600 border-neutral-800 cursor-not-allowed line-through opacity-50';
                    }
                  }

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={isSold}
                      onClick={() => onToggleSeat(seat.id)}
                      title={`Row ${seat.row} Seat ${seat.number} (${tier.name}) - LKR ${tier.priceLKR.toLocaleString()}`}
                      aria-label={`Row ${seat.row} Seat ${seat.number} ${isSold ? 'Sold' : isSelected ? 'Selected' : 'Available'}`}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-xs font-mono transition-all flex items-center justify-center border cursor-pointer ${colorStyle}`}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>

              <span className={`w-6 text-xs font-mono font-bold text-left pl-1 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                {row}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Group discount progress pill */}
      <div className={`mt-4 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${isLight ? 'border-neutral-200' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2">
          <Info className={`w-4 h-4 shrink-0 ${isLight ? 'text-neutral-700' : isBW ? 'text-neutral-300' : 'text-amber-400'}`} />
          {selectedCount < 4 ? (
            <span className={isLight ? 'text-neutral-600' : 'text-neutral-400'}>
              Select <strong className={`font-mono ${isLight ? 'text-neutral-950 font-bold' : isBW ? 'text-white' : 'text-amber-300'}`}>{4 - selectedCount} more</strong> seat{4 - selectedCount > 1 ? 's' : ''} to unlock{' '}
              <strong className={isLight ? 'text-neutral-950 font-bold' : isBW ? 'text-white' : 'text-amber-300'}>10% Group Discount</strong>.
            </span>
          ) : selectedCount < 8 ? (
            <span className={`font-medium ${isLight ? 'text-neutral-950' : isBW ? 'text-white' : 'text-emerald-400'}`}>
              10% Group Discount unlocked! Select <strong className="font-mono">{8 - selectedCount} more</strong> for{' '}
              <strong>15% off</strong>.
            </span>
          ) : (
            <span className={`font-medium flex items-center gap-1 ${isLight ? 'text-neutral-950' : isBW ? 'text-white' : 'text-emerald-400'}`}>
              <Sparkles className="w-3.5 h-3.5" /> Maximum 15% Group Discount applied!
            </span>
          )}
        </div>

        <div className={`font-mono ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`}>
          Selected: <strong className={isLight ? 'text-neutral-950 font-bold' : isBW ? 'text-white' : 'text-amber-400'}>{selectedCount}</strong> / {maxSeats} seats
        </div>
      </div>
    </div>
  );
};
