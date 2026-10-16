import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Package,
  Sparkles,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PackingCategory, PackingItem, Trip } from '../types/travel.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface PackingTabProps {
  trip: Trip;
  packingItems: PackingItem[];
  onToggleItem: (id: string, packed: boolean) => Promise<void>;
  onAddItem: (item: PackingItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export const PackingTab: React.FC<PackingTabProps> = ({
  trip,
  packingItems,
  onToggleItem,
  onAddItem,
  onDeleteItem
}) => {
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<PackingCategory | 'all'>('all');
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<PackingCategory>('essentials');
  const [submitting, setSubmitting] = useState(false);

  const categories: { key: PackingCategory; label: string }[] = [
    { key: 'essentials', label: 'Essentials' },
    { key: 'clothing', label: 'Clothing' },
    { key: 'electronics', label: 'Tech & Gadgets' },
    { key: 'meds', label: 'Medicines & First-Aid' },
    { key: 'toiletries', label: 'Toiletries' },
    { key: 'documents', label: 'Passports & Passes' }
  ];

  const packedCount = packingItems.filter((i) => i.packed).length;
  const totalCount = packingItems.length;
  const percent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  const filteredItems = packingItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const handleToggle = async (item: PackingItem) => {
    const nextState = !item.packed;
    await onToggleItem(item.id, nextState);
    if (nextState && packedCount + 1 === totalCount) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setSubmitting(true);

    try {
      const item: PackingItem = {
        id: 'pack_' + Date.now(),
        tripId: trip.id,
        item: newItemText.trim(),
        category: newItemCategory,
        packed: false,
        createdBy: currentUser?.uid || 'user_local',
        createdAt: new Date().toISOString()
      };
      await onAddItem(item);
      setNewItemText('');
    } catch (err) {
      console.error('Error adding item:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const addPresetBundle = async (presetItems: { text: string; cat: PackingCategory }[]) => {
    if (!currentUser) return;
    for (const p of presetItems) {
      if (packingItems.some((i) => i.item.toLowerCase() === p.text.toLowerCase())) continue;
      await onAddItem({
        id: 'pack_' + Math.random().toString(36).substring(2, 9),
        tripId: trip.id,
        item: p.text,
        category: p.cat,
        packed: false,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Progress Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-sky-500" />
              Smart Luggage & Packing Checklist
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sync packed luggage items in real-time across your devices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {packedCount} of {totalCount} Packed ({percent}%)
            </span>
            {percent === 100 && totalCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <Trophy className="w-3.5 h-3.5" />
                All Set!
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Quick Starter Bundles */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Add Kits:
          </span>
          <button
            onClick={() =>
              addPresetBundle([
                { text: 'Sunscreen SPF 50+', cat: 'essentials' },
                { text: 'UV Sunglasses & Hat', cat: 'essentials' },
                { text: 'Quick-dry Swimwear', cat: 'clothing' },
                { text: 'Waterproof Phone Pouch', cat: 'electronics' }
              ])
            }
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors"
          >
            + Beach Kit
          </button>
          <button
            onClick={() =>
              addPresetBundle([
                { text: 'Compact Umbrella / Raincoat', cat: 'clothing' },
                { text: 'Waterproof Backpack Cover', cat: 'essentials' },
                { text: 'Mosquito Repellent Odomos', cat: 'meds' },
                { text: 'Silica Gel Pouches for Bags', cat: 'essentials' }
              ])
            }
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors"
          >
            + Monsoon Kit
          </button>
          <button
            onClick={() =>
              addPresetBundle([
                { text: '20,000 mAh Fast Powerbank', cat: 'electronics' },
                { text: 'Multi-port USB-C Wall Charger', cat: 'electronics' },
                { text: 'Noise-canceling Earbuds', cat: 'electronics' }
              ])
            }
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors"
          >
            + Tech Gear Kit
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      <form
        onSubmit={handleAddItem}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <input
          type="text"
          required
          maxLength={150}
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add an item to luggage (e.g. Hiking boots, Camera battery)..."
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
        />

        <select
          value={newItemCategory}
          onChange={(e) => setNewItemCategory(e.target.value as PackingCategory)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
        >
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={submitting || !newItemText.trim()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-sky-500 text-slate-950 font-bold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All Items ({packingItems.length})
        </button>
        {categories.map((c) => {
          const count = packingItems.filter((i) => i.category === c.key).length;
          return (
            <button
              key={c.key}
              onClick={() => setSelectedCategory(c.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.key
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Checklist Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">No items under this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                item.packed
                  ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/60 opacity-60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
              }`}
            >
              <button
                onClick={() => handleToggle(item)}
                className="flex items-center gap-3 text-left flex-1"
              >
                {item.packed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 hover:text-sky-500 shrink-0 transition-colors" />
                )}
                <span
                  className={`text-sm ${
                    item.packed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100 font-medium'
                  }`}
                >
                  {item.item}
                </span>
              </button>

              <button
                onClick={() => onDeleteItem(item.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
