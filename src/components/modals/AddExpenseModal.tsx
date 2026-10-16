import React, { useState } from 'react';
import { Trip, Expense, ExpenseSplit, SplitMode } from '../../types/trip.ts';
import { Receipt, X, Check, Split } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddExpenseModalProps {
  trip: Trip;
  onUpdateTrip: (updated: Trip) => void;
  onClose: () => void;
  prefill?: Partial<Expense>;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  trip,
  onUpdateTrip,
  onClose,
  prefill,
}) => {
  const [title, setTitle] = useState(prefill?.title || '');
  const [amount, setAmount] = useState(prefill?.amount ? prefill.amount.toString() : '');
  const [currency, setCurrency] = useState(prefill?.currency || trip.currency || 'INR');
  const [category, setCategory] = useState<Expense['category']>(prefill?.category || 'Food');
  const [paidById, setPaidById] = useState<string>(prefill?.paidById || trip.travellers[0]?.id || 'u-1');
  const [date, setDate] = useState(prefill?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(prefill?.notes || '');

  // Split Mode State
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');

  // Selected travellers for 'selected' split mode
  const [selectedTravellerIds, setSelectedTravellerIds] = useState<string[]>(
    trip.travellers.map((t) => t.id)
  );

  // Exact custom amounts mapping
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});

  // Percentage mapping
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  // Single person assignment
  const [singleBeneficiaryId, setSingleBeneficiaryId] = useState<string>(trip.travellers[0]?.id || 'u-1');

  const numAmount = Number(amount || 0);

  const toggleSelectTraveller = (id: string) => {
    if (selectedTravellerIds.includes(id)) {
      if (selectedTravellerIds.length > 1) {
        setSelectedTravellerIds(selectedTravellerIds.filter((tId) => tId !== id));
      }
    } else {
      setSelectedTravellerIds([...selectedTravellerIds, id]);
    }
  };

  const calculateSplits = (): ExpenseSplit[] => {
    if (splitMode === 'equal') {
      const count = Math.max(1, trip.travellers.length);
      const perPerson = Math.round(numAmount / count);
      return trip.travellers.map((t) => ({
        travellerId: t.id,
        amount: perPerson,
        percentage: Math.round(100 / count),
      }));
    }

    if (splitMode === 'selected') {
      const count = Math.max(1, selectedTravellerIds.length);
      const perPerson = Math.round(numAmount / count);
      return trip.travellers.map((t) => ({
        travellerId: t.id,
        amount: selectedTravellerIds.includes(t.id) ? perPerson : 0,
        percentage: selectedTravellerIds.includes(t.id) ? Math.round(100 / count) : 0,
      }));
    }

    if (splitMode === 'exact') {
      return trip.travellers.map((t) => ({
        travellerId: t.id,
        amount: Number(exactAmounts[t.id] || 0),
      }));
    }

    if (splitMode === 'percentage') {
      return trip.travellers.map((t) => {
        const pct = Number(percentages[t.id] || 0);
        return {
          travellerId: t.id,
          amount: Math.round((numAmount * pct) / 100),
          percentage: pct,
        };
      });
    }

    if (splitMode === 'single') {
      return trip.travellers.map((t) => ({
        travellerId: t.id,
        amount: t.id === singleBeneficiaryId ? numAmount : 0,
        percentage: t.id === singleBeneficiaryId ? 100 : 0,
      }));
    }

    return [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !numAmount) return;

    const splits = calculateSplits();

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      title: title.trim(),
      amount: numAmount,
      currency,
      category,
      date,
      paidById,
      splitType: splitMode,
      splits,
      notes: notes.trim() || undefined,
    };

    const newDebts = splits
      .filter((s) => s.travellerId !== paidById && s.amount > 0)
      .map((s) => ({
        fromTravellerId: s.travellerId,
        toTravellerId: paidById,
        amount: s.amount,
        currency,
        settled: false,
      }));

    onUpdateTrip({
      ...trip,
      expenses: [newExpense, ...trip.expenses],
      settlements: [...trip.settlements, ...newDebts],
    });

    confetti({ particleCount: 35, spread: 55 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-white scrollbar-none"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold">Add Group Expense</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Expense Description <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Amber Palace entry, Highway Dhaba dinner, Taxi transfer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Total Amount ({currency}) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              placeholder="2400"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Currency:</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="JPY">JPY (¥) - Japanese Yen</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="Food">Food & Dining</option>
              <option value="Stay">Accommodation & Hotels</option>
              <option value="Transport">Trains, Flights, Cabs</option>
              <option value="Activities">Activities & Sightseeing</option>
              <option value="Shopping">Shopping & Gifts</option>
              <option value="General">General / Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Paid By:</label>
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {trip.travellers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SPLIT TYPE PICKER */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-300 block flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Split className="w-3.5 h-3.5 text-cyan-400" />
              <span>How Should This Be Split?</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Multiple Split Modes</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'equal', label: 'All (Entire Trip)' },
              { id: 'selected', label: 'Selected People (1,2,3...)' },
              { id: 'exact', label: 'Exact Amounts' },
              { id: 'percentage', label: 'By % Shares' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSplitMode(mode.id as SplitMode)}
                className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition-all text-center cursor-pointer ${
                  splitMode === mode.id
                    ? 'btn-cyan shadow-sm font-bold text-slate-950'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* EQUAL MODE PREVIEW */}
          {splitMode === 'equal' && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-center text-slate-300">
              <span>Split equally among all {trip.travellers.length} travellers:</span>
              <span className="font-mono font-bold text-cyan-300">
                {currency} {Math.round(numAmount / Math.max(1, trip.travellers.length)).toLocaleString()} / person
              </span>
            </div>
          )}

          {/* SELECTED PEOPLE (1, 2, 3...) MODE */}
          {splitMode === 'selected' && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="text-slate-400 block text-[11px]">
                Choose who shares this expense ({selectedTravellerIds.length} selected):
              </span>
              <div className="grid grid-cols-2 gap-2">
                {trip.travellers.map((traveller) => {
                  const isChecked = selectedTravellerIds.includes(traveller.id);
                  return (
                    <button
                      key={traveller.id}
                      type="button"
                      onClick={() => toggleSelectTraveller(traveller.id)}
                      className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={traveller.avatar}
                          alt={traveller.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-semibold text-xs truncate">{traveller.name}</span>
                      </div>
                      {isChecked && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="pt-1 text-right font-mono font-bold text-cyan-300 text-xs">
                {currency} {Math.round(numAmount / Math.max(1, selectedTravellerIds.length)).toLocaleString()} per selected person
              </div>
            </div>
          )}

          {/* EXACT AMOUNTS MODE */}
          {splitMode === 'exact' && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="text-slate-400 block text-[11px]">
                Enter exact rupee amount for each traveller:
              </span>
              <div className="space-y-2">
                {trip.travellers.map((traveller) => (
                  <div key={traveller.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-slate-300">{traveller.name}:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">{currency}</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={exactAmounts[traveller.id] || ''}
                        onChange={(e) =>
                          setExactAmounts({ ...exactAmounts, [traveller.id]: e.target.value })
                        }
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PERCENTAGE MODE */}
          {splitMode === 'percentage' && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="text-slate-400 block text-[11px]">
                Enter percentage for each person (total should be 100%):
              </span>
              <div className="space-y-2">
                {trip.travellers.map((traveller) => (
                  <div key={traveller.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-slate-300">{traveller.name}:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="25"
                        value={percentages[traveller.id] || ''}
                        onChange={(e) =>
                          setPercentages({ ...percentages, [traveller.id]: e.target.value })
                        }
                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs font-mono text-white"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Notes / Merchant:</label>
          <input
            type="text"
            placeholder="e.g. Card payment, receipt attached, service fee"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl btn-cyan text-slate-950 text-xs font-bold shadow-md cursor-pointer"
          >
            Save & Split Expense
          </button>
        </div>
      </form>
    </div>
  );
};
