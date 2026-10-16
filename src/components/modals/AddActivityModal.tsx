import React, { useState } from 'react';
import { Trip, Activity, ActivityCategory, TimeSlot } from '../../types/trip.ts';
import { Plus, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddActivityModalProps {
  trip: Trip;
  initialDayId?: string;
  onUpdateTrip: (updated: Trip) => void;
  onClose: () => void;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  trip,
  initialDayId,
  onUpdateTrip,
  onClose,
}) => {
  const [dayId, setDayId] = useState(initialDayId || trip.days[0]?.id || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('Sightseeing');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('Morning');
  const [time, setTime] = useState('09:00 AM');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [cost, setCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [bookingRef, setBookingRef] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      title: title.trim(),
      category,
      timeSlot,
      time,
      location: location.trim(),
      address: address.trim() || undefined,
      cost: Number(cost) || 0,
      currency: trip.currency,
      status: 'planned',
      notes: notes.trim() || undefined,
      bookingRef: bookingRef.trim() || undefined,
      assignedTravellerIds: trip.travellers.map((t) => t.id),
      votes: { up: 1, down: 0 },
    };

    const updatedDays = trip.days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        activities: [...d.activities, newActivity],
      };
    });

    onUpdateTrip({ ...trip, days: updatedDays });
    confetti({ particleCount: 30, spread: 50 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 text-white scrollbar-none"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold">Add Itinerary Event</h3>
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
          <label className="text-xs font-semibold text-slate-300 block mb-1">Target Day:</label>
          <select
            value={dayId}
            onChange={(e) => setDayId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          >
            {trip.days.map((d) => (
              <option key={d.id} value={d.id}>
                Day {d.dayNumber} ({d.date}) - {d.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Activity Title:</label>
          <input
            type="text"
            required
            placeholder="e.g. Amber Fort Sunrise Tour"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Sightseeing">Sightseeing</option>
              <option value="Dining">Dining</option>
              <option value="Hotel">Hotel</option>
              <option value="Transit">Transit</option>
              <option value="Adventure">Adventure</option>
              <option value="Culture">Culture</option>
              <option value="Leisure">Leisure</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Slot:</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Time:</label>
            <input
              type="text"
              required
              placeholder="e.g. 09:30 AM"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Est. Cost ({trip.currency}):
            </label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Location / Venue:</label>
          <input
            type="text"
            required
            placeholder="e.g. Tenryu-ji Zen Garden"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Booking Ref (Optional):</label>
          <input
            type="text"
            placeholder="e.g. JR-EAST-99120"
            value={bookingRef}
            onChange={(e) => setBookingRef(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Notes / Insider Tips:</label>
          <textarea
            rows={2}
            placeholder="Bring cash for entry gate; slip-on shoes recommended."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white resize-none"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 rounded-xl btn-cyan text-slate-950 text-xs font-bold shadow-md cursor-pointer"
          >
            Add Activity
          </button>
        </div>
      </form>
    </div>
  );
};
