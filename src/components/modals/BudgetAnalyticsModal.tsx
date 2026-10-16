import React from 'react';
import { Trip } from '../../types/trip.ts';
import {
  BarChart3,
  X,
  PieChart,
} from 'lucide-react';

interface BudgetAnalyticsModalProps {
  trip: Trip;
  onClose: () => void;
}

export const BudgetAnalyticsModal: React.FC<BudgetAnalyticsModalProps> = ({
  trip,
  onClose,
}) => {
  const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = Math.max(0, trip.totalBudget - totalSpent);
  const burnPercent = Math.min(100, Math.round((totalSpent / (trip.totalBudget || 1)) * 100));

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  trip.expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const categoryColors: Record<string, string> = {
    Stay: 'bg-indigo-500',
    Food: 'bg-amber-500',
    Transport: 'bg-emerald-500',
    Activities: 'bg-cyan-500',
    Shopping: 'bg-purple-500',
    General: 'bg-slate-500',
  };

  // Travellers spending breakdown
  const travellerSpending: Record<string, number> = {};
  trip.expenses.forEach((e) => {
    travellerSpending[e.paidById] = (travellerSpending[e.paidById] || 0) + e.amount;
  });

  const daysCount = Math.max(1, trip.days.length);
  const avgDailySpend = Math.round(totalSpent / daysCount);
  const targetDailyBudget = Math.round(trip.totalBudget / daysCount);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg h-[620px] max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Trip Budget & Analytics</span>
              </h3>
              <p className="text-[11px] text-slate-400">Financial health & group spending allocation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
          {/* Top Health Card */}
          <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Total Expedition Outlay
                </span>
                <div className="text-2xl font-black text-white font-mono mt-0.5">
                  {trip.currency} {totalSpent.toLocaleString()}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Remaining Capital
                </span>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                  {trip.currency} {remaining.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              {Object.entries(categoryTotals).map(([cat, amount]) => {
                const widthPercent = (amount / (totalSpent || 1)) * 100;
                return (
                  <div
                    key={cat}
                    title={`${cat}: ${Math.round(widthPercent)}%`}
                    className={`${categoryColors[cat] || 'bg-slate-500'} h-full transition-all`}
                    style={{ width: `${widthPercent}%` }}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Budget Burn: <strong>{burnPercent}%</strong></span>
              <span>Daily Pace: <strong>{trip.currency} {avgDailySpend.toLocaleString()}</strong> / day (Target: {trip.currency} {targetDailyBudget.toLocaleString()})</span>
            </div>
          </div>

          {/* Category Breakdown List */}
          <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-cyan-400" />
              <span>Spend by Category</span>
            </h4>

            <div className="space-y-2.5">
              {Object.entries(categoryTotals).map(([cat, amount]) => {
                const pct = Math.round((amount / (totalSpent || 1)) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${categoryColors[cat] || 'bg-slate-500'}`} />
                        <span className="font-semibold text-slate-200">{cat}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[11px]">{pct}%</span>
                        <span className="font-bold text-white font-mono">
                          {trip.currency} {amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`${categoryColors[cat] || 'bg-slate-500'} h-full rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spending By Traveller */}
          <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Paid By Traveller
            </h4>

            <div className="space-y-2">
              {trip.travellers.map((traveller) => {
                const paid = travellerSpending[traveller.id] || 0;
                const pct = Math.round((paid / (totalSpent || 1)) * 100);

                return (
                  <div
                    key={traveller.id}
                    className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={traveller.avatar}
                        alt={traveller.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <span className="font-bold text-white">{traveller.name}</span>
                        <span className="text-[10px] text-slate-400 block">{traveller.role}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-white block">
                        {trip.currency} {paid.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{pct}% of group spend</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
